import _, { camelCase } from "lodash";
import {
	TYPE,
	FIELD_TYPE,
	PANEL_TYPE,
	IDS,
	MODEL_TYPE,
	DEFAULT_VALUE,
	typeReplacer as TYPE_REPLACER,
} from "./constants";
import { modelFields } from "./fields";
import convert from "xml-js";
import { validate } from "./store/validation";
import format from "xml-beautifier";
import { eGeneratePath } from "./store/xpathGenerator";
import { processMoves } from "./store/computeXML";
import dasherize from "dasherize";

export function camleCaseString(word) {
	let string =
		word &&
		word.replace(/([A-Z])/g, " $1").replace(/^./, function (str) {
			return str.toUpperCase();
		});
	return string;
}

export const caseConverter = (value, isCamelCase = true) => {
	if (!value) return;
	value = value.trim();
	let convertedText;
	if (isCamelCase) {
		convertedText = camelCase(value);
	} else {
		let textToConvert = camelCase(value);
		convertedText = textToConvert[0].toUpperCase() + textToConvert.slice(1);
	}
	return convertedText;
};

export const capitalizeFirst = (value) => {
	let result = value.replace(/([A-Z])/g, " $1");
	let finalResult =
		result && result.charAt(0).toUpperCase() + result.slice(1).toLowerCase();
	return finalResult;
};

export function translate(str) {
	if (window && window.top && window.top._t && typeof str === "string") {
		return window.top._t(str);
	}
	return str;
}

const getSpacer = ({ widget, id, ...other }) => ({
	colSpan: widget.colSpan || 1,
	serverType: FIELD_TYPE.spacer,
	type: TYPE.field,
	name: `spacer${id}`,
	title: "Spacer",
	...other,
});

// this function is not being used anywhere
// TODO: delete this
export const getGrid = (
	state,
	{ cols = 12, items },
	trackElement,
	isCustomField = false
) => {
	const widgets = isCustomField ? state.customFieldWidgets : state.widgets;
	const grid = [];
	let ind = 0;
	let span = 0;
	let row = [];

	let fillRow = (start) => {
		for (let i = start; i < cols; i++) {
			row.push({ index: i, item: true, colSpan: 1, indices: [i] });
		}
	};

	items.forEach((item) => {
		let parentPanelIndex = Object.keys(widgets).find(
			(widgetIndex) =>
				widgets[widgetIndex].type === "panel" &&
				widgets[widgetIndex].items?.includes(item)
		);

		let colSpan = Number(
			JSON.parse(widgets[item].widgetAttrs || "{}").colSpan ||
				JSON.parse(widgets[parentPanelIndex].widgetAttrs || "{}").itemSpan ||
				widgets[item].colSpan ||
				1
		);
		span += colSpan;
		//next row
		if (span > cols) {
			fillRow(ind);
			ind = 0;
			span = colSpan;
			grid.push(row);
			row = [];
		}
		trackElement &&
			trackElement(item, {
				column: ind,
				row: grid.length,
			});
		row.push({
			index: ind,
			item,
			colSpan,
			indices: new Array(colSpan).fill(0).map((x, i) => ind + i),
		});
		ind += colSpan;
	});

	fillRow(ind);
	grid.push(row);
	return grid;
};

export const arrangeGrid = (state, { id, index, panelId }, widgetType) => {
	const extendList = [];
	const isCustomField = widgetType === "customField";
	const widgets = isCustomField ? state.customFieldWidgets : state.widgets;
	const panel = widgets[panelId];
	const removeWidget = widgets[id] || { colSpan: 1 };
	const removedWidgetColSpan = JSON.parse(
		removeWidget.widgetAttrs || "{}"
	).colSpan;
	const isLastItemRemove = panel.items[panel.items.length - 1] === id;
	let ids = [];

	const isLastItemSpacer = (items) => {
		if (!items || !items.length) return false;
		const lastItem = items[items.length - 1];
		const lastWidget = widgets[lastItem];
		return lastWidget.type === "spacer" || lastWidget.serverType === "spacer";
	};

	const deleteItem = panel.items.splice(index, 1);

	if (isLastItemRemove) {
		// Delete all spacers at the end of panel
		while (isLastItemSpacer(panel.items)) {
			ids.push(panel.items.pop());
		}
	}

	//  TODO: deleteItem is an Array, use id instead
	if (
		!(
			widgets[deleteItem].type === "spacer" ||
			widgets[deleteItem].serverType === "spacer"
		) &&
		!isLastItemRemove
	) {
		let newId = _.uniqueId();
		let otherProps = {};
		if (state.modelType === MODEL_TYPE.CUSTOM) {
			otherProps = {
				model: removeWidget.model,
				modelField: removeWidget.modelField,
			};
		}
		const getWidgetAttrs = () => {
			// if removed widget has colSpan in its widgetAttrs, copy it to the spacer
			if (removedWidgetColSpan)
				return {
					widgetAttrs: JSON.stringify({
						colSpan: removedWidgetColSpan,
					}),
				};
			// make spacer occupy 12 colSpan for separator
			if (removeWidget.type === FIELD_TYPE.separator) {
				return { widgetAttrs: JSON.stringify({ colSpan: 12 }) };
			}
			return {};
		};
		//creating spacer for the removed widget
		widgets[newId] = getSpacer({
			widget: {},
			id: newId,
			colSpan: removeWidget.colSpan,
			...getWidgetAttrs(),
			...otherProps,
		});
		const targetWidget = widgets[panel.items[index]];
		isExtensionView(state) &&
			extendList.push({
				name: "insert",
				position: "before",
				elements: [widgets[newId]],
				target: targetWidget.xPath,
			});
		panel.items.splice(index, 0, newId);
	}
	return { ids: [...ids, id], extendList };
};

// generates widgets(spacers)
const collectWidgets = ({
	grid,
	items,
	widgetIndex,
	widgetId,
	currentRowIndex,
}) => {
	let beforeWidgets = [];
	let afterWidgets = [];
	let flag = true;
	let itemIndex = 0;
	const prevRowIndex = currentRowIndex - 1;
	const nextRowIndex = currentRowIndex + 1;
	grid.forEach((cell, cellIndex) => {
		if (
			!cell.separator &&
			cell.rowIndex >= prevRowIndex && // consider only for prevRow, currentRow, nextRow
			cell.rowIndex <= nextRowIndex
		) {
			cell.colSpan = Number(cell.colSpan || 1);
			if (cell.id && flag && cellIndex < widgetIndex) {
				itemIndex = items.indexOf(cell.id) + 1;
			}
			if (cell.rowIndex <= currentRowIndex) {
				// if current row or prev row
				if (cellIndex < widgetIndex) {
					if (cell.id) {
						beforeWidgets = [];
						itemIndex = items.indexOf(cell.id) + 1;
					} else {
						beforeWidgets.push({
							...cell,
							colSpan: cell.colSpan || 6,
							isSpacer: true,
						});
					}
				}
			}
			if (flag) {
				if (cell.rowIndex === currentRowIndex && cellIndex > widgetIndex) {
					// if current row and after dropped widget
					if (cell.id) {
						itemIndex = items.indexOf(cell.id);
						flag = false;
					} else if (items.length) {
						afterWidgets.push({ ...cell, isSpacer: true });
					}
				}
			}
		}
	});
	// TODO: try to not generate after/before widgets in the above forEach loop, instead of clearing them later
	if (items.length) {
		// find last item index
		let lastItem = items[items.length - 1];
		if (lastItem === widgetId) {
			//if lastItem is dragged Item , then consider previous item as last
			lastItem = items[items.length - 2];
		}
		if (lastItem) {
			const lastItemIndex = grid.findIndex((x) => `${x.id}` === `${lastItem}`);
			// if droped at the end of list, afterWidgets are not needed.
			if (widgetIndex > lastItemIndex && lastItemIndex !== -1) {
				afterWidgets = [];
				itemIndex = items.length + 1;
			}
		} else {
			//when ther is no lastItem, afterWidgets are not neeeded.
			afterWidgets = [];
			itemIndex = items.length + 1;
		}
	}
	// clear beforeWidgets that occupy the entire row (when widget is dropped into the first cell/separator of a row)
	if (beforeWidgets.length) {
		const _beforeWidgets = [...beforeWidgets];
		_beforeWidgets.forEach((widget, index, widgets) => {
			if (
				widgets.findIndex((el) => widget.rowIndex === el.rowIndex) === index
			) {
				const totalColSpan = widgets.reduce(
					(acc, el) =>
						el.rowIndex === widget.rowIndex ? acc + el.colSpan : acc,
					0
				);
				if (totalColSpan >= 12) {
					beforeWidgets = _beforeWidgets.filter(
						(el) => el.rowIndex !== widget.rowIndex
					);
				}
			}
		});
	}
	//TODO: find out why itemIndex is used, eleminate it if possible
	return { afterWidgets, beforeWidgets, itemIndex };
};

export const setErrorList = (attrs, state, id, isCustomField) => {
	const errors = validate(attrs, state.modelType, isCustomField);
	if (Object.keys(errors).length) {
		state.errorList[id] = errors;
	} else if (state.errorList[id]) {
		delete state.errorList[id];
	}
};

export function isExtensionView(state) {
	return state.exView && !isCreatedFromStudio(state.exView);
}

// reorder widgets based on dummy widgets
export const reorderGrid =
	({ hoverWidget, dragWidgetProps }) =>
	(state) => {
		/* TODO
			Attributes for the dragged widget is being modified from onHover, onDrag, beginDrag,
			and reorderGrid functions, Try to move all of them here,
			Look for setHoverAttr, which could be eliminated.
		*/

		const extendList = [];
		const isCustomField = hoverWidget._type === "customField";
		const dragWidgetItems =
			hoverWidget._type === "customField" && !dragWidgetProps.panelId
				? "customFieldItems"
				: "items";
		const _items =
			hoverWidget._type === "customField" && !hoverWidget.panelId
				? "customFieldItems"
				: "items";
		const _widgets =
			hoverWidget._type === "customField"
				? state.customFieldWidgets
				: state.widgets;
		const destinationItems = (
			(hoverWidget.panelId ? _widgets[hoverWidget.panelId] : state)[_items] ||
			[]
		).slice();

		const {
			colSpan,
			grid = [],
			row: hoverCellRowIndex,
			relatedColSpan,
		} = hoverWidget.meta;

		/*
			If layout changes while the element is being dragged, then dragWidgetProps.index will be outdated,
			rely on dragWidgetIndex for grid layouts
			*/
		const dragWidgetIndex =
			grid.find((item) => item.id === dragWidgetProps.id)?.cellIndice ??
			dragWidgetProps.index;

		// remove isNew attribute
		if (dragWidgetProps.attrs && dragWidgetProps.attrs.isNew !== undefined) {
			delete dragWidgetProps.attrs.isNew;
		}

		const removedWidgetAttrsColSpan = //saving colSpan of the existing widget since it gets modified later
			dragWidgetProps.id && _widgets[dragWidgetProps.id] // check if  dragwidget is an existing one
				? JSON.parse(dragWidgetProps.attrs?.widgetAttrs || "{}").colSpan
				: undefined;

		const parentPanel = _widgets[hoverWidget.panelId];

		//  when panel is dragged
		if (dragWidgetProps.attrs.type === TYPE.panel) {
			const dragWidgetAttrs = JSON.parse(
				dragWidgetProps.attrs?.widgetAttrs || "{}"
			);
			// if it is dropped into tabs-panel
			if (parentPanel && parentPanel.type === TYPE.tabs) {
				dragWidgetProps.attrs.title =
					dragWidgetProps.attrs.title || translate("Tab");
				dragWidgetProps.attrs.widgetAttrs = JSON.stringify({
					...dragWidgetAttrs,
					tab: "true",
					// sidebar: undefined, // when panel in siderbar is dropped into tabs,
				});
			} else if (dragWidgetAttrs.tab === "true") {
				// if tab is dropped outside the tabs-panel
				dragWidgetProps.attrs.widgetAttrs = JSON.stringify({
					...JSON.parse(dragWidgetProps.attrs?.widgetAttrs || "{}"),
					tab: "false", // TODO: tab: undefined would be better,
				});
			}
		}

		// TODO: Move the everything inside the next if logic to a similar if logic further down
		// if widget is dropped on the spacer
		if (
			hoverWidget.attrs?.serverType === "spacer" ||
			hoverWidget.attrs?.type === "spacer"
		) {
			const spacerWidgetAttrsColSpan = JSON.parse(
				hoverWidget.attrs?.widgetAttrs || "{}"
			).colSpan;

			const parentPanelWidgetAttrs = JSON.parse(
				_widgets[hoverWidget.panelId]?.widgetAttrs || "{}"
			);
			const parentPanelItemSpan = parentPanelWidgetAttrs.itemSpan;
			const isParentPanelSidebar = parentPanelWidgetAttrs.sidebar;
			// make dragged widget fit into the spacer by modifying colSpan
			dragWidgetProps.attrs.widgetAttrs = JSON.stringify({
				...JSON.parse(dragWidgetProps.attrs?.widgetAttrs || "{}"),
				colSpan: getColSpan(),
			});
			// add spacer to the delete list if spacer is already saved
			if (hoverWidget.attrs?.id && typeof hoverWidget.attrs?.id !== "symbol") {
				state.removedCustomFields.push({
					id: hoverWidget.attrs.id,
					version: hoverWidget.attrs.version,
				});
			}
			/* reset colSpan to default(6) to make it fit into spacer when both
			 ItemSpan & widgetAttr colspan doesn't exist */
			if (!parentPanelItemSpan && !spacerWidgetAttrsColSpan) {
				dragWidgetProps.attrs.colSpan = 6;
			}
			//delete the spacer from the widgets
			delete _widgets[hoverWidget.id];

			function getColSpan() {
				if (dragWidgetProps.attrs.type === FIELD_TYPE.separator) {
					if (spacerWidgetAttrsColSpan) {
						// if spacer has colSpan of 12 then clear colSpan since separator occupies 12 by default
						return spacerWidgetAttrsColSpan === 12
							? undefined
							: spacerWidgetAttrsColSpan;
					}
					if (parentPanelItemSpan) {
						/*
					  when spacer doesn't have colSpan , it occupies parentPanelItemSpan, however separator ignores it,
						so, make its colspan as parentPanelItemSpan,
					 */
						return parentPanelItemSpan;
					}
					if (isParentPanelSidebar) {
						// default itemSpan of sidebar and default colSpan of separator are both 12, so don't set colSpan
						return undefined;
					}
					// force colspan to 6 when dropped into spacer.
					return 6;
				}
				// for all other widgets, copy spacers colSpan
				return spacerWidgetAttrsColSpan;
			}
		}
		// clone colSpan of hover widget
		const hoverType = parentPanel?.serverType;
		// TODO: this whole if block seems to be redundant , try to remove it
		if (dragWidgetProps.attrs && !dragWidgetProps.attrs.colSpan) {
			if (
				colSpan &&
				dragWidgetProps.attrs &&
				![TYPE.menu, TYPE.menuItem, TYPE.divider].includes(
					dragWidgetProps.attrs.type
				) &&
				![TYPE.toolbar, TYPE.menubar].includes(hoverType)
			) {
				const existingColspan = dragWidgetProps.attrs.colSpan;
				// set itemSpan if exists
				if (hoverType === TYPE.panel && Number(parentPanel.itemSpan)) {
					dragWidgetProps.attrs.colSpan = Number(parentPanel.itemSpan);
				} else {
					dragWidgetProps.attrs.colSpan = relatedColSpan || colSpan;
				}
				if (isCustomField) {
					// set colSpan in widgetAttrs for custom field
					const widgetAttrs = { colSpan: relatedColSpan || colSpan };
					dragWidgetProps.attrs.widgetAttrs = JSON.stringify(widgetAttrs);
				}
				if (`${dragWidgetProps.attrs.colSpan}` !== `${existingColspan}`) {
					if (state.modelType === MODEL_TYPE.CUSTOM) {
						// change widgetAttrs for colSpan
						const widgetAttrs = JSON.parse(
							dragWidgetProps.attrs.widgetAttrs || "{}"
						);
						widgetAttrs.colSpan = relatedColSpan || colSpan;
						dragWidgetProps.attrs.widgetAttrs = JSON.stringify(widgetAttrs);
					}
					isExtensionView(state) &&
						extendList.push({
							name: "attribute",
							target: dragWidgetProps.attrs.xPath,
							attributes: {
								name: "colSpan",
								value: dragWidgetProps.attrs.colSpan,
							},
						});
				}
				if (state.modelType === MODEL_TYPE.CUSTOM) {
					const widgetAttrs = JSON.parse(
						dragWidgetProps.attrs.widgetAttrs || "{}"
					);
					widgetAttrs.colSpan = 6;
					dragWidgetProps.attrs.widgetAttrs = JSON.stringify(widgetAttrs);
				}
			} else if (
				dragWidgetProps.attrs &&
				state.modelType === MODEL_TYPE.CUSTOM
			) {
				const widgetAttrs = JSON.parse(
					dragWidgetProps.attrs.widgetAttrs || "{}"
				);
				widgetAttrs.colSpan = relatedColSpan || colSpan;
				dragWidgetProps.attrs.colSpan = relatedColSpan || colSpan;
				dragWidgetProps.attrs.widgetAttrs = JSON.stringify(widgetAttrs);
			}
		}
		const newIds = [];
		let widgetIndex = Number(hoverWidget.index);
		let {
			beforeWidgets, //holds spacers to be added before the dropped widget
			afterWidgets, // holds spacers to be added after the dropped widget
			itemIndex = 0,
		} = collectWidgets({
			grid,
			items: destinationItems,
			widgetIndex,
			widgetId: dragWidgetProps.id,
			currentRowIndex: hoverCellRowIndex,
		});

		let isRemovedFromSameList = false;
		// if drag widget is existing one then remove it from its panel
		if (dragWidgetProps.id && _widgets[dragWidgetProps.id]) {
			const sourcePanel = dragWidgetProps.panelId
				? _widgets[dragWidgetProps.panelId]
				: state;
			const sourceItems = sourcePanel[dragWidgetItems];
			const sourceItemIndex = sourceItems.indexOf(dragWidgetProps.id);

			if ([PANEL_TYPE.grid].includes(sourcePanel.layout)) {
				let newId = _.uniqueId();
				const isLastItem =
					sourceItems[sourceItems.length - 1] === dragWidgetProps.id;
				let isLastItemInSamePanel = false; // true if last widget is dropped after itself in the same panel
				if (isLastItem && dragWidgetProps.panelId === hoverWidget.panelId) {
					if (dragWidgetIndex < hoverWidget.index) {
						isLastItemInSamePanel = true;
					}
				}
				const hoverParent = dragWidgetProps.panelId
					? _widgets[dragWidgetProps.panelId]
					: null;
				let isPanelTab = false;
				if (
					hoverParent &&
					[TYPE.tabs, TYPE.panelStack].includes(hoverParent.type)
				) {
					isPanelTab = true;
				}
				if (
					(isLastItem && !isLastItemInSamePanel) ||
					isPanelTab ||
					[TYPE.menubar, TYPE.toolbar].includes(hoverType)
				) {
					sourceItems.splice(sourceItemIndex, 1);

					const isLastItemRemovable = (items) => {
						// TODO: improve performanace of this function
						if (!items || !items.length) return false;
						const lastItem = items[items.length - 1];
						if (lastItem === hoverWidget.id) return false; //Do not remove hover spacer

						const lastItemMetaGrid = hoverWidget?.meta?.grid?.find(
							(cell) => cell.id === lastItem
						);

						if (lastItemMetaGrid) {
							if (lastItemMetaGrid.rowIndex < hoverWidget.meta.row) {
								return false; //Do not remove widgets above hoverWidget
							}
							if (
								lastItemMetaGrid.rowIndex === hoverWidget.meta.row &&
								lastItemMetaGrid.columnIndex < hoverWidget.meta.colIndex
							) {
								return false; // Do not remove widgets before hoverWidget in the same row
							}
						}

						const lastWidget = _widgets[lastItem];
						return (
							lastWidget.type === "spacer" || lastWidget.serverType === "spacer"
						);
					};

					//remove all spacers at the end of panel
					while (isLastItemRemovable(sourcePanel.items)) {
						const id = sourcePanel.items.pop();
						if (_widgets[id].id && typeof _widgets[id].id !== "symbol") {
							state.removedCustomFields.push({
								id: _widgets[id].id,
								version: _widgets[id].version,
							});
						}
						delete _widgets[id];
					}
					// remove afterWidgets that are after the last removed spacer
					if (dragWidgetProps.panelId === hoverWidget.panelId) {
						if (!sourcePanel.items.length) {
							afterWidgets = [];
						} else {
							const lastWidgetId =
								sourcePanel.items[sourcePanel.items.length - 1];
							const lastWidgetCellIndice = hoverWidget.meta?.grid?.find(
								(cell) => cell.id === lastWidgetId
							)?.cellIndice;
							afterWidgets = afterWidgets.filter(
								(widget) => widget.cellIndice < lastWidgetCellIndice
							);
						}
					}
				} else {
					let attrs = {
						colSpan: _widgets[dragWidgetProps.id].colSpan || 1,
						serverType: FIELD_TYPE.spacer,
						type: TYPE.field, // check later if this can be changed to spacer
						name: `spacer${newId}`,
						title: "Spacer",
					};
					if (state.modelType === MODEL_TYPE.CUSTOM) {
						attrs["model"] = dragWidgetProps.attrs.model;
						attrs["modelField"] = dragWidgetProps.attrs.modelField;
					}
					if (removedWidgetAttrsColSpan) {
						attrs["widgetAttrs"] = JSON.stringify({
							//copy the removed widget's colspan to the spacer
							colSpan: removedWidgetAttrsColSpan,
						});
					} else if (dragWidgetProps.attrs.type === FIELD_TYPE.separator) {
						attrs["widgetAttrs"] = JSON.stringify({
							// since default colspan for separator is 12 and spacer is itemSpan,
							// make spacers colspan as 12, to avoid  shifting widgets
							colSpan: 12,
						});
					}
					_widgets[newId] = Object.assign({}, attrs);
					isExtensionView(state) &&
						extendList.push({
							name: "insert",
							position: "before",
							target: dragWidgetProps.attrs.xPath,
							elements: [attrs],
							id: newId,
						});
					sourceItems.splice(sourceItemIndex, 1, newId);
				}
			} else {
				// if same panel, drag widget is before hover widget
				if (dragWidgetProps.panelId === hoverWidget.panelId) {
					if (dragWidgetIndex < hoverWidget.index) {
						isRemovedFromSameList = true;
						itemIndex--;
					}
				}
				sourceItems.splice(sourceItemIndex, 1);
			}
		}

		//TODO: Move logic inside a similar if statement from above inside this
		// replace spacer with the dragged widget
		if (
			hoverWidget.attrs.type === "spacer" ||
			hoverWidget.attrs.serverType === "spacer"
		) {
			let isNew =
				!dragWidgetProps.id ||
				Object.values(IDS.createWidgets).indexOf(dragWidgetProps.id) > -1;
			let newId = isNew ? _.uniqueId() : dragWidgetProps.id;
			let attrs = Object.assign({}, dragWidgetProps.attrs || {});
			if (isNew && attrs.isCoreField !== false && attrs.name) {
				attrs.name = `${attrs.name}${newId}`;
			}
			setErrorList(attrs, state, newId, isCustomField);
			if (isNew) {
				_widgets[newId] = Object.assign({}, attrs);
				isExtensionView(state) &&
					extendList.push({
						name: "insert",
						position: "before",
						target: hoverWidget.attrs.xPath,
						elements: [attrs],
						id: newId,
					});
			} else {
				isExtensionView(state) &&
					extendList.push({
						name: "move",
						source: dragWidgetProps.attrs.xPath,
						position: "before",
						target: hoverWidget.attrs.xPath,
					});
				_widgets[dragWidgetProps.id] = Object.assign(
					{ ..._widgets[dragWidgetProps.id] },
					attrs
				);
			}
			(hoverWidget.panelId ? _widgets[hoverWidget.panelId] : state)[
				_items
			].splice(
				destinationItems.indexOf(hoverWidget.id) -
					(isRemovedFromSameList ? 1 : 0),
				1,
				newId
			);
			isExtensionView(state) &&
				extendList.push({ name: "replace", target: hoverWidget.attrs.xPath });
			return { extendList, newId };
		}

		// cell placement is horizontal special case for Tabs widget
		if (hoverWidget.meta && hoverWidget.meta.horizontal) {
			let index = Number(hoverWidget.index);
			// if tab is moved forward
			if (
				dragWidgetProps.panelId === hoverWidget.panelId &&
				dragWidgetIndex < hoverWidget.index
			) {
				index = index - 2;
			}
			// calculate item position
			itemIndex = Math.ceil(Number(index / 2));
		}

		// remove all dummy cells for flow layout
		const destinationPanel = hoverWidget.panelId
			? _widgets[hoverWidget.panelId]
			: state;
		if ((destinationPanel.layout || PANEL_TYPE.flow) === PANEL_TYPE.flow) {
			beforeWidgets = [];
			afterWidgets = [];
		}
		// fill all widgets in panel
		const newWidgetIds = [];
		const hoverWidgetParentItems =
			(hoverWidget.panelId ? _widgets[hoverWidget.panelId] : state)[_items] ||
			[];
		let hoverWidgetId = hoverWidgetParentItems[itemIndex];
		let hoverPath;
		let actualHoverWidget = _widgets[hoverWidgetParentItems[itemIndex]];
		let position = "before";
		if (!actualHoverWidget && hoverWidgetParentItems.length <= itemIndex) {
			hoverWidgetId = hoverWidgetParentItems[hoverWidgetParentItems.length - 1];
			actualHoverWidget =
				_widgets[hoverWidgetParentItems[hoverWidgetParentItems.length - 1]];
			position = "after";
		}
		// check for sidebar widget
		if (actualHoverWidget && `${actualHoverWidget.sidebar}` === "true") {
			dragWidgetProps.attrs.sidebar = "true";
			isExtensionView(state) &&
				extendList.push({
					name: "attribute",
					target: dragWidgetProps.attrs.xPath,
					attributes: { name: "sidebar", value: "true" },
				});
		}
		if (actualHoverWidget) {
			hoverPath =
				actualHoverWidget.xPath ||
				eGeneratePath(_widgets, state[_items], hoverWidgetId);
		}
		const shouldInsertInParent = (dragWidget, hoverWidget) => {
			const hoverPathInfo = exploreTarget(hoverWidget.xPath);
			const list = state.extensionMoves.filter((m) => {
				if (m.target) {
					const targetInfo = exploreTarget(m.target);
					if (m.name === "replace") {
						if (hoverPathInfo.self) {
							if (targetInfo.parent.indexOf(hoverPathInfo.self) >= 0) {
								return true;
							}
							return false;
						} else if (targetInfo.parent.indexOf(hoverPathInfo.parent) >= 0) {
							return true;
						}
					}
				}
				return false;
			});
			if (
				[TYPE.menu, FIELD_TYPE.button, TYPE.menuItem].includes(
					dragWidget.attrs.type
				) &&
				[TYPE.menubar, TYPE.toolbar, TYPE.menu].includes(hoverWidget.type)
			) {
				// hoverwidget should not have any child remove
				if (hoverWidget.items.length === 0 && !list.length) {
					return true;
				}
			}
			return false;
		};
		const list = [];
		beforeWidgets
			.concat([dragWidgetProps])
			.concat(afterWidgets)
			.forEach((widget) => {
				let attrs = Object.assign({}, widget.attrs || {});
				let newId = widget.id;
				const isCreateWidget = typeof newId === "symbol";
				const isNew = !newId || isCreateWidget;
				let shouldAdd = true;
				// new drag widgets
				if (
					[TYPE.menubar, TYPE.toolbar].includes(hoverType) &&
					widget.isSpacer
				) {
					shouldAdd = false;
				}
				if (shouldAdd) {
					if (isNew) {
						newId = _.uniqueId();
						if (attrs.isCoreField !== false) {
							if (attrs && Object.keys(attrs).length) {
								setErrorList(attrs, state, newId, isCustomField);
							}
							if (attrs.name) {
								attrs.name = `${attrs.name}${newId}`;
							}
						}
						// set new drag widget as edit widget
						if (isCreateWidget) {
							state.editWidget = newId;
						}
					}
					if (widget.isSpacer)
						if (widget.isSpacer) {
							// if its spacer widgets
							const _attrs = dragWidgetProps.attrs || {};
							const parentPanelItemSpan = JSON.parse(
								_widgets[hoverWidget.panelId]?.widgetAttrs || "{}"
							).itemSpan;

							attrs = getSpacer({
								widget,
								id: newId,
								model: _attrs.model,
								modelField: _attrs.modelField,
								...(Number(parentPanelItemSpan || 6) !==
								Number(widget.colSpan || 6)
									? {
											widgetAttrs: JSON.stringify({
												colSpan: widget.colSpan || 6,
											}),
									  }
									: {}),
							});
						}
					// add new widget
					if (isNew) {
						if (isExtensionView(state) && !isCustomField) {
							if (actualHoverWidget) {
								isExtensionView(state) &&
									list[position === "after" ? "unshift" : "push"]({
										name: "insert",
										position,
										target: hoverPath,
										elements: [attrs],
										id: newId,
									});
							} else {
								const widget = _widgets[hoverWidget.panelId];
								if (shouldInsertInParent(dragWidgetProps, widget)) {
									processMoves(state, attrs, newId, hoverWidget.panelId);
								} else {
									list[position === "after" ? "unshift" : "push"]({
										name: "insert",
										position: "inside",
										target: widget.xPath,
										elements: [attrs],
										id: newId,
									});
								}
							}
						}

						newWidgetIds.push(newId);
						_widgets[newId] = Object.assign({}, attrs);
					} else {
						if (isExtensionView(state) && !isCustomField) {
							if (actualHoverWidget) {
								isExtensionView(state) &&
									list[position === "after" ? "unshift" : "push"]({
										name: "move",
										source: dragWidgetProps.attrs.xPath,
										position,
										target: hoverPath,
									});
							} else {
								const widget = _widgets[hoverWidget.panelId];
								if (shouldInsertInParent(dragWidgetProps, widget)) {
									processMoves(
										state,
										dragWidgetProps.attrs,
										dragWidgetProps.id,
										hoverWidget.panelId
									);
								} else {
									isExtensionView(state) &&
										list[position === "after" ? "unshift" : "push"]({
											name: "move",
											source: dragWidgetProps.attrs.xPath,
											position: "inside",
											target: widget.xPath,
										});
								}
							}
						}

						_widgets[dragWidgetProps.id] = Object.assign(
							{ ..._widgets[dragWidgetProps.id] },
							attrs
						);
					}
					newIds.push(newId);
				}
			});
		extendList.push(...list);
		// put all new widgets into panel
		(
			(hoverWidget.panelId ? _widgets[hoverWidget.panelId] : state)[_items] ||
			[]
		).splice(itemIndex, 0, ...newIds);
		return { extendList, newId: newIds && newIds[newIds.length - 1] };
	};

const getWidgetType = (widgetAttrs, defaultType) => {
	const uiFields = ["spacer", "label", "button"];
	let _type =
		widgetAttrs.isModelField ||
		widgetAttrs.isCoreField === false ||
		widgetAttrs.serverType === "field"
			? "field"
			: widgetAttrs.type
			? widgetAttrs.type.toLowerCase()
			: defaultType;
	_type = uiFields.includes(widgetAttrs.serverType)
		? widgetAttrs.serverType
		: _type;
	return _type;
};

// check source or destination panel is exclusive or not
export const checkExclusive = (widgets, source, destination) => {
	// special case for exclusive
	if (widgets[source.id]) {
		if (widgets[source.panelId]) {
			let sourcePanelAttrs = widgets[source.panelId];
			if (
				sourcePanelAttrs.exclusive &&
				destination.panelId !== source.panelId
			) {
				return true;
			}
		}
	}
	if (widgets[destination.id]) {
		if (widgets[destination.panelId]) {
			let destinationPanelAttrs = widgets[destination.panelId];
			if (
				destinationPanelAttrs.exclusive &&
				source.panelId !== destination.panelId
			) {
				return true;
			}
		}
	}
	return false;
};

const isSamePositionInOriginal = (elements, panel, widget, hoverItemIndex) => {
	const field = widget.attrs || widget || {};
	let flag = false;
	(elements || []).forEach((element) => {
		if (element.elements) {
			if (
				element.attributes &&
				panel &&
				element.attributes.name === panel.name
			) {
				const item = element.elements[hoverItemIndex];
				if (
					item &&
					item.attributes &&
					field &&
					item.attributes.name === field.name
				) {
					flag = true;
				}
			}
			if (!flag && element.elements && element.elements.length) {
				const result = isSamePositionInOriginal(
					element.elements,
					panel,
					widget,
					hoverItemIndex
				);
				if (result === true) {
					flag = true;
				}
			}
		}
	});
	return flag;
};

const getTarget = (fieldTarget, itemTarget) => {
	return fieldTarget || itemTarget;
};

export const isPanelTab = (field) => {
	const { type, widgetAttrs } = field;
	if (type === TYPE.panel && widgetAttrs) {
		const attrs = JSON.parse(widgetAttrs || "{}");
		if (attrs.tab === "true") {
			return true;
		}
	}
	return false;
};

const getColSpan = (widget) => {
	const attrs = JSON.parse(widget.widgetAttrs || "{}");
	const defaultColspan = widget.type === TYPE.panel ? 12 : 6;
	return attrs.colSpan || defaultColspan;
};

const getCols = (widget) => {
	if ([TYPE.panel, TYPE.tabs].includes(widget.type)) {
		return { cols: 12 };
	}
	return {};
};

export const getMenuBuilder = (studioMenu) => {
	if (studioMenu) {
		return {
			menuBuilderTitle: studioMenu.title,
			menuBuilderParent: studioMenu.parentMenu,
		};
	}
	return {};
};

export const generateCustomModelSchema = (
	fields = [],
	record,
	typeLateral = "",
	formType = "form",
	currentTabIndex
) => {
	let flag = false;
	const _widgets = {};
	const formItems = [];
	const tabItems = [];
	let _panelId;
	fields &&
		fields.length &&
		fields.forEach((f) => {
			const _ID = _.uniqueId();
			const isTab = isPanelTab(f);
			if ([TYPE.panel, TYPE.tabs].includes(f.type)) {
				flag = true;
				_panelId = _ID;
				f["items"] = [];
				f["layout"] = "grid";
			} else if (!flag) {
				const _item = _widgets[_panelId];
				if (_item) {
					_item.items.push(_ID);
					_widgets[_panelId] = {
						..._widgets[_panelId],
						items: [..._item.items],
					};
				} else {
					flag = true;
				}
			}
			if (flag) {
				flag = false;
				if (isTab) {
					tabItems.push(_ID);
				} else {
					formItems.push(_ID);
				}
			}
			if (f.selectionText && f.selectionText.length) {
				f.updateSelection = true;
			}
			_widgets[_ID] = {
				...f,
				colSpan: getColSpan(f),
				...getCols(f),
				type: `${f.type}${typeLateral}`,
			};
		});
	// add tab panel if tabItems has length
	if (tabItems.length) {
		const _ID = _.uniqueId();
		const field = {
			items: [...tabItems],
			type: TYPE.tabs,
			title: translate("Tab panel"),
			...(currentTabIndex ? { current: tabItems[currentTabIndex] } : {}),
		};
		formItems.push(_ID);
		_widgets[_ID] = { ...field };
	}
	const form = formType === "customForm" ? IDS.customForm : IDS.form;
	const schema = {
		widgets: {
			[form]: {
				type: formType,
				cols: 12,
				...record,
				...getMenuBuilder(record ? record.studioMenu : undefined),
			},
			[IDS.dumpField]: {
				type: TYPE.dumpField,
				name: "",
			},
			..._widgets,
		},
		items: [...formItems],
	};
	return schema;
};

function processXML(xmlString, indent) {
	return format(xmlString);
}

const replacer = (key, modelType) => {
	const camelToDash = ["formView", "gridView", "minSize", "maxSize"];
	const xField = ["bind"];
	if (modelType === MODEL_TYPE.BASE) {
		const keyReplacer = {
			targetModel: "target",
			minSize: "min",
			maxSize: "max",
		};
		key = keyReplacer[key] || key;
		if (camelToDash.includes(key)) {
			key = camelToDashCase(key);
		}
		if (xField.includes(key)) {
			key = `x-${camelToDashCase(key)}`;
		}
	}
	return key;
};

const editorKeyReplacer = (key, modelType) => {
	const keyReplacer = {
		targetModel: "target",
		minSize: "min",
		maxSize: "max",
	};
	if (modelType === MODEL_TYPE.BASE) {
		const _keyIndex = Object.values(keyReplacer).findIndex((v) => v === key);
		if (_keyIndex !== -1) {
			key = Object.keys(keyReplacer)[_keyIndex];
		}
	}
	return key;
};

//this is similar to isDummyWidget , to be checked later for removal
function isDummyField(widget) {
	const modelTypes = [];
	modelFields.forEach((f) => {
		const { value = [] } = f;
		const types = value.map((v) => v.serverType);
		modelTypes.push(...types);
	});
	return widget.serverType === "field" && modelTypes.includes(widget.type);
}

function valueConverter(value, key) {
	const ltKeys = ["title", "text"];
	if (value && ltKeys.includes(key)) {
		value = value.replace(/</g, "&lt;");
	}
	return value;
}

const getWidgetAttrs = (attrs, exempt = [], modelType) => {
	const widgetAttrs = {};
	const exemptedAttrs = [
		"version",
		"type",
		"typeName",
		"label",
		"items",
		"serverType",
		"layout",
		"cols",
		"isCoreField",
		"isModelField",
		"relationship",
		"current",
		"autoTitle",
		"metaModel",
		"targetSearch",
		"editorType",
		"studioApp",
		...exempt,
	];
	if (attrs.serverType !== "field") {
		exemptedAttrs.push("targetModel", "targetName", "target");
	}
	Object.keys(attrs).forEach((key) => {
		if (!exemptedAttrs.includes(key) && attrs[key] !== "") {
			let flag = true;
			if (modelType === MODEL_TYPE.BASE && isDefaultValue(key, attrs[key])) {
				flag = false;
			}
			if (flag) {
				if (key === "dummyType") {
					widgetAttrs["type"] = attrs[key];
				} else {
					widgetAttrs[replacer(key, modelType)] = valueConverter(
						attrs[key],
						key
					);
				}
			}
		}
	});
	// check for dummy model field
	if (attrs.type === TYPE.panelInclude) {
		if (typeof attrs.view === "object") {
			widgetAttrs.view = attrs.view.name;
		}
	}
	if (attrs.isModelField || isDummyField(attrs)) {
		widgetAttrs["type"] = attrs.type;
	}
	if (attrs.type === TYPE.panelRelated) {
		widgetAttrs["name"] = attrs.field;
	}
	if (widgetAttrs.name) {
		// change array field index
		const squareIndex = widgetAttrs.name.indexOf("[");
		if (squareIndex !== -1) {
			widgetAttrs.name = widgetAttrs.name.substring(0, squareIndex);
		}
	}
	return widgetAttrs;
};

const getCustomWidget = (widget, exempt = []) => {
	const _widget = {};
	const exemptedAttrs = [
		"image",
		"serverType",
		"isModelField",
		"isCoreField",
		"current",
		...exempt,
	];
	Object.keys(widget).forEach((key) => {
		if (!exemptedAttrs.includes(key)) {
			if (key === "type" && ["item", "field"].includes(widget[key])) {
				_widget[key] = widget["serverType"];
			} else {
				_widget[key] = widget[key] === "" ? null : widget[key];
			}
		}
	});
	return _widget;
};

const getCustomModelFields = (
	items = [],
	widgets,
	additionalProps = {},
	countSequence = false,
	sequence = 0
) => {
	const fields = [];
	items.forEach((item) => {
		if (widgets[item]) {
			let _widget = { ...widgets[item] };
			const exempt = [];
			if (!["dump_field", "form"].includes(_widget.type)) {
				if (_widget.type !== TYPE.tabs) {
					if (typeof _widget.id === "symbol") {
						delete _widget.id;
					}
					if (_widget.showTitle !== "false") {
						delete _widget.showTitle;
					}
					if (countSequence) {
						_widget.sequence = sequence;
						sequence++;
					}
					if (_widget.serverType === "spacer") {
						exempt.push("title");
					}
					fields.push({
						...getCustomWidget(_widget, exempt),
						...additionalProps,
					});
				}
				if (_widget.items && _widget.items.length) {
					const modelFields = getCustomModelFields(
						_widget.items,
						widgets,
						additionalProps,
						countSequence,
						sequence
					);
					fields.push(...modelFields.fields);
					sequence = modelFields.sequence;
				}
			}
		}
	});
	return { fields, sequence };
};

const isCreatedFromStudio = ({ xmlId = null, extension }) => {
	if (xmlId && !extension) {
		const index = xmlId.indexOf("studio-");
		if (index === 0) {
			return true;
		}
	}
	return false;
};

const getFormProperties = (form, exempt = []) => {
	const except = ["type", "cols", "items", ...exempt];
	const properties = {};
	Object.keys(form).forEach((key) => {
		if (!except.includes(key)) {
			properties[key] = form[key] === "" ? null : form[key];
		}
	});
	return properties;
};

/**
 * Checks whether value is same as default value or not
 * for given property name.
 * Returns boolean true/false
 * @param {string} name
 * @param {string} value
 */
const isAttrHasDefaultValue = (name, value) => {
	const defaultValue = DEFAULT_VALUE[name];
	if (defaultValue !== undefined && `${defaultValue}` === `${value}`) {
		return true;
	}
	return false;
};

export const getProperty = (
	name,
	value,
	parentField,
	parentValue,
	shouldCheckParent = true
) => {
	const obj = { [name]: value };
	if (shouldCheckParent) {
		const _value =
			typeof parentValue === "string"
				? JSON.parse(parentValue)
				: parentValue || {};
		if (parentField && ![undefined, "", null].includes(value)) {
			// check for default value
			if (isAttrHasDefaultValue(name, value)) {
				delete _value[name];
				return { [parentField]: JSON.stringify({ ..._value }) };
			}
			const _obj = { [name]: `${value}` };
			return { [parentField]: JSON.stringify({ ..._value, ..._obj }) };
		} else if (parentField && (!value || value === "")) {
			delete _value[name];
			return { [parentField]: JSON.stringify({ ..._value }) };
		}
	}
	if (name === "showTitle" && value === true) {
		return { showTitle: undefined };
	}
	return obj;
};

export const getPropertyValue = (
	list,
	name,
	parentField,
	defaultValue,
	shouldCheckParent = true
) => {
	if (shouldCheckParent && parentField) {
		if (list[parentField]) {
			const field = JSON.parse(list[parentField]);
			return [undefined, null].includes(field[name])
				? defaultValue
				: field[name];
		}
		return defaultValue || null;
	}
	return [undefined, null].includes(list[name]) ? defaultValue : list[name];
};

const getDefaultProperties = (modelType) => {
	switch (modelType) {
		case MODEL_TYPE.CUSTOM:
			return { formWidth: "large" };
		case MODEL_TYPE.BASE: {
			return { width: "large" };
		}
		default:
			return {};
	}
};

const getPatchList = (xmlJson) => {
	if (xmlJson) {
		const { elements = [] } = xmlJson;
		if (elements[0]) {
			return elements[0].elements || [];
		}
	}
	return [];
};

const filterFormPatch = (patchList) => {
	return patchList.filter((element) => element.attributes.target === "/");
};

const getCurrentFormAttributes = (xml) => {
	const { elements = [] } = xml;
	return elements[0].attributes || {};
};

const mergeFormAttributes = (patchList, formPatch) => {
	const index = patchList.findIndex(
		(element) => element.attributes.target === "/"
	);
	const targetIndex = index === -1 ? 0 : index;
	const remove = index === -1 ? 0 : 1;
	if (Object.keys(formPatch).length) {
		patchList.splice(targetIndex, remove, { ...formPatch });
	} else if (index !== -1) {
		patchList.splice(index, 1);
	}
	return patchList;
};

const camelToDashCase = (string, caseString = "-") => {
	return string.replace(/[A-Z]/g, (m) => caseString + m.toLowerCase());
};

const dashToCamelCase = (string) => {
	return string.replace(/-([a-z])/g, function (g) {
		return g[1].toUpperCase();
	});
};

const isDefaultValue = (field, value) => {
	const fieldValue = DEFAULT_VALUE[field];
	if ([true, false].includes(fieldValue) && `${value}` === `${fieldValue}`) {
		return true;
	}
	return false;
};

const getReferenceProperty = (widgetType) => {
	const referenceProperty = {
		[TYPE.panelInclude]: "view",
	};
	const refProp = referenceProperty[widgetType];
	return refProp || "name";
};

const checkTarget = (target, checkString, which) => {
	// 2 for parent check and 3 for itself/child element check
	const targetSplit = target.split("/");
	if (which) {
		if (targetSplit[which] === checkString) {
			return true;
		}
		return false;
	}
	return target === checkString;
};

const exploreTarget = (target, which = 3) => {
	// 2 for parent check and 3 for itself/child element check
	const targetSplit = target.split("/");
	const length = targetSplit.length;
	let parent = length > 3 ? targetSplit[length - 2] : targetSplit[length - 1];
	let self = length > 3 ? targetSplit[length - 1] : undefined;
	return { parent, self };
};

const getViews = (list, viewName) => {
	let view = list.find((v) => v.computed === true);
	let originalXML = list.find(
		(v) => v.computed !== true && v.extension !== true
	);
	const extensionXML = list.find(
		(v) => v.extension === true && v.xmlId === `studio-${viewName}`
	);
	return {
		view: view || originalXML,
		originalXML,
		extensionXML,
	};
};

const getElementTypes = (name, field, _type) => {
	let serverType;
	let type;
	if (field) {
		serverType = field.type.toLowerCase();
		type = name;
	} else {
		serverType = name;
		type = _type ? _type : name === "field" ? undefined : name; // if element is field then set default type string
	}
	return {
		serverType: TYPE_REPLACER[serverType] || serverType,
		type: TYPE_REPLACER[type] || type,
	};
};

const getTitle = (attributes, field) => {
	if (attributes.title) {
		return { title: attributes.title };
	}
	if (field?.label) {
		return { autoTitle: field.label };
	}
	if (attributes.name) {
		return { autoTitle: camelToDashCase(attributes.name, " ") };
	}
	return {};
};

const generateViewFromJson = ({
	view,
	fields,
	original,
	extensionXML,
	attrsList,
}) => {
	const { elements } = view;

	const getElementName = (attributes, parent, itemList, elementType) => {
		const nameObj = { name: attributes.name };
		return nameObj;
	};

	const getElementToWidget = (element, fields, parent, itemList) => {
		let widget = {};
		let field;
		if (element) {
			const { type, ...attributes } = element.attributes || {};
			if (element.name.indexOf("panel") === -1) {
				field = fields?.find((f) => f.name === attributes.name);
			}
			const attrs = {};
			Object.keys(attributes).map((key) => {
				let _key = key;
				if (key.indexOf("x-") === 0) {
					_key = key.substring(2);
				}
				attrs[editorKeyReplacer(dashToCamelCase(_key), MODEL_TYPE.BASE)] =
					attributes[key];
				return undefined;
			});
			const targetModel = getTarget(
				field?.target || field?.targetModel,
				attributes.target
			);
			widget = {
				...attrs,
				colSpan: Number(attributes.colSpan || 6),
				...getElementName(attributes, parent, itemList, element.name),
				...getElementTypes(element.name, field, type),
				...getTitle(attributes, field),
			};
			if (targetModel) {
				widget.targetModel = targetModel;
			}
			if (
				element.name &&
				(element.name.indexOf(TYPE.panel) >= 0 ||
					[TYPE.menubar, TYPE.toolbar].includes(element.name))
			) {
				widget.colSpan = Number(attributes.colSpan || 12);
				widget.cols = 12;
				widget.layout = "grid";
				widget.serverType =
					widget.type === "panel" && widget.tab === true
						? TYPE.tabs
						: widget.serverType || widget.type;
			}
		}
		return { widget, field };
	};

	const getSpecialType = (element) => {
		return element.name;
	};
	const getXMLToViewItems = (elements = [], fields, parent) => {
		const exclude = ["panel-mail"];
		let _widgets = {};
		const itemList = [];
		const fieldList = [];
		elements.forEach((element) => {
			if (element.attributes && `${element.attributes.json}` === "true") {
				return;
			}
			if (!exclude.includes(element.name) && element.type !== "cdata") {
				const _ID = _.uniqueId();
				const { widget, field } = getElementToWidget(
					element,
					fields,
					parent,
					itemList
				);
				if (field) {
					fieldList.push(field);
				}
				itemList.push(_ID);
				if (element.name && element.name.indexOf(TYPE.panel) >= 0) {
					widget.items = [];
				}
				if (element.elements && element.name !== "field") {
					const items = getXMLToViewItems(
						element.elements,
						fields,
						element.attributes
					);
					_widgets = { ..._widgets, ...items._widgets };
					widget.items = [...items.itemList];
					fieldList.push(...items.fieldList);
				}
				if (element.elements && element.name === "field") {
					// check for viewer
					const type = getSpecialType(element.elements[0]);
					if (type) {
						widget.type = type;
						widget.elements = element.elements;
					}
				}
				// override with meta attrs list
				if (widget.name) {
					const list =
						attrsList &&
						attrsList.length > 0 &&
						attrsList.filter((attr) => attr.field === widget.name);
					list &&
						list.forEach((attr) => {
							if (["selection-in"].includes(attr.name)) {
								widget[attr.name] = attr.value;
							} else {
								widget[
									editorKeyReplacer(dashToCamelCase(attr.name), MODEL_TYPE.BASE)
								] = attr.value;
							}
						});
				}
				_widgets[_ID] = { ...widget };
			}
		});
		return { _widgets, itemList, fieldList };
	};

	const { itemList, _widgets, fieldList } = getXMLToViewItems(elements, fields);
	const form = _widgets[itemList[0]];
	const items = form.items || [];
	delete _widgets[itemList[0]];
	const schema = {
		widgets: {
			[IDS.form]: {
				type: TYPE.form,
				cols: 12,
				...form,
				items: undefined,
			},
			[IDS.dumpField]: {
				type: TYPE.dumpField,
				name: "",
			},
			..._widgets,
		},
		items,
		fieldList,
	};
	return schema;
};

const generateXMLToViewSchema = ({
	view,
	fields,
	original = false,
	extensionXML,
	attrsList,
}) => {
	const { elements } = JSON.parse(
		convert.xml2json(view?.xml, {
			compact: false,
			fullTagEmptyElement: false,
		})
	);
	return generateViewFromJson({
		view: { elements },
		fields,
		original,
		extensionXML,
		attrsList,
	});
};

const getChangeList = (schema, extensionXml) => {
	const list = [];
	const { widgets } = schema;
	const elems = getExtensionElements(extensionXml);
	const widgetList = Object.values(widgets);
	const widgetIds = Object.keys(widgets);
	elems.forEach((json) => {
		const { elements = [] } = json;
		const moveElement = elements[0];
		if (moveElement && moveElement.attributes && moveElement.name === "move") {
			const source = exploreTarget(moveElement.attributes.source);
			if (source.self) {
				const index = source.self
					? widgetList.findIndex(
							(w) => `${w.type}[@name='${w.name}']` === source.self
					  )
					: widgetList.findIndex(
							(w) => `${w.type}[@name='${w.name}']` === source.parent
					  );
				if (widgetIds[index]) {
					list.push(widgetIds[index]);
				}
			}
		}
	});
	return list;
};

const getExtensionElements = (xml) => {
	const extensionJson = JSON.parse(
		convert.xml2json(xml, {
			compact: false,
			fullTagEmptyElement: false,
		})
	);
	const elems = extensionJson.elements[0].elements;
	return elems;
};

function randomString(length) {
	const chars =
		"0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
	var result = "";
	for (var i = length; i > 0; --i)
		result += chars[Math.floor(Math.random() * chars.length)];
	return result;
}

export const generateFieldUniqueTitle = ({ name, fieldName }) => {
	const text = randomString(6);
	return `studio:${text}:${fieldName}:${name}`;
};

export function getDefaultGridFormName(str, isForm = false, isJson = false) {
	if (!str) return;
	if (isJson) {
		return `custom-model-${str.name}-${isForm ? "form" : "grid"}`;
	}
	const models = str.split(".");
	const modelString = models[models.length - 1];
	if (!modelString) return;
	const viewName = dasherize(modelString);
	return `${viewName.toLowerCase()}-${isForm ? "form" : "grid"}`;
}

export function getDuplicateArrayValues(arr, isCustomForm = false) {
	const duplicateValues = arr.reduce(
		(accumulator, currentValue, currentIndex, array) => {
			if (
				array.findIndex((obj) => obj.name === currentValue.name) !==
					currentIndex &&
				accumulator.findIndex((obj) => obj.name === currentValue.name) === -1
			) {
				if (isCustomForm ? currentValue.type !== "customForm" : true) {
					accumulator.push(currentValue);
				}
			}
			return accumulator;
		},
		[]
	);
	return duplicateValues;
}
export const getParams = () => {
	const params = new URL(document.location).searchParams;
	const isStudioLite = JSON.parse(params.get("isStudioLite") || false);
	const modelTitle = params.get("modelTitle");
	const type = JSON.parse(params.get("json") || true);
	const model = params.get("model");
	const view = params.get("view");
	const customField = params.get("customField");

	return {
		type,
		model,
		view,
		customField,
		isStudioLite,
		modelTitle,
	};
};

const utils = {
	camleCaseString,
	translate,
	processXML,
	getWidgetAttrs,
	getCustomModelFields,
	isCreatedFromStudio,
	getFormProperties,
	getDefaultProperties,
	getPatchList,
	keyReplacer: replacer,
	valueConverter,
	filterFormPatch,
	getCurrentFormAttributes,
	mergeFormAttributes,
	camelToDashCase,
	dashToCamelCase,
	isSamePositionInOriginal,
	getWidgetType,
	isDefaultValue,
	getReferenceProperty,
	checkTarget,
	exploreTarget,
	getViews,
	generateXMLToViewSchema,
	generateViewFromJson,
	getChangeList,
	getDefaultGridFormName,
	isPanelTab,
	getDuplicateArrayValues,
	getParams,
};
export default utils;
