import React from "react"
import classNames from "classnames"
import { useDragLayer, useDrag, useDrop } from "react-dnd"

import { useStore } from "../store/context"
import { TYPE as WIDGET_TYPE, IDS, MODEL_TYPE } from "../constants"
import Registry from "./Registery"
import {
	isWidgetSpacer,
	translate,
	isSidebarPanel,
	isMaxWidget,
	getWidgetElementId,
} from "../utils"
import PopoverAlert from "./PopoverAlert"

// Unique Type for Widget
const TYPE = Symbol()

const SimpleWidget = React.forwardRef((props, ref) => {
	let {
		id,
		isDragging,
		hovered,
		tabId,
		className,
		component: DefaultWidgetComponent,
		attrs = {},
		state,
		changeCurrentTab,
		customErrorList = {},
		widgetErrorList = {},
		isPanelSidebar,
		panelType,
		isDragInProgress,
		showHoverLiner,
		dragWidget,
		...rest
	} = props

	const { attrs: dragWidgetAttrs } = dragWidget || {}
	const { widgetAttrs, type } = dragWidgetAttrs || {}
	const isSidePanelDrg = type === "panel" && widgetAttrs?.sidebar

	const innerRef = React.useRef(null)
	React.useImperativeHandle(ref, () => innerRef.current)

	const [anchorEl, setAnchorEl] = React.useState(null)

	const _widgets =
		rest._type === "customField" ? state.customFieldWidgets : state.widgets

	const handleWidgetRemove = (event) => {
		setAnchorEl(event.currentTarget)
	}

	const handleClose = () => {
		setAnchorEl(null)
	}

	const handleYes = () => {
		if (rest.onRemove) {
			rest.onRemove(rest.panelId, rest.index, id, rest._type)
			handleClose()
		}
	}

	React.useEffect(() => {
		const scrollToWidgetView = () => {
			const section = innerRef.current

			if (section && props.highlightedOption.id === id) {
				section.scrollIntoView({
					behavior: "smooth",
					block: "center",
				})
			}
		}

		id && props.highlightedOption && scrollToWidgetView()
	}, [props.highlightedOption, id])

	// to determine if dragged widget will fit or not
	const canWidgetFit = () => {
		if (!showHoverLiner) return false // this function shouldn't be called while showHoverLiner is false
		if (isWidgetSpacer(props.attrs) || props.meta.isSeparator) {
			return true
		}

		const hoverWidgetParentItemSpan =
			(_widgets || {})[props.panelId]?.widgetAttrs?.itemSpan ||
			(props.meta.isSideBarWidget && 12)

		const dragWidgetAttrsColSpan = dragWidget?.attrs?.widgetAttrs?.colSpan

		const itemSpan =
			dragWidgetAttrsColSpan ||
			(isMaxWidget(dragWidget?.attrs) ? 12 : hoverWidgetParentItemSpan) ||
			6
		const hoverSpan = props.meta?.colSpan

		if (hoverSpan < itemSpan) {
			return false
		}
		return true
	}

	let registryField = Registry[attrs.type] || Registry.field

	if (rest.isTab && !Registry[attrs.type]) {
		registryField = Registry["panel"]
	}

	let { component: WidgetComponent, props: componentProps = {} } = registryField

	if (DefaultWidgetComponent) {
		WidgetComponent = DefaultWidgetComponent
	}

	let isFormField = true
	if (Object.values(IDS.createWidgets).indexOf(id) > -1) {
		isFormField = false
	}
	const isEdit = isFormField && state.editWidget === id
	const isTabWidget = tabId !== undefined
	const isTabWidgetContent = isTabWidget ? !rest.isTab : false
	const showRemove =
		isFormField &&
		Number(id) > 0 &&
		!isTabWidgetContent &&
		rest.design &&
		rest.canRemove !== false
	//TODO: for attrs widgets , canRemove is undefined. It should have beeen true.
	//once this is done. change canRemove logic
	if (attrs.isExist === false || (!rest.design && IDS.dumpField)) return null

	const _isTab = rest.isTab || `${attrs.widgetAttrs?.tab}` === "true"

	let mouseDownPrevented = true

	return (
		<div
			ref={innerRef}
			{...(typeof id === "string" ? { id: getWidgetElementId(id) } : {})}
			{...componentProps}
			className={classNames(className, "widget", componentProps.className, {
				"dummy-widget": attrs.isDummy,
				"spacer-widget": isWidgetSpacer(attrs),
				edit: isEdit,
				hovered:
					isSidePanelDrg ||
					([WIDGET_TYPE.tabs, WIDGET_TYPE.panel].includes(type) &&
						attrs.type === WIDGET_TYPE.panel)
						? false
						: hovered,
				active: isFormField && isDragging,
				"form-field": isFormField,
				"panel-field": attrs.type === "panel",
				"non-title-panel": attrs.type === "panel" && !_isTab && !attrs.title,
				"title-panel": attrs.type === "panel" && !_isTab && attrs.title,
				"error-field": Boolean(widgetErrorList[id] ?? customErrorList[id]),
				"pallete-field": rest.isPalleteField,
			})}
			_type={rest._type}
			onMouseDown={(e) => {
				mouseDownPrevented = false
			}}
			onClick={(e) => {
				if (mouseDownPrevented) {
					e.stopPropagation()
					return
				}
				if (isFormField && rest.onSelect) {
					e.stopPropagation()
					const widget = _widgets && _widgets[id]
					if (widget.type !== "panel-tabs" && id !== IDS.dumpField) {
						rest.onSelect({ id, type: rest._type })
					}
				}
				if (isTabWidget) {
					e.stopPropagation()
					if (id !== IDS.dumpField && _widgets[tabId]) {
						changeCurrentTab({
							id: tabId,
							current: id,
							isCustomField: rest._type === "customField",
						})
					}
				}
			}}
		>
			{showHoverLiner && (
				<div
					className={classNames(
						"hover-liner",
						{ "dummy-widget": attrs.isDummy || id === 0 },
						props.panelColumns &&
							(`${props.panelColumns}` === "1" ||
								`${props.panelColumns}` === `${dragWidgetAttrs.colSpan}`) &&
							props.tabId === undefined &&
							!isWidgetSpacer(props.attrs)
							? "top"
							: "default",
						{ "no-fit": !canWidgetFit() }
					)}
				/>
			)}
			{WidgetComponent && (
				<WidgetComponent
					id={id}
					attrs={attrs}
					_type={rest._type}
					customErrorList={customErrorList}
					widgetErrorList={widgetErrorList}
					canRemove={rest.canRemove}
					draggable={attrs.type !== WIDGET_TYPE.menubar}
					{...rest}
				/>
			)}
			{showRemove && !isDragInProgress && (
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
})

const DraggableWidget = (props) => {
	const [{ isDragging }, dragRef] = useDrag({
		type: TYPE,
		collect: (monitor, props) => ({
			isDragging: monitor.isDragging(),
		}),
		item: props,
		canDrag: (monitor) => {
			if (props.state.resizing) return false
			const { state } = props
			const isCustomField = props._type === "customField"

			// temporary restrict real view movement

			if (
				state.modelType === MODEL_TYPE.BASE &&
				!isCustomField &&
				!props.isPalleteField
			) {
				return false
			}
			// prevent the last remaining mainPanel from being dragged.
			if (
				state.hasOnlyOneNonSidebarItem &&
				state.items.includes(props.id) &&
				!isSidebarPanel(state.widgets[props.id])
			) {
				return false
			}

			return !(
				props.id === IDS.dumpField ||
				props.attrs.draggable === false ||
				isWidgetSpacer(props.attrs) ||
				props.attrs.type === WIDGET_TYPE.form ||
				(props.attrs.type === WIDGET_TYPE.tabs && !props.isPalleteField)
			)
		},
		isDragging: (monitor) => {
			return props.id === monitor.getItem().id
		},
	})

	const [{ hovered, showHoverLiner }, dropRef] = useDrop({
		accept: TYPE,
		collect: (monitor, props) => {
			const isOver = monitor.isOver({ shallow: true })
			return {
				hovered: isOver,
				showHoverLiner: isOver && monitor.canDrop(),
			}
		},
		drop: (item, monitor) => {
			!monitor.didDrop() && props.onDrop(item, props)
		},

		canDrop(item, monitor) {
			/*  WARNING
					If layout changes while the element is being dragged, then item.index will be outdated
					rely on props.meta.grid?.find(item=>item.id === dragId).?cellIndice for grid layouts
			*/
			// Only allow dumpFields and spacer to accept drop
			if (props.id !== IDS.dumpField && !isWidgetSpacer(props.attrs))
				return false

			const widgets =
				props._type === "customField"
					? props.state.customFieldWidgets
					: props.state.widgets
			const stateItems =
				props._type === "customField"
					? props.state.customFieldItems
					: props.state.items
			const parentPanel = props.panelId ? widgets[props.panelId] : null

			// Do not allow anything other than panels and tab-panel to be dropped into form
			if (
				!parentPanel &&
				![WIDGET_TYPE.panel, WIDGET_TYPE.tabs].includes(item.attrs.type)
			) {
				return false
			}

			if (item.attrs.type === WIDGET_TYPE.panel) {
				// Prevent nested panel drop
				if (parentPanel && parentPanel.type !== WIDGET_TYPE.tabs) return false
				//Don't allow panel after tabs
				const { grid, row } = props.meta
				const gridTab = grid && grid.find((f) => f.type === WIDGET_TYPE.tabs)
				if (gridTab && gridTab.rowIndex < row) {
					return false
				}
			} else if (parentPanel && parentPanel.type === WIDGET_TYPE.tabs) {
				// Don't allow non panel widgets into tabs-panel
				return false
			}

			if (item.attrs.type === WIDGET_TYPE.tabs) {
				// Prevent nested panel drop
				if (parentPanel) return false
				// Do not allow tabs into sidepanel
				if (props.panelType === "sidePanel") return false
				// Only allow tab-panel at the end of form
				let maxIndex = Math.max(...props.meta.grid.map((o) => o.rowIndex))
				if (props.meta.row < maxIndex) {
					return false
				}
				const hasTabPanel = stateItems.some(
					(id) => widgets[id].type === WIDGET_TYPE.tabs
				)
				// Do not allow tab-panel if one already exists
				if (hasTabPanel) return false
			}
			// skip for separator cell at the sides of dragged widget
			if (!Object.values(IDS.createWidgets).indexOf(item.id) > -1) {
				const dragIndex = props.meta.grid?.find(
					(gridItem) => gridItem.id === item.id
				)?.cellIndice
				if (dragIndex + 1 === props.index || dragIndex - 1 === props.index) {
					return false
				}
			}
			//skip for separator cells beside tab panel
			if (
				props.meta.isSeparator &&
				(props.meta.grid?.[props.index + 1]?.type === WIDGET_TYPE.tabs ||
					props.meta.grid?.[props.index - 1]?.type === WIDGET_TYPE.tabs)
			) {
				return false
			}
			return true
		},
		hover: (item, monitor) => {
			const { attrs: dragAttrs } = item
			const { id: hoverId, meta, isTab, panelId, _type } = props
			// change tab when widget is hovered on non-active tab.
			if (
				monitor.isOver({ shallow: true }) &&
				![WIDGET_TYPE.panel, WIDGET_TYPE.tabs].includes(dragAttrs.type)
			) {
				if (
					meta &&
					panelId &&
					hoverId &&
					hoverId !== 0 &&
					isTab &&
					props.className !== "active-tab"
				) {
					props.debouncedChangeTab(panelId, hoverId, _type === "customField")
					return
				} else {
					props.clearTabChangeTimer()
				}
			}
		},
	})

	const { isDragInProgress, dragWidget } = useDragLayer((monitor) => ({
		isDragInProgress: monitor.isDragging(),
		dragWidget: monitor.getItem(),
	}))

	return (
		<SimpleWidget
			{...props}
			isDragging={isDragging}
			hovered={hovered}
			dragWidget={dragWidget}
			showHoverLiner={showHoverLiner}
			isDragInProgress={isDragInProgress}
			ref={(el) => {
				dragRef(el)
				dropRef(el)
			}}
		/>
	)
}

export const WidgetComponent = (props) => {
	const store = useStore()
	const { state } = store
	const _widgets =
		props._type === "customField" ? state.customFieldWidgets : state.widgets
	const attrs =
		_widgets && _widgets[props.id] ? _widgets[props.id] : props.attrs || {}
	const _props = { ...store, attrs }
	const draggable = attrs.type !== WIDGET_TYPE.menubar

	if (props.isBase || !(props.design || draggable))
		return <SimpleWidget {..._props} {...props} />
	return <DraggableWidget {..._props} {...props} />
}

export default React.memo(WidgetComponent)
