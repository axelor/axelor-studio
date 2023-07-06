import React from "react";
import produce from "immer";
import _ from "lodash";

import {
	TYPE,
	IDS,
	PANEL_TYPE,
	MODEL_TYPE,
	ENTITY_TYPE,
	PANEL_PROPS,
} from "../constants";
import {
	reorderGrid,
	checkExclusive,
	arrangeGrid,
	setErrorList,
	caseConverter,
	translate,
} from "../utils";
import { original } from "immer";
import { generateExtension } from "./computeXML";
import { generateXpath } from "./xpathGenerator";
import { validateParentPanelItems, validateOnRemove } from "./validation";
import Utils, { isExtensionView } from "./../utils";

const StoreContext = React.createContext();

function useMutableState(defaultValue) {
	const [state, setState] = React.useState(defaultValue);
	return [
		state,
		React.useCallback((updater) => setState(produce(updater)), [setState]),
	];
}

function StoreProvider({ children }) {
	/*
	WARNING: Never nest two setState calls(windows-all_browsers/firefox-linux bugs),
	Ex: funtion NeverDoIt(){
		setState((draft)=>{
			...some code...
			onRemove()   <-- this function calls setState within it
		})
	}
	*/
	const [state, setState] = useMutableState({
		future: [],
		past: [],
		title: "",
		items: [],
		sideItems: [],
		mainItems: [],
		widgets: null,
		dragWidget: null,
		editWidget: null,
		hoverWidget: null,
		initialWidgets: null,
		initialItems: null,
		tabIndex: 0,
		modelType: MODEL_TYPE.CUSTOM,
		customFields: [],
		customFieldItems: [],
		customFieldWidgets: null,
		modelField: null,
		hoverAttr: {},
		loader: false,
		removedCustomFields: [],
		errorList: {},
		entityType: ENTITY_TYPE.META,
		actualType: null,
		extensionMoves: [],
		attrsList: [],
		removedTranslationList: [],
		isStudioLite: false,
		editWidgetType: null,
		customFieldHasChanges: false, // to check if customFields in BASE model type has been modified
		baseHasChanges: false, // to check if form in BASE model type has been modified
	});
	const { widgets } = state;

	function getAllChildrenIds(id, widgetType) {
		const widgets =
			widgetType === "customField" ? state.customFieldWidgets : state.widgets;
		const collectIds = (parent) => {
			const { items = [] } = widgets[parent];
			return items.reduce(
				(all, item) => all.concat(collectIds(item)),
				[parent]
			);
		};
		return collectIds(id);
	}

	function onExtension(moveIds, state) {
		if (state.exView && !Utils.isCreatedFromStudio(state.exView)) {
			generateExtension(moveIds, state);
		}
	}

	function checkValidation(draft, id = false, customOnly = false) {
		const _widgets =
			state.modelType === "BASE" &&
			(state.editWidgetType === "customField" || customOnly)
				? draft.customFieldWidgets
				: draft.widgets;
		const isCustomField =
			state.editWidgetType === "customField" ||
			(state.modelType === MODEL_TYPE.BASE && customOnly)
				? true
				: false;
		const pastLength = draft?.past?.length;
		const futureLength = draft?.future?.length;

		if (
			(pastLength > 0 ||
				futureLength > 0 ||
				Object.keys(state.errorList).length === 0) &&
			_widgets
		) {
			id
				? _widgets[id] && setErrorList(_widgets[id], draft, id, isCustomField)
				: Object.keys(_widgets).forEach((widget) => {
						if (
							_widgets[widget]?.type !== "panel-tabs" &&
							![-2, 0].includes(+widget) &&
							_widgets[widget]
						) {
							setErrorList(_widgets[widget], draft, widget, isCustomField);
						}
				  });
		}
	}

	// update widget properties
	// pass draft if calling from inside another immer setState
	function onWidgetChange(
		{ id, props, reset = false, skipGenerateHistory = false },
		draft
	) {
		const callbackfn = (draft) => {
			!skipGenerateHistory && generateHistory(draft);
			const isCustomField = draft.editWidgetType === "customField";
			if (draft.modelType === MODEL_TYPE.BASE) {
				if (!skipGenerateHistory) {
					if (isCustomField) {
						draft.customFieldHasChanges = true;
					} else {
						draft.baseHasChanges = true;
					}
				}
			}
			const extendList = [];
			checkValidation(draft);
			setErrorList(props, draft, id, isCustomField);
			const widgets =
				draft.editWidgetType === "customField"
					? draft.customFieldWidgets
					: draft.widgets;
			if (reset) {
				widgets[id] = {};
			}
			const widget =
				draft.editWidgetType === "customField" && draft.customFieldWidgets
					? draft.customFieldWidgets[id]
					: draft.widgets && draft.widgets[id];
			if (widget) {
				Object.keys(props).forEach((key) => {
					let value = props[key];
					if (/^[a-z]/i.test(widget["name"])) {
						widget["name"] = caseConverter(
							widget["name"],
							!(props["type"] === TYPE.form)
						);
					}
					let doChange = true;
					// add change in move
					const _value = widget[key] === undefined ? "" : widget[key];
					if (_value !== value) {
						const xPath = id === -1 ? "/" : widgets[id].xPath;
						let _value = [undefined, null].includes(value) ? "" : value;

						isExtensionView(state) &&
							extendList.push({
								name: "attribute",
								target: xPath,
								attributes: {
									name: Utils.keyReplacer(key, MODEL_TYPE.BASE),
									value: Utils.valueConverter(_value, key),
								},
								id,
							});
					}
					//TODO : colSpan value is not used anymore (i think) , try to remove it completely.
					if (key === "colSpan") {
						const parentId = Object.keys(widgets).find(
							(x) => (widgets[x].items || []).indexOf(id) > -1
						);
						value = Math.min(
							Number((widgets[parentId] && widgets[parentId].cols) || value),
							value
						);
						if (widgets && parentId && widgets[parentId].type === TYPE.panel) {
							const { itemSpan } = JSON.parse(
								(widgets[parentId] || {}).widgetAttrs || "{}"
							);
							value = itemSpan || value || 6;
						}
					} else if (key === "cols" && value) {
						value = Math.min(12, Number(value));
					} else if (key === "widgetAttrs") {
						const newValue = JSON.parse(value || "{}");
						const items = widgets[id].items;
						items &&
							items.forEach((item) => {
								const child = widgets[item];
								let widgetAttrs = JSON.parse(child.widgetAttrs || "{}");
								if (!widgetAttrs["colSpan"]) {
									child.colSpan = newValue.itemSpan;
								}
							});
					}
					if (doChange) {
						widget[key] = value;
						key === "layout" &&
							value === PANEL_TYPE.stack &&
							(widget.cols = 12);
					}
				});
			}
			if (
				draft.editWidgetType !== "customField" &&
				draft.modelType === MODEL_TYPE.BASE
			) {
				onExtension(extendList, draft);
				generateXpath(draft);
			}
		};

		if (draft) {
			callbackfn(draft);
		} else {
			setState(callbackfn);
		}
	}

	// remove widget
	function onRemove(panelId, index, id, widgetType, isPanelRequired = false) {
		const extendList = [];
		const isCustomField = widgetType === "customField";
		if (isPanelRequired) {
			const dialog = {
				message: translate("Main panel is required to have side panels"),
				type: "alert",
			};
			setState((draft) => {
				draft.loader = false;
				draft.dialog = dialog;
			});
			return;
		}
		setState((draft) => {
			generateHistory(draft);
			checkValidation(draft);
			const widgets =
				widgetType === "customField" ? draft.customFieldWidgets : draft.widgets;
			const widgetItems =
				widgetType === "customField" ? "customFieldItems" : "items";
			if (isCustomField) {
				draft.customFieldHasChanges = true;
			}

			const isPanel = panelId && IDS.form !== panelId;
			index = (isPanel ? widgets[panelId].items : draft[widgetItems]).findIndex(
				(x) => `${x}` === `${id}`
			);
			if (index > -1 && widgets[id]) {
				let ids = getAllChildrenIds(id, widgetType);
				ids.forEach((id) => {
					if (isCustomField || state.modelType === MODEL_TYPE.CUSTOM) {
						const widget = widgets[id];
						if (widget.id && typeof widget.id !== "symbol") {
							draft.removedCustomFields.push({
								id: widget.id,
								version: widget.version,
							});
						}
					}
				});
				const childrenIds = [...ids];
				if (isPanel) {
					if (
						widgets[panelId].layout === PANEL_TYPE.grid &&
						![TYPE.menubar, TYPE.toolbar].includes(widgets[panelId].type)
					) {
						const arrangeItems = arrangeGrid(
							draft,
							{ panelId, index, id },
							widgetType
						);
						ids = ids.concat(arrangeItems.ids);
						isExtensionView(state) &&
							extendList.push(...arrangeItems.extendList);
					} else {
						widgets[panelId].items.splice(index, 1);
					}
				} else {
					draft[widgetItems].splice(index, 1);
				}
				if (widgets[id]) {
					isExtensionView(state) &&
						extendList.push({ name: "replace", target: widgets[id].xPath });
				}
				ids.forEach((id) => {
					const widget = widgets[id];
					if (widget) {
						if (!childrenIds.includes(id)) {
							isExtensionView(state) &&
								extendList.push({ name: "replace", target: widget.xPath });
						}
						if (
							widget.id &&
							typeof widget.id !== "symbol" &&
							!draft.removedCustomFields.find((field) => field.id === widget.id)
						) {
							draft.removedCustomFields.push({
								id: widget.id,
								version: widget.version,
							});
						}
						delete widgets[id];
					}
				});
				if (ids.indexOf(draft.editWidget) > -1) {
					draft.editWidget = null;
				}
			}
			validateOnRemove(draft, id);
			if (!isCustomField && draft.modelType === MODEL_TYPE.BASE) {
				validateParentPanelItems(draft, panelId);
				onExtension(extendList, draft);
				generateXpath(draft);
			}
		});
	}

	// select widget, to open properties editor
	// pass draft if calling from inside another immer setState
	function onSelect({ id = null, type = null }, draft) {
		const callbackfn = (draft) => {
			draft.editWidget = id;
			draft.highlightedOption = null;
			draft.tabIndex = 0;
			draft.editWidgetType = type;
			(draft.modelType === MODEL_TYPE.CUSTOM || type === "customField") &&
				checkValidation(draft, id);
		};
		if (draft) {
			callbackfn(draft);
		} else {
			setState(callbackfn);
		}
	}

	// pass draft if calling from inside another immer setState
	function addTabPanel({ attrs, id, skipGenerateHistory = false }, draft) {
		const panelId = _.uniqueId();
		const callbackfn = (draft) => {
			!skipGenerateHistory && generateHistory(draft);
			if (draft.modelType === MODEL_TYPE.BASE && !skipGenerateHistory) {
				// In base model, tab can be only added in customfield
				draft.customFieldHasChanges = true;
			}
			const widgets =
				draft.modelType === MODEL_TYPE.BASE ? "customFieldWidgets" : "widgets";
			draft[widgets][id] = {
				...attrs,
				items: [...(attrs.items || []), panelId],
			};
			draft[widgets][panelId] = {
				...PANEL_PROPS,
				...(widgets === "customFieldWidgets"
					? { model: draft.model.fullName }
					: {}),
				name: `panel${panelId}`,
				title: translate("Tab"),
				widgetAttrs: JSON.stringify({ tab: "true" }),
			};
			draft.editWidgetType =
				draft.modelType === MODEL_TYPE.BASE ? "customField" : null;
		};
		if (draft) {
			callbackfn(draft);
		} else {
			setState(callbackfn);
		}
		const _type = state.modelType === MODEL_TYPE.BASE ? "customField" : null;
		onWidgetChange(
			{
				id,
				props: {
					current: panelId,
					_type,
				},
				skipGenerateHistory: true,
			},
			draft
		);
		onSelect({ id: panelId, type: _type }, draft);
	}

	// set current dragging widget
	function onDrag(id = null, { props, isDrop } = {}) {
		setState((draft) => {
			const _extendList = [];
			const { attrs = {} } = props;
			const _attrs = {
				type: attrs.type,
				title: attrs.label,
				name: attrs.name,
				relationship: attrs.relationship,
				mappedBy: attrs.mappedBy,
				...attrs,
			};
			if (attrs && attrs.name === "string") {
				_attrs["visibleInGrid"] = true;
			}
			if (attrs && attrs.name === "selection") {
				_attrs["updateSelection"] = true;
			}
			const {
				dragWidget,
				hoverWidget,
				editWidget,
				dragWidgetProps,
				widgets,
				customFieldWidgets,
			} = draft;
			draft.dragWidget = null;
			draft.hoverWidget = null;
			const extraAttr = { ...draft.hoverAttr };
			if (_attrs.widgetAttrs && extraAttr.widgetAttrs) {
				const _eWidgetAttr = JSON.parse(extraAttr.widgetAttrs || "{}");
				const _attrsWidgetAttr = JSON.parse(_attrs.widgetAttrs || "{}");
				extraAttr.widgetAttrs = JSON.stringify({
					..._attrsWidgetAttr,
					..._eWidgetAttr,
				});
			}
			draft.dragWidgetProps = Object.assign({}, props, {
				attrs: { ..._attrs, ...extraAttr },
			});

			if (editWidget && editWidget === dragWidget) {
				draft.editWidget = null;
			}
			if (isDrop) {
				if (!hoverWidget || !dragWidgetProps) return;
				generateHistory(draft);

				// Check validation for all fields once a widget is droped in the form
				checkValidation(draft, false, true);

				if (draft.modelType === MODEL_TYPE.BASE) {
					/* only customfields can be dragged and dropped in BASE model,
					 hence we assume changes are in customFields */
					draft.customFieldHasChanges = true;
				}
				const index = draft.metaFields.findIndex(
					(f) =>
						f.typeName === dragWidgetProps.attrs.typeName &&
						f.name === dragWidgetProps.attrs.name
				);
				if (index !== -1) {
					draft.metaFields.splice(index, 1);
				}

				const hoverAttr = { ...draft.hoverAttr };
				//if both dragWidget & hoverAttr has widgetAttrs, combine them
				if (dragWidgetProps.attrs.widgetAttrs && hoverAttr.widgetAttrs) {
					hoverAttr.widgetAttrs = JSON.stringify({
						...JSON.parse(dragWidgetProps.attrs.widgetAttrs || "{}"),
						...JSON.parse(hoverAttr.widgetAttrs || "{}"),
					});
				}
				/*
				combining dragWidgetAttr with hoverAttr , so that any special properties
				defined for a particular hoverWidget will be copied over to dropped widget
				*/
				dragWidgetProps.attrs = {
					...dragWidgetProps.attrs,
					...hoverAttr,
				};

				const { extendList, newId } = reorderGrid({
					hoverWidget,
					dragWidgetProps,
				})(draft);

				_extendList.push(...extendList);

				if (
					hoverWidget._type !== "customField" &&
					draft.modelType === MODEL_TYPE.BASE
				) {
					validateParentPanelItems(draft, dragWidgetProps.panelId);
					validateParentPanelItems(draft, hoverWidget.panelId);
					onExtension(_extendList, draft);
					generateXpath(draft);
				}
				draft.hoverAttr = {};
				/**
				 * While adding panel tabs add default tab panel
				 */
				const allWidgets =
					draft.modelType === MODEL_TYPE.BASE ? customFieldWidgets : widgets;
				const tabId = Object.keys(allWidgets || {})?.find(
					(key) => allWidgets[key]?.type === TYPE.tabs
				);
				if (
					dragWidgetProps?.attrs?.type === TYPE.tabs &&
					!dragWidgetProps?.attrs?.items?.length
				) {
					addTabPanel(
						{
							attrs: state.dragWidgetProps?.attrs,
							id: tabId,
							skipGenerateHistory: true,
						},
						draft
					);
				}
				//When panel is moved into tabs, set it as current tab
				if (
					allWidgets[hoverWidget.panelId]?.type === TYPE.tabs &&
					dragWidgetProps?.attrs?.type === TYPE.panel
				) {
					onWidgetChange(
						{
							id: tabId,
							props: {
								current: newId || dragWidgetProps.id,
								_type: dragWidgetProps._type, // not sure why we need _type here,
							},
							skipGenerateHistory: true,
						},
						draft
					);
				}
				if (newId) {
					onSelect({ id: newId, type: hoverWidget?._type }, draft);
				}
			} else {
				draft.dragWidget = id;
			}
		});
	}

	function onTranslationRemove(key) {
		setState((draft) => {
			draft.removedTranslationList.push(key);
		});
	}

	function onHover(hoverWidget) {
		setState((draft) => {
			draft.hoverWidget = hoverWidget;
		});
	}

	// move widget in form
	function onMove({ source, destination }, flag, _type) {
		const resolver = (isMoved) => ({ isMoved });

		if (
			// avoid drop target of form itself
			!source ||
			!destination ||
			(destination.id === IDS.form && state.items.length > 1)
		) {
			return resolver(false);
		}

		// on create widget case
		if (Object.values(IDS.createWidgets).indexOf(source.id) > -1) {
			return resolver(true);
		}

		const _widgets =
			_type === "customField" ? state.customFieldWidgets : widgets;
		if (
			// case for create new widget
			// special case for exclusive
			(!source.attrs.isNew && checkExclusive(_widgets, source, destination)) ||
			// avoid to drag panel on its one of children element
			([TYPE.panel, TYPE.tabs].includes(source.attrs.type) &&
				getAllChildrenIds(source.id, _type).indexOf(
					destination.id === IDS.dumpField
						? destination.panelId
						: destination.id
				) > -1)
		) {
			return resolver(false);
		}

		return resolver(true);
	}

	function setHoverAttr(attr) {
		setState((draft) => {
			draft.hoverAttr = attr;
		});
	}

	const startLoader = React.useCallback(
		function startLoader() {
			setState((draft) => {
				draft.loader = true;
			});
		},
		[setState]
	);

	function undo() {
		setState((draft) => {
			if (draft.past.length) {
				draft.future.unshift({
					widgets: original(draft.widgets),
					items: original(draft.items),
					extensionMoves: original(draft.extensionMoves),
					customFieldWidgets: original(draft.customFieldWidgets),
					customFields: original(draft.customFields),
					customFieldItems: original(draft.customFieldItems),
					metaFields: original(draft.metaFields),
					removedCustomFields: original(draft.removedCustomFields),
					errorList: original(draft.errorList),
					selectedView: original(draft.selectedView),
					modelField: original(draft.modelField),
				});
				setPresent(draft.past[draft.past.length - 1], draft);
				draft.past.splice(draft.past.length - 1, 1);
			}
		});
	}

	function redo() {
		setState((draft) => {
			if (draft.future.length) {
				draft.past.push({
					widgets: original(draft.widgets),
					items: original(draft.items),
					extensionMoves: original(draft.extensionMoves),
					customFieldWidgets: original(draft.customFieldWidgets),
					customFieldItems: original(draft.customFieldItems),
					metaFields: original(draft.metaFields),
					customFields: original(draft.customFields),
					removedCustomFields: original(draft.removedCustomFields),
					errorList: original(draft.errorList),
					selectedView: original(draft.selectedView),
					modelField: original(draft.modelField),
				});
				setPresent(draft.future[0], draft);
				draft.future.splice(0, 1);
			}
		});
	}

	function setPresent(object, draft) {
		Object.keys(object).forEach((key) => {
			draft[key] = original(object[key]);
		});
	}

	function generateHistory(draft) {
		draft.past.push({
			widgets: original(draft.widgets),
			items: original(draft.items),
			extensionMoves: original(draft.extensionMoves),
			customFieldWidgets: original(draft.customFieldWidgets),
			customFields: original(draft.customFields),
			customFieldItems: original(draft.customFieldItems),
			metaFields: original(draft.metaFields),
			removedCustomFields: original(draft.removedCustomFields),
			errorList: original(draft.errorList),
			selectedView: original(draft.selectedView),
			modelField: original(draft.modelField),
		});
		if (draft.future.length) {
			draft.future = [];
		}
	}

	function clearHistory(draft) {
		draft.future = [];
		draft.past = [];
	}

	/*
	TODO: Extract activeTab(current property in tabs-panel widget) outside of widget.This would enable deleting
		  	next useMemo & useEffect, shouldGenerateHistory flag in onWidgetChange (and more)
	*/

	const shouldActiveTabChange = React.useMemo(() => {
		const widgets =
			state.modelType === MODEL_TYPE.BASE
				? state.customFieldWidgets
				: state.widgets;
		if (widgets) {
			const tabsPanelId = Object.entries(widgets).find(
				(widget) => widget[1].type === TYPE.tabs
			)?.[0];
			if (tabsPanelId) {
				const editWidget = widgets[state.editWidget];
				const isEditWidgetATab =
					editWidget &&
					editWidget.type === TYPE.panel &&
					JSON.parse(JSON.parse(editWidget.widgetAttrs || "{}").tab || "false");
				if (isEditWidgetATab) {
					return widgets[tabsPanelId].current !== state.editWidget;
				}
			}
		}
		return false;
	}, [
		state.modelType,
		state.widgets,
		state.customFieldWidgets,
		state.editWidget,
	]);

	// https://redmine.axelor.com/issues/63205#note-6
	React.useEffect(() => {
		if (shouldActiveTabChange) {
			setState((draft) => {
				const widgets =
					draft.modelType === MODEL_TYPE.BASE
						? draft.customFieldWidgets
						: draft.widgets;
				const tabsPanelId = Object.entries(widgets).find(
					(widget) => widget[1].type === TYPE.tabs
				)[0];
				widgets[tabsPanelId].current = draft.editWidget;
			});
		}
	}, [shouldActiveTabChange, setState]);

	const value = {
		onWidgetChange,
		onMove,
		onDrag,
		onRemove,
		onHover,
		onSelect,
		state,
		update: setState,
		setHoverAttr,
		startLoader,
		undo,
		redo,
		clearHistory,
		onTranslationRemove,
		addTabPanel,
	};
	return (
		<StoreContext.Provider value={value}>{children}</StoreContext.Provider>
	);
}

export function useStore() {
	return React.useContext(StoreContext);
}

export function useStoreState() {
	const { state } = React.useContext(StoreContext);
	return state;
}

export function useWidget(id) {
	const { widgets } = useStore();
	return widgets[id];
}

export default StoreProvider;
