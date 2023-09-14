import React from "react";
import classNames from "classnames";
import { compose } from "recompose";
import { DragSource, DropTarget } from "react-dnd";

import { useStore } from "../store/context";
import { TYPE as WIDGET_TYPE, IDS, MODEL_TYPE, FIELD_TYPE } from "../constants";
import Registry from "./Registery";
import { translate } from "../utils";
import PopoverAlert from "./PopoverAlert";

// Unique Type for Widget
const TYPE = Symbol();

// DragSource
const CardSource = {
	// evaluate widget is draggable or not
	canDrag(props) {
		if (props.state.resizing) return;
		const { state } = props;
		const isCustomField = props._type === "customField";

		// temporary restrict real view movement
		if (
			state.modelType === MODEL_TYPE.BASE &&
			!isCustomField &&
			!props.isPalleteField
		) {
			return;
		}
		return !(
			props.id === IDS.dumpField ||
			props.attrs.draggable === false ||
			props.attrs.type === "spacer" ||
			props.attrs.serverType === "spacer" ||
			props.attrs.type === WIDGET_TYPE.form
		);
	},
	// event, raise when start dragging widget
	beginDrag(props) {
		const _props = { ...props };
		const isPanel = _props.attrs.serverType === "panel";
		const isGrid = ["one-to-many", "many-to-many"].includes(
			_props.attrs.serverType
		);
		if (
			props.state.modelType === MODEL_TYPE.CUSTOM ||
			props._type === "customField"
		) {
			_props.attrs = {
				..._props.attrs,
				model: "com.axelor.meta.db.MetaJsonRecord",
				modelField: "attrs",
				widgetAttrs: JSON.stringify({
					...JSON.parse(_props.attrs.widgetAttrs || "{}"),
					colSpan:
						JSON.parse(_props.attrs.widgetAttrs || "{}").colSpan ||
						(isGrid ? 6 : undefined),
					showTitle: isPanel ? "false" : true,
					sidebar:
						JSON.parse(_props.attrs.widgetAttrs || "{}").sidebar ||
						(isPanel ? false : undefined),
				}),
			};
		} else if (props.state.modelType === MODEL_TYPE.BASE) {
			if (_props.attrs.isModelField) {
				_props.attrs = {
					..._props.attrs,
					...(_props.attrs.serverType !== "field" && {
						type: _props.attrs.serverType,
					}),
					serverType: "field",
				};
			}
			_props.attrs = {
				..._props.attrs,
				widgetAttrs: JSON.stringify({
					...JSON.parse(_props.attrs.widgetAttrs || "{}"),
					showTitle: isPanel ? "false" : true,
				}),
			};
		}
		props.onDrag(props.id, { props: _props });
		return { ...props };
	},
	// event, raise when dragging widget is droped on target or somewhere else
	// reset tasks
	endDrag(props, monitor) {
		// check widget is dropped or not, if not reset back to its position for existing element
		// for new element, remove it from schema
		props.onDrag(null, {
			isDrop: monitor.didDrop(),
			props: {},
			newProps: monitor.getItem(),
		});
	},
	// currently dragged element, special case for nested drag source
	isDragging(props, monitor) {
		return props.id === monitor.getItem().id;
	},
};

// DropTarget
const CardTarget = {
	// event, raised when one widget is hover on another widget

	hover(props, monitor) {
		let {
			index: maybeOutdatedDragIndex,
			/*  WARNING
			If layout changes while the element is being dragged, then index will be outdated
			rely on props.meta.grid?.find(item=>item.id === dragId).?cellIndice for grid layouts
			*/
			panelId: dragPanelId,
			id: dragId,
			attrs: dragAttrs,
		} = monitor.getItem();
		let {
			index: hoverIndex,
			panelId: hoverPanelId,
			id: hoverId,
			attrs: hoverAttrs,
			state,
			meta,
			setHoverAttr,
			isTab,
			panelId,
		} = props;
		const panelSet = [
			WIDGET_TYPE.panel,
			WIDGET_TYPE.panelDashlet,
			WIDGET_TYPE.panelRelated,
			WIDGET_TYPE.panelInclude,
		];
		const isCustomField = props._type === "customField";
		const widgets =
			props._type === "customField" ? state.customFieldWidgets : state.widgets;
		const parentPanel = props.panelId ? widgets[props.panelId] : null;
		/**
		 * Restrict form move
		 */
		if (dragAttrs.type === "customForm") {
			return;
		}
		/**
		 * Don't allow tabs to move if in edit state
		 * Don't allow tabs drop in first row or in between panels
		 */
		if (!meta) return;
		if (dragAttrs.type === WIDGET_TYPE.tabs) {
			if (meta.row === 0 && !dragAttrs.isNew) return;
			if (meta.grid) {
				let maxIndex = Math.max(...meta.grid.map((o) => o.rowIndex));
				if (meta.row < maxIndex) {
					return;
				}
			}
		}

		if (dragAttrs.type === WIDGET_TYPE.panel) {
			//Don't allow panel after tabs
			const { grid, row } = meta;
			const gridTab = grid && grid.find((f) => f.type === WIDGET_TYPE.tabs);
			if (gridTab && gridTab.rowIndex < row) {
				return;
			}
			//Dont't allow sidebar panel into tabs
			if (
				parentPanel &&
				parentPanel.type === WIDGET_TYPE.tabs &&
				(hoverAttrs.type === WIDGET_TYPE.panel ||
					JSON.parse(dragAttrs.widgetAttrs || "{}").sidebar)
			) {
				props.state.hoverWidget && props.onHover(null);
				return;
			}
		}

		// temporary restrict real view movement
		if (state.modelType === MODEL_TYPE.BASE && !isCustomField) {
			return;
		}
		if ([WIDGET_TYPE.menubar, WIDGET_TYPE.toolbar].includes(dragAttrs.type)) {
			const bar = Object.values(state.widgets || {}).find((w) =>
				[WIDGET_TYPE.menubar, WIDGET_TYPE.toolbar].includes(w.type)
			);
			const rowCount = bar ? 2 : 0;
			if (hoverPanelId) return;
			if (!meta) return;
			if (meta.row > rowCount || meta.col !== 1) return;
		}
		if (
			(state.modelType === MODEL_TYPE.CUSTOM || isCustomField) &&
			[WIDGET_TYPE.menubar, WIDGET_TYPE.toolbar].includes(dragAttrs.serverType)
		) {
			return;
		}
		if (
			![WIDGET_TYPE.menuItem, WIDGET_TYPE.menu, WIDGET_TYPE.divider].includes(
				dragAttrs.serverType
			) &&
			parentPanel &&
			parentPanel.type === WIDGET_TYPE.menu
		) {
			return;
		}
		if (
			[WIDGET_TYPE.menuItem, WIDGET_TYPE.divider].includes(
				dragAttrs.serverType
			) &&
			(!parentPanel || parentPanel.type !== WIDGET_TYPE.menu)
		) {
			return;
		}
		if (
			[WIDGET_TYPE.menu].includes(dragAttrs.serverType) &&
			(!parentPanel ||
				![WIDGET_TYPE.menu, WIDGET_TYPE.menubar].includes(parentPanel.type))
		) {
			return;
		}
		if (
			parentPanel &&
			parentPanel.type === WIDGET_TYPE.menubar &&
			dragAttrs.type !== WIDGET_TYPE.menu
		) {
			return;
		}
		if (
			parentPanel &&
			parentPanel.type === WIDGET_TYPE.toolbar &&
			dragAttrs.type !== FIELD_TYPE.button
		) {
			return;
		}
		if (
			!parentPanel &&
			![
				...panelSet,
				WIDGET_TYPE.tabs,
				WIDGET_TYPE.panelStack,
				WIDGET_TYPE.menubar,
				WIDGET_TYPE.toolbar,
			].includes(dragAttrs.type)
		) {
			return;
		}

		/**
		 * To add current widget into another panel-tab
		 */
		if (
			parentPanel &&
			hoverId &&
			hoverId !== 0 &&
			![...panelSet, WIDGET_TYPE.tabs].includes(dragAttrs.type) &&
			isTab &&
			props.className !== "active-tab"
		) {
			// need to update editWidget first into state object first for real model attrs
			props.update((draft) => {
				draft.editWidget = dragId;
				draft.hoverWidget = null;
				draft.editWidgetType =
					state.modelType === MODEL_TYPE.BASE && "customField";
				props.onWidgetChange(
					{
						id: panelId,
						props: {
							current: hoverId,
							_type: state.modelType === MODEL_TYPE.BASE && "customField",
						},
						skipGenerateHistory: true,
					},
					draft
				);
			});
		}
		// when stacked is true do not allow to drop field except specified panel types.
		if (
			parentPanel &&
			parentPanel.type === WIDGET_TYPE.panelStack &&
			!panelSet.includes(dragAttrs.type)
		) {
			return;
		}
		if (
			parentPanel &&
			parentPanel.type === WIDGET_TYPE.tabs &&
			!panelSet.includes(dragAttrs.type)
		) {
			return;
		}
		if (
			state.modelType === MODEL_TYPE.CUSTOM ||
			props._type === "customField"
		) {
			// let hasPanel = false;
			if (
				[
					WIDGET_TYPE.panelDashlet,
					WIDGET_TYPE.panelInclude,
					WIDGET_TYPE.panelRelated,
					WIDGET_TYPE.panelStack,
				].includes(dragAttrs.type)
			) {
				return;
			}
			// restrict nested panel drop in custom model
			const widgets =
				props._type === "customField"
					? state.customFieldWidgets
					: state.widgets;
			const stateItems =
				props._type === "customField" ? state.customFieldItems : state.items;
			const hasTabPanel =
				Object.keys(widgets).findIndex(
					(widgetKey) => widgets[widgetKey].type === WIDGET_TYPE.tabs
				) !== -1;
			if (
				hasTabPanel &&
				dragAttrs.type === WIDGET_TYPE.tabs &&
				dragAttrs.isNew
			) {
				return;
			}
			if (
				[WIDGET_TYPE.panel, WIDGET_TYPE.tabs].includes(dragAttrs.type) &&
				props.panelId &&
				!stateItems.includes(props.panelId)
			) {
				return;
			}
			// paneltab can drop inside panel tab
			if (
				parentPanel &&
				dragAttrs.type === WIDGET_TYPE.panel &&
				parentPanel.type !== WIDGET_TYPE.tabs
			) {
				return;
			}
			if (
				parentPanel &&
				dragAttrs.type === WIDGET_TYPE.tabs &&
				parentPanel.type === WIDGET_TYPE.panel
			) {
				return;
			}
		} else {
			if (props.panelId) {
				const parentPanel = widgets[props.panelId];
				if (
					parentPanel &&
					[WIDGET_TYPE.tabs, WIDGET_TYPE.panelStack].includes(dragAttrs.type)
				) {
					return;
				}
				if (
					[
						WIDGET_TYPE.panelDashlet,
						WIDGET_TYPE.panelRelated,
						WIDGET_TYPE.panelInclude,
					].includes(parentPanel.type)
				) {
					return;
				}
			}
		}
		if (dragAttrs.isCoreField === false && props._type === "customField") {
			return;
		}
		// skip for same item drag n drop
		// skip for dragging widget in same panel
		// skip for other hover elements(monitor.isOver) specially for nested target
		// skip for dragging field directly on form
		if (
			(hoverId === dragId && dragPanelId === hoverPanelId) ||
			(dragAttrs.items || []).indexOf(hoverId) > -1 ||
			!monitor.isOver({ shallow: true }) ||
			(dragAttrs.type === WIDGET_TYPE.field &&
				hoverAttrs.type === WIDGET_TYPE.form) ||
			(dragAttrs.type === WIDGET_TYPE.field && props.tabId !== undefined) ||
			(props.state.hoverWidget &&
				props.state.hoverWidget.id === hoverId &&
				props.state.hoverWidget.index === hoverIndex &&
				props.state.hoverWidget.panelId === hoverPanelId)
		) {
			return;
		}
		// Only for current dragging widget
		if (dragId === props.state.dragWidget) {
			const _hoverWidget = { ...props.state.hoverWidget };
			const _dragWidget = { ...props.state.dragWidgetProps };

			try {
				const dragIndex =
					props.meta.grid?.find((item) => item.id === dragId)?.cellIndice ||
					maybeOutdatedDragIndex;
				// skip for separator cell at the sides of dragged widget
				if (dragId && !dragAttrs.isNew && dragPanelId === hoverPanelId) {
					if (dragIndex + 1 === hoverIndex || dragIndex - 1 === hoverIndex) {
						props.state.hoverWidget && props.onHover(null);
						return;
					}
				}
				//skip for separator cells beside tab panel
				if (
					meta.isSeparator &&
					(meta.grid?.[hoverIndex + 1]?.type === WIDGET_TYPE.tabs ||
						(hoverIndex &&
							meta.grid?.[hoverIndex - 1]?.type === WIDGET_TYPE.tabs))
				) {
					props.state.hoverWidget && props.onHover(null);
					return;
				}

				//skip panel drop under sidePanel dummy fields
				if (
					_dragWidget.panelType !== "sidePanel" &&
					meta?.panelType === "sidePanel" &&
					_hoverWidget?.attrs.type === "dump_field"
				) {
					return;
				}

				const { isMoved } = props.onMove(
					{
						source: {
							panelId: dragPanelId,
							index: dragIndex,
							id: dragId,
							attrs: dragAttrs,
						},
						destination: {
							panelId: hoverPanelId,
							index: hoverIndex,
							id: hoverId,
							attrs: hoverAttrs,
							_type: props._type,
						},
					},
					true,
					props._type
				);
				if (isMoved && props.onHover) {
					/* TODO:
					 when sidepanel is hovered on mainPanel side, the hoverWidget is set as the dummyWidget
					 from mainPanel side, but hover Skeleton is shown on sidepanel side.
					 modify it so that , hoverWidget is null when hovered on mainPanel side
					*/
					props.onHover({
						meta: props.meta || {},
						id: hoverId,
						index: hoverIndex,
						panelId: hoverPanelId,
						position:
							props.panelColumns &&
							(`${props.panelColumns}` === "1" ||
								`${props.panelColumns}` === `${dragAttrs.colSpan}`) &&
							props.tabId === undefined &&
							hoverAttrs?.type !== "spacer" &&
							hoverAttrs?.serverType !== "spacer"
								? "top"
								: "default",
						attrs: hoverAttrs,
						_type: props._type,
					});
				} else {
					props.state.hoverWidget && props.onHover(null);
				}
			} catch (e) {}
		}

		if (parentPanel && parentPanel.widgetAttrs) {
			let parentWidgetAttrs = JSON.parse(parentPanel.widgetAttrs || "{}");
			let dragAttrsWidgetAttrs = JSON.parse(dragAttrs.widgetAttrs || "{}");
			if (
				parentWidgetAttrs.itemSpan &&
				!dragAttrsWidgetAttrs.colSpan &&
				["one-to-many", "many-to-many"].includes(dragAttrs.serverType)
			) {
				/**
				 * Temporary fix for AOP issue
				 * In AOP for grid relational fields, Parent panels itemSpan is not working
				 * So adding default span from here
				 */
				const attrs = JSON.parse(dragAttrs.widgetAttrs || "{}");
				const hoverAttrs = {
					widgetAttrs: JSON.stringify({
						...attrs,
						colSpan: parentWidgetAttrs.itemSpan,
					}),
				};
				setHoverAttr(hoverAttrs);
			}
		}
	},
	canDrop(props, monitor) {
		if (props?.attrs?.type === "form") return false;
		return true;
	},
};
const parse = (json) => {
	return JSON.parse(json || "{}");
};

function Widget(props) {
	let {
		id,
		isDragging,
		connectDragSource,
		connectDropTarget,
		highlighted,
		hovered,
		tabId,
		className,
		component: DefaultWidgetComponent,
		attrs = {},
		state,
		update,
		onWidgetChange,
		errorList = {},
		isPanelSidebar,
		panelType,
		...rest
	} = props;

	const { dragWidget, dragWidgetProps, hoverWidget, mainItems, sideItems } =
		state;
	const { attrs: dragWidgetAttrs } = dragWidgetProps || {};
	const { widgetAttrs, type } = dragWidgetAttrs || {};
	const { sidebar: isSidePanelDrg } =
		type === "panel" && JSON.parse(widgetAttrs || "{}");

	const ref = React.useRef(null);
	const [anchorEl, setAnchorEl] = React.useState(null);

	const isPanelRequired =
		sideItems.length && mainItems.length === 1 && mainItems[0] === id;

	const _widgets =
		rest._type === "customField" ? state.customFieldWidgets : state.widgets;

	const handleWidgetRemove = (event) => {
		setAnchorEl(event.currentTarget);
	};

	const handleClose = () => {
		setAnchorEl(null);
	};

	const handleYes = () => {
		if (rest.onRemove) {
			rest.onRemove(rest.panelId, rest.index, id, rest._type, isPanelRequired);
			handleClose();
		}
	};

	React.useEffect(() => {
		const scrollToWidgetView = () => {
			const section = ref.current;

			if (section && props.highlightedOption.id === id) {
				section.scrollIntoView({
					behavior: "smooth",
					block: "center",
				});
			}
		};

		id && props.highlightedOption && scrollToWidgetView();
	}, [props.highlightedOption, id]);

	// to determine if dragged widget will fit or not
	const canWidgetFit = () => {
		const {
			meta: { isSideBarWidget },
		} = hoverWidget;

		if (
			hoverWidget?.attrs?.serverType === "spacer" ||
			hoverWidget?.attrs?.type === "spacer" ||
			hoverWidget?.meta?.isSeparator
		) {
			return true;
		}

		const dragWidgetAttrsColSpan =
			typeof dragWidgetProps?.id === "symbol" &&
			["one-to-many", "many-to-many"].includes(
				dragWidgetProps?.attrs?.serverType
			)
				? undefined //Tempory fix for AOP issue
				: parse(dragWidgetProps?.attrs?.widgetAttrs).colSpan;

		const hoverWidgetParentItemSpan =
			parse((_widgets || {})[hoverWidget?.panelId]?.widgetAttrs).itemSpan ||
			(isSideBarWidget && 12);

		const isSeparator = dragWidgetProps?.attrs?.type === FIELD_TYPE.separator;
		const itemSpan =
			dragWidgetAttrsColSpan ||
			(isSeparator ? 12 : hoverWidgetParentItemSpan) ||
			6;
		const hoverSpan = hoverWidget?.meta?.colSpan;

		if (hoverSpan < itemSpan) {
			return false;
		}
		return true;
	};

	// special case for new element
	// hide/remove element from schema, if it drag outside form container(id=1)
	React.useEffect(() => {
		update((draft) => {
			draft.hoverWidget && (draft.hoverWidget.visible = hovered);
		});
	}, [update, hovered, id, dragWidget, attrs]);

	let registryField = Registry[attrs.type] || Registry.field;

	if (rest.isTab && !Registry[attrs.type]) {
		registryField = Registry["panel"];
	}

	let { component: WidgetComponent, props: componentProps = {} } =
		registryField;

	if (DefaultWidgetComponent) {
		WidgetComponent = DefaultWidgetComponent;
	}

	let isFormField = true;
	if (Object.values(IDS.createWidgets).indexOf(id) > -1) {
		isFormField = false;
		connectDropTarget = (e) => e;
	}
	const isEdit = isFormField && state.editWidget === id;
	const isTabWidget = tabId !== undefined;
	const isTabWidgetContent = isTabWidget ? !rest.isTab : false;
	const showRemove =
		isFormField &&
		Number(id) > 0 &&
		!isTabWidgetContent &&
		rest.design &&
		rest.canRemove !== false;
	//TODO: for attrs widgets , canRemove is undefined. It should have beeen true.
	//once this is done. change canRemove logic
	if (
		isTabWidgetContent ||
		(id &&
			id !== IDS.form &&
			typeof id !== "symbol" &&
			attrs.serverType !== "spacer" &&
			attrs.type !== "spacer" &&
			!rest.isTab)
	) {
		connectDropTarget = (e) => e;
	}
	if (attrs.isExist === false || (!rest.design && IDS.dumpField)) return null;

	const _isTab =
		rest.isTab || `${JSON.parse(attrs.widgetAttrs || "{}").tab}` === "true";

	let mouseDownPrevented = true;

	return (
		<React.Fragment>
			{connectDragSource(
				connectDropTarget(
					<div
						ref={ref}
						{...componentProps}
						className={classNames(
							className,
							"widget",
							componentProps.className,
							{
								"dummy-widget": attrs.isDummy,
								"spacer-widget":
									attrs.type === "spacer" || attrs.serverType === "spacer",
								edit: isEdit,
								highlighted: highlighted,
								hovered:
									isSidePanelDrg ||
									([WIDGET_TYPE.tabs, WIDGET_TYPE.panel].includes(type) &&
										attrs.type === WIDGET_TYPE.panel)
										? false
										: hovered,
								active: isFormField && isDragging,
								"form-field": isFormField,
								"panel-field": attrs.type === "panel",
								"non-title-panel":
									attrs.type === "panel" && !_isTab && !attrs.title,
								"title-panel": attrs.type === "panel" && !_isTab && attrs.title,
								"error-field": Boolean(errorList[id]),
								"pallete-field": rest.isPalleteField,
							}
						)}
						_type={rest._type}
						onMouseDown={(e) => {
							mouseDownPrevented = false;
						}}
						onClick={(e) => {
							if (mouseDownPrevented) {
								e.stopPropagation();
								return;
							}
							if (isFormField && rest.onSelect) {
								e.stopPropagation();
								const widget = _widgets && _widgets[id];
								if (widget.type !== "panel-tabs" && id !== IDS.dumpField) {
									rest.onSelect({ id, type: rest._type });
								}
							}
							if (isTabWidget) {
								e.stopPropagation();
								if (id !== IDS.dumpField && _widgets[tabId]) {
									onWidgetChange({
										id: tabId,
										props: {
											current: id,
											_type: rest._type,
										},
										skipGenerateHistory: true,
									});
								}
							}
						}}
					>
						{!isTabWidgetContent &&
							!rest.isBase &&
							state.hoverWidget &&
							typeof id !== "symbol" &&
							Number(id) >= 0 &&
							state.hoverWidget.index === rest.index &&
							state.hoverWidget.visible !== false &&
							state.hoverWidget.panelId === rest.panelId &&
							JSON.parse(isSidePanelDrg || "false") ===
								JSON.parse(rest.isSidePanelDummy || "false") && (
								<div
									className={classNames(
										{
											"hover-liner":
												["dump_field", "spacer", "field"].includes(
													state.hoverWidget.attrs.type
												) && panelType === state.hoverWidget?.meta?.panelType,
										},
										{ "dummy-widget": attrs.isDummy || id === 0 },
										state.hoverWidget.position,
										{ "no-fit": !canWidgetFit() }
									)}
								/>
							)}
						{WidgetComponent && (
							<WidgetComponent
								id={id}
								isDragging={state.dragWidget === id}
								attrs={attrs}
								_type={rest._type}
								errorList={errorList}
								canRemove={rest.canRemove}
								draggable={attrs.type !== WIDGET_TYPE.menubar}
								{...rest}
							/>
						)}
						{showRemove && !state.dragWidget && (
							<span
								onClick={handleWidgetRemove}
								className="widget-remove"
								title={translate("Remove widget")}
							>
								<i className="fa fa-remove" />
							</span>
						)}
						{anchorEl && (
							<PopoverAlert
								anchorEl={anchorEl}
								handleClose={handleClose}
								handleYes={handleYes}
							/>
						)}
					</div>
				)
			)}
		</React.Fragment>
	);
}

const SimpleWidget = (props) => (
	<Widget
		{...props}
		connectDropTarget={(e) => e}
		connectDragSource={(e) => e}
	/>
);

const DraggableWidget = compose(
	DropTarget(TYPE, CardTarget, (connect, monitor) => ({
		highlighted: false,
		hovered: monitor.isOver(),
		connectDropTarget: connect.dropTarget(),
	})),
	DragSource(TYPE, CardSource, (connect, monitor) => ({
		connectDragSource: connect.dragSource(),
		isDragging: monitor.isDragging(),
	}))
)(Widget);

export const WidgetComponent = (props) => {
	const store = useStore();
	const { state } = store;
	const _widgets =
		props._type === "customField" ? state.customFieldWidgets : state.widgets;
	const attrs =
		_widgets && _widgets[props.id] ? _widgets[props.id] : props.attrs || {};
	const _props = { ...store, attrs };
	const draggable = attrs.type !== WIDGET_TYPE.menubar;

	if (props.design || draggable)
		return <DraggableWidget {..._props} {...props} />;
	return <SimpleWidget {..._props} {...props} />;
};

export default React.memo(WidgetComponent);
