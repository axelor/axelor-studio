import React, { useCallback, useEffect, useState, useRef } from "react"
import classNames from "classnames"
import { PANEL_TYPE, TYPE, IDS } from "../constants"
import { useStore } from "../store/context"
import ResizeColumn, { Table, Row, Column } from "./resize/Resize"
import { isMaxWidget, isWidgetOfType } from "../utils"
import { useDragLayer } from "react-dnd"

const DEFAULTS = {
	ITEM_COLSPAN: 1,
	MAX_SIZE: 12,
	PARENT_ITEM_SPAN: 6,
}

const getColSpan = (col, parentItemSpan) => {
	const widgetAttrs = col.widgetAttrs ? col.widgetAttrs : {}
	if (widgetAttrs.colSpan) {
		return Number(widgetAttrs.colSpan)
	} else {
		if (!isWidgetOfType(col, TYPE.panel) && isMaxWidget(col))
			return DEFAULTS.MAX_SIZE
		return Number(parentItemSpan) || DEFAULTS.PARENT_ITEM_SPAN
	}
}

const getFullGrid = (
	items,
	size = DEFAULTS.MAX_SIZE,
	isStackLayout,
	parentItemSpan,
	draggedWidgetAttrsColSpan,
	isMaxDragWidget
) => {
	const grid = []
	const isStack = size === 1 || isStackLayout
	const gridSize = isStack ? DEFAULTS.MAX_SIZE : size
	const _parentItemSpan = parentItemSpan || DEFAULTS.PARENT_ITEM_SPAN
	let row = []
	let span = 0

	const getItemColspan = (colSpan) => {
		return Number(colSpan)
	}

	if (!items.length) {
		let remainingSpan = gridSize
		const row = []
		const $cell = { id: 0, separator: true }

		while (remainingSpan > 0) {
			row.push($cell)
			const colSpan = isStack
				? gridSize
				: remainingSpan <
				  (draggedWidgetAttrsColSpan ||
						(isMaxDragWidget ? DEFAULTS.MAX_SIZE : _parentItemSpan))
				? remainingSpan
				: draggedWidgetAttrsColSpan ||
				  (isMaxDragWidget ? DEFAULTS.MAX_SIZE : _parentItemSpan)
			row.push({
				id: 0,
				dummy: true,
				dummyPanel: true,
				colSpan: Number(colSpan),
			})
			remainingSpan -= colSpan
			if (remainingSpan <= 0) {
				row.push($cell)
			}
		}

		return [row]
	}

	const addRow = ({ item, overflow = false } = {}) => {
		if (overflow) {
			let fillColspan = gridSize - (span - getItemColspan(item.colSpan))
			while (fillColspan > 0) {
				if (
					fillColspan >
					(draggedWidgetAttrsColSpan ||
						(isMaxDragWidget ? DEFAULTS.MAX_SIZE : _parentItemSpan))
				) {
					row.push({
						id: 0,
						dummy: true,
						colSpan:
							draggedWidgetAttrsColSpan ||
							(isMaxDragWidget ? DEFAULTS.MAX_SIZE : _parentItemSpan),
					})
				} else {
					row.push({
						id: 0,
						dummy: true,
						colSpan: fillColspan,
					})
				}
				fillColspan -=
					draggedWidgetAttrsColSpan ||
					(isMaxDragWidget ? DEFAULTS.MAX_SIZE : _parentItemSpan)
			}
		}
		grid.push(row)
		row = []
		span = 0
	}

	const addItem = (item) => row.push(item)

	for (let i = 0; i < items.length; i++) {
		const item = Object.assign(
			items[i],
			isStack
				? { colSpan: DEFAULTS.MAX_SIZE }
				: { colSpan: getItemColspan(getColSpan(items[i], parentItemSpan)) }
		)
		const { colSpan: itemSpan = DEFAULTS.ITEM_COLSPAN } = item
		const isLastItem = i === items.length - 1
		span += getItemColspan(itemSpan)
		if (span > gridSize) {
			addRow({ item, overflow: true })
			span = itemSpan
			addItem(item)
		} else if (span === gridSize) {
			row.push(item)
			addRow({ item })
		} else {
			row.push(item)
		}

		if (isLastItem && row.length) {
			const occupiedSpan = row.reduce(
				(total, { colSpan = DEFAULTS.ITEM_COLSPAN }) => total + colSpan,
				0
			)
			let remainSpan = gridSize - occupiedSpan
			while (remainSpan > 0) {
				if (
					remainSpan <=
					(draggedWidgetAttrsColSpan ||
						(isMaxDragWidget ? DEFAULTS.MAX_SIZE : _parentItemSpan))
				) {
					row.push({
						id: 0,
						dummy: true,
						colSpan: remainSpan,
					})
				} else {
					row.push({
						id: 0,
						dummy: true,
						colSpan: Number(
							draggedWidgetAttrsColSpan ||
								(isMaxDragWidget ? DEFAULTS.MAX_SIZE : _parentItemSpan)
						),
					})
				}
				remainSpan -=
					draggedWidgetAttrsColSpan ||
					(isMaxDragWidget ? DEFAULTS.MAX_SIZE : _parentItemSpan)
			}
			grid.push(row)
		}
	}

	const fullGrid = []
	for (let i = 0; i < grid.length; i++) {
		const row = grid[i]
		const { widgetAttrs, type } = row[0]
		const sidebar = type === "panel" && widgetAttrs?.sidebar
		const isSidePanelDummy = JSON.parse(sidebar || "false")
		const draggable = ![TYPE.menubar, TYPE.toolbar].includes(row[0]?.type)
		const upRow = []
		const midRow = []
		const addCell = ($row, options = { separator: true }) =>
			$row.push({
				id: 0,
				colSpan: 1,
				...options,
			})
		!isSidePanelDummy &&
			addCell(upRow, {
				separator: true,
			})

		// remove starting separator when side panel is true
		if (!isSidePanelDummy) {
			draggable &&
				addCell(midRow, {
					relatedColSpan: getColSpan(row[0], parentItemSpan),
					separator: true,
				})
		}

		for (let j = 0; j < row.length; j++) {
			const col = row[j]
			const colSpan = getColSpan(col, parentItemSpan)
			addCell(midRow, col)

			// remove end separator when side panel is true
			if (!isSidePanelDummy) {
				draggable &&
					addCell(midRow, {
						relatedColSpan: colSpan,
						separator: true,
					})
			}
		}
		if (row.length) {
			let totalSpan = gridSize
			while (totalSpan > 0) {
				addCell(upRow, {
					dummy: true,
					isSidePanelDummy,
					colSpan: Number(
						totalSpan <=
							(draggedWidgetAttrsColSpan ||
								(isMaxDragWidget || isSidePanelDummy
									? DEFAULTS.MAX_SIZE
									: _parentItemSpan))
							? totalSpan
							: draggedWidgetAttrsColSpan ||
									(isMaxDragWidget || isSidePanelDummy
										? DEFAULTS.MAX_SIZE
										: _parentItemSpan)
					),
				})
				!isSidePanelDummy &&
					addCell(upRow, {
						relatedColSpan: Number(_parentItemSpan),
						separator: true,
					})
				totalSpan -=
					draggedWidgetAttrsColSpan ||
					(isMaxDragWidget || isSidePanelDummy
						? DEFAULTS.MAX_SIZE
						: _parentItemSpan)
			}
		}

		draggable ? fullGrid.push(upRow) : fullGrid.push([])
		fullGrid.push(midRow)

		if (i === grid.length - 1) {
			fullGrid.push(upRow)
		}
	}
	return fullGrid
}

// Grid Container embeds grid cell
export const GridContainer = ({ className, attrs, children, ...rest }) => (
	<div
		className={classNames(
			className,
			attrs.cols ? `grid-span grid-${attrs.cols}` : ""
		)}
		{...rest}
	>
		{children}
	</div>
)

// NOTE: This hook is used to prevent error due circular dependency.
// Widget => Panel => Grid => Widget
export function useGridWidget() {
	const [WidgetComponent, setWidgetComponent] = React.useState(() => null)

	React.useEffect(() => {
		import("./Widget").then((module) =>
			setWidgetComponent(() => module.default)
		)
	}, [])

	return WidgetComponent
}

/**
 * Grid Component handle layout of Container Components like panels
 */
function Grid(props) {
	const WidgetComponent = useGridWidget()
	const {
		state: {
			widgets: _widgets,
			customFieldWidgets,
			highlightedOption,
			drawerOpen,
			propertiesPanelWidth,
			editWidget,
		},
		onWidgetChange,
	} = useStore()
	const { dragWidget } = useDragLayer((monitor) => ({
		dragWidget: monitor.getItem(),
	}))
	const { className, items, attrs = {}, panelId, design, panelType } = props
	const { sidebar, itemSpan: span } = attrs.widgetAttrs || {}
	const widgets = props._type === "customField" ? customFieldWidgets : _widgets
	const panelWidget = widgets[panelId]?.widgetAttrs

	const draggedWidgetAttrsColSpan = dragWidget?.attrs?.widgetAttrs?.colSpan

	const isMaxDragWidget = isMaxWidget(dragWidget?.attrs)
	const tableRow = useRef(0)
	const [tableRowWidth, setTableRowWidth] = useState(
		tableRow.current?.offsetWidth
	)

	const gridSize = Number(attrs.cols || 1)
	const columns = gridSize * 2 + 1
	const isStackLayout = attrs.layout === PANEL_TYPE.stack
	const itemSpan = sidebar && !span ? 12 : span
	const [rows, gridRows] = React.useMemo(() => {
		let cellIndice = 0
		const childs = items.map((x) =>
			Object.assign({}, widgets[x] || {}, { id: x })
		)
		const rows = getFullGrid(
			childs,
			gridSize,
			isStackLayout,
			itemSpan,
			draggedWidgetAttrsColSpan,
			isMaxDragWidget
		).map((columns, rowIndex) => {
			let span = 0
			return columns.map((c) => {
				let columnIndex = span
				span += c.separator ? 0 : Number(c.colSpan || 1)
				return { ...c, rowIndex, columnIndex, cellIndice: cellIndice++ }
			})
		})
		return [rows, rows.flat()]
	}, [
		items,
		widgets,
		gridSize,
		isStackLayout,
		itemSpan,
		draggedWidgetAttrsColSpan,
		isMaxDragWidget,
	])

	const isPanelSidebar = JSON.parse(panelWidget?.sidebar || "false")

	const getHighlightedOptionStatus = React.useCallback(
		(name, title) => {
			if (name) {
				return true
			} else if (title) {
				if (highlightedOption?.title === title) {
					return true
				}
			}
		},
		[highlightedOption]
	)
	const handleGridChange = useCallback(
		(span, id) => {
			const widgetAttrs = widgets[id].widgetAttrs
			onWidgetChange({
				id,
				props: {
					widgetAttrs: {
						...widgetAttrs,
						colSpan: span,
					},
				},
			})
		},
		[onWidgetChange, widgets]
	)

	const canResize = (id) => editWidget != null && editWidget === id

	const nonResizableWidgets =
		props._type === "customField"
			? [TYPE.tabs, TYPE.form]
			: [TYPE.panel, TYPE.tabs, TYPE.form]

	const isResizable = (id, type) =>
		id !== IDS.dumpField &&
		!nonResizableWidgets.includes(type) &&
		props.canRemove !== false
	//TODO: for attrs widgets , canRemove is undefined. It should have beeen true.
	//once this is done. change canRemove logic

	useEffect(() => {
		const width = tableRow.current?.offsetWidth - 28
		if (!isNaN(width)) setTableRowWidth(width)
	}, [tableRowWidth, drawerOpen, propertiesPanelWidth, rows])

	return (
		<GridContainer {...{ attrs, className }} w={100}>
			<Table>
				{rows.map((cols, rowIndex) => (
					<Row
						className={rowIndex % 2 === 0 ? "empty-row" : "fill-row"}
						key={rowIndex}
						ref={tableRow}
					>
						{cols.map(
							(
								{
									id,
									colSpan,
									cellIndice: indice,
									columnIndex,
									separator,
									relatedColSpan,
									isSidePanelDummy,
									type,
									widgetAttrs,
									name,
									title,
								},
								i
							) => {
								const Widget = WidgetComponent && (
									<WidgetComponent
										className={
											highlightedOption?.name === name &&
											getHighlightedOptionStatus(name, title)
												? "search-overlay"
												: ""
										}
										design={design}
										meta={{
											isSeparator: Boolean(separator),
											colSpan,
											row: rowIndex,
											col: i,
											colIndex: columnIndex,
											grid: gridRows,
											total: columns,
											relatedColSpan: relatedColSpan,
											isSideBarWidget: isPanelSidebar || false,
											panelType,
										}}
										isSidePanelDummy={isSidePanelDummy}
										panelId={panelId}
										key={id ? id : "" + id + indice}
										id={id}
										index={indice}
										panelColumns={attrs.cols}
										_type={props._type}
										widgetErrorList={props.widgetErrorList}
										customErrorList={props.customErrorList}
										canRemove={props.canRemove}
										highlightedOption={highlightedOption}
										isBase={props.isBase}
										isPanelSidebar={isPanelSidebar}
										panelType={panelType}
									/>
								)
								return isResizable(id, type) ? (
									<ResizeColumn
										key={id ? id : "" + id + indice}
										id={id}
										canResize={canResize(id)}
										colSpan={colSpan}
										onResize={handleGridChange}
										maxwidth={tableRowWidth}
										editWidget={editWidget}
									>
										{Widget}
									</ResizeColumn>
								) : (
									<Column
										key={id ? id : "" + id + indice}
										colSpan={separator ? 0 : colSpan}
										className={separator ? "separator" : ""}
										widgetAttrs={widgetAttrs}
										isSidePanelDummy={isSidePanelDummy}
										type={type}
									>
										{Widget}
									</Column>
								)
							}
						)}
					</Row>
				))}
			</Table>
		</GridContainer>
	)
}

export default Grid
