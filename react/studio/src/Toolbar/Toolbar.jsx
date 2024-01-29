import React, { useCallback, useState } from "react"
import ViewSelection from "./ViewSelection"
import { HISTORY, MODEL_TYPE, TYPE } from "../constants"
import { useKeyPress } from "../custom-hooks/useKeyPress"
import { useComponentVisible } from "../custom-hooks/useComponentVisible"
import { getWidgetElementId, translate } from "../utils"

import Select from "./Select"
import { useStore } from "../store/context"
import { Box, ClickAwayListener } from "@axelor/ui"
import { MaterialIcon } from "@axelor/ui/icons/material-icon"
import IconButton from "../components/IconButton"

const ToolbarContainer = (props) => (
	<Box
		d="flex"
		flexWrap="wrap"
		justifyContent="space-between"
		bg="body-tertiary"
		py={2}
		px={3}
		w={100}
		style={{
			zIndex: "1000",
			height: "inherit",
		}}
		{...props}
	/>
)
const SelectionContainer = (props) => (
	<Box d="flex" alignItems="center" flexWrap="wrap" {...props} />
)

const ViewContainer = (props) => (
	<Box d="flex" alignItems="center" flexWrap="wrap" flex={1} {...props} />
)

const ToolbarActions = (props) => (
	<Box d="flex" justifyContent="center" alignItems="center" {...props} />
)

function isStudioView(view) {
	if (view && view.xmlId && view.xmlId.indexOf("studio-") === 0) {
		return true
	}
	return false
}

function ToolbarButton(props) {
	return <IconButton {...props} size="large" />
}

const getOptionLabel = (option) => {
	if (option.title === null) {
		return `${option?.type} (${option?.name})`
	} else if (!option.name) {
		return `${option?.title} `
	}
	return `${option?.title} (${option?.name})`
}

const getOptionSelected = (option, value) => {
	if (option && option.name) {
		return option?.name === value?.name
	} else {
		return option?.title === value?.title
	}
}

const getError = (errorList) => {
	let [widgetId, error] = Object.entries(errorList || {})[0] ?? []
	if (widgetId != null && error) {
		const message = Object.values(error)[0]
		return [widgetId, message]
	}
	return []
}

function Toolbar({
	update,
	saveView,
	saveCustomFieldView,
	removeView,
	onNew,
	reset,
	showAlert,
	onSelect,
	isStudioLite,
	onWidgetChange,
	changeCurrentTab,
	...props
}) {
	const {
		state: {
			extensionView,
			model,
			modelType,
			customModel,
			widgets,
			items,
			customFieldWidgets,
			customFieldItems,
			highlightedOption,
			selectedView,
			widgetErrorList,
			customErrorList,
			past,
			future,
			modelField,
			entityType,
			metaFieldStore,
			loader,
		},
	} = useStore()

	const { isComponentVisible, setIsComponentVisible } =
		useComponentVisible(false)

	const isRemoveDisabled =
		!(
			extensionView ||
			isStudioView(selectedView) ||
			(modelType === MODEL_TYPE.CUSTOM && Boolean(customModel))
		) || loader
	const isNewDisabled = (modelType === MODEL_TYPE.BASE && !model) || loader

	const getSearchOptions = useCallback((widgets, items, isCustomField) => {
		const options = generateOptions({ items })
		return options

		function generateOptions({
			options = [],
			items,
			tabsPanelId,
			ancestralTabsInfo,
		}) {
			;(items || []).forEach((id) => {
				const widget = widgets[id]
				if (widget) {
					const { name, title, type, autoTitle = "", items } = widget
					let tabsInfo = ancestralTabsInfo
					if ((name || title) && type !== TYPE.tabs) {
						const option = {
							id: id || null,
							name,
							title: title || autoTitle || null,
							type,
							isCustomField,
						}
						if (tabsPanelId) {
							// NOTE: Although this supports nested tabs-panels, backend doesn't.
							// so tabsInfo array practically only contains 1 element
							tabsInfo = [
								...(ancestralTabsInfo || []),
								{ tabsPanelId: tabsPanelId, current: id },
							]
						}
						if (tabsInfo) {
							option.tabsInfo = tabsInfo
						}
						options.push(option)
					}
					if (items?.length) {
						generateOptions({
							options,
							items,
							tabsPanelId: type === TYPE.tabs && id,
							ancestralTabsInfo: tabsInfo,
						})
					}
				}
			})
			return options
		}
	}, [])

	const showError = React.useCallback(
		(id, message, isCustomField) => {
			const element = document.getElementById(getWidgetElementId(id))
			if (element) {
				showAlert(message, null, () => {
					element.scrollIntoView({ behaviour: "instant", block: "center" })
					onSelect({ id, type: isCustomField ? "customField" : null })
				})
				return
			}
			// if element with error is not in the DOM, it is in a non activeTab
			// so we switch to the whatever tab that element is in.
			// BUG: If the element is in closed collapsible menu, it won't be scrolledTo
			const _widgets = isCustomField ? customFieldWidgets : widgets
			const _items = isCustomField ? customFieldItems : items
			//TODO: we use getSearchOptions but the we only need tabsInfo for the widget with error
			//so this could be improved
			const options = getSearchOptions(_widgets, _items, isCustomField)
			const { tabsInfo } = options.find((o) => o.id === id)
			if (tabsInfo) {
				// NOTE: Although this supports nested tabs-panels, backend doesn't.
				// so tabsInfo array practically only contains 1 element
				tabsInfo.forEach(({ tabsPanelId, current }) => {
					changeCurrentTab({
						id: tabsPanelId,
						current,
						isCustomField,
						skipSelect: true,
					})
				})
				showAlert(message, null, () => {
					const element = document.getElementById(getWidgetElementId(id))
					if (element) {
						element.scrollIntoView({ behaviour: "instant", block: "center" })
						onSelect({ id, type: isCustomField ? "customField" : null })
					}
				})
			}
			return
		},
		[
			onSelect,
			showAlert,
			changeCurrentTab,
			customFieldItems,
			items,
			customFieldWidgets,
			widgets,
			getSearchOptions,
		]
	)

	const save = React.useCallback(() => {
		let isCustomField = false
		let [id, errorMessage] = getError(widgetErrorList)
		if (id == null || !errorMessage) {
			;[id, errorMessage] = getError(customErrorList)
			isCustomField = true
		}
		if (id != null && errorMessage) {
			showError(id, errorMessage, isCustomField)
			return
		}
		saveView()
		if (modelType === MODEL_TYPE.BASE) {
			saveCustomFieldView()
		}
		onSelect({ id: -1 })
	}, [
		showError,
		saveView,
		saveCustomFieldView,
		modelType,
		customErrorList,
		widgetErrorList,
		onSelect,
	])
	const [options, setOptions] = useState([])

	const handleSearch = useCallback(
		(event) => {
			if (modelType === MODEL_TYPE.BASE && !model) {
				return
			} else if (
				modelType === MODEL_TYPE.BASE &&
				!widgets &&
				!customFieldWidgets
			) {
				return
			}
			setIsComponentVisible(true)
			onSelect({ id: -1 })
			const allOptions = []
			let options = getSearchOptions(widgets, items, false)
			allOptions.push(...options)
			if (customFieldWidgets) {
				let options = getSearchOptions(
					customFieldWidgets,
					customFieldItems,
					true
				)
				allOptions.push(...options)
			}
			setOptions(allOptions)
		},
		[
			model,
			modelType,
			setIsComponentVisible,
			onSelect,
			getSearchOptions,
			widgets,
			customFieldWidgets,
			items,
			customFieldItems,
		]
	)

	useKeyPress("s", save)

	useKeyPress("f", handleSearch)

	const handleOutsideClick = useCallback(
		(status) => {
			setIsComponentVisible(status)
			onSelect({ id: -1 })
		},
		[setIsComponentVisible, onSelect]
	)

	const handleChange = useCallback(
		(option) => {
			onSelect({
				id: option?.id,
				type: option?.isCustomField ? "customField" : null,
			})
			setIsComponentVisible(false)
		},
		[setIsComponentVisible, onSelect]
	)

	const handleHighlightChange = useCallback(
		(option) => {
			if (option) {
				const { tabsInfo, isCustomField } = option
				update((draft) => {
					draft.highlightedOption = option
					if (tabsInfo) {
						// NOTE: Although this supports nested tabs-panels, backend doesn't.
						// so tabsInfo array practically only contains 1 element
						tabsInfo.forEach(({ tabsPanelId, current }) => {
							changeCurrentTab(
								{ id: tabsPanelId, current, isCustomField, skipSelect: true },
								draft
							)
						})
					}
				})
			}
		},
		[update, changeCurrentTab]
	)

	const handleClose = useCallback(() => {
		update((draft) => {
			onSelect(
				{
					id: draft.highlightedOption?.id,
					type: draft.highlightedOption?.isCustomField ? "customField" : null,
				},
				draft
			)
		})
		handleOutsideClick(false)
	}, [update, onSelect])

	const handleHighlightChangeRef = React.useRef(handleHighlightChange)
	const timerRef = React.useRef(null)

	React.useEffect(() => {
		handleHighlightChangeRef.current = handleHighlightChange
	}, [highlightedOption, handleHighlightChange])

	const onHighlightChange = React.useCallback((event, option) => {
		clearTimeout(timerRef.current)
		timerRef.current = setTimeout(
			() => {
				option && handleHighlightChangeRef.current(option)
			},
			event ? 100 : 200
		)
	}, [])

	React.useEffect(() => {
		return () => {
			clearTimeout(timerRef.current)
		}
	}, [])

	React.useEffect(() => {
		const handleMouseOver = (event) => {
			const hoveredElement = event.target
			if (
				hoveredElement.tagName === "DIV" &&
				hoveredElement.getAttribute("role") === "option"
			) {
				const hoveredName =
					hoveredElement.innerText.match(/\(([^)]+)\)/)?.[1]?.trim() || ""
				const hoveredOption = options.find((op) => op.name === hoveredName)
				if (hoveredOption) handleHighlightChange(hoveredOption)
			}
		}

		if (isComponentVisible) {
			document.addEventListener("mouseover", handleMouseOver)
			return () => {
				document.removeEventListener("mouseover", handleMouseOver)
			}
		}
	}, [isComponentVisible])

	const showConfirmation = React.useCallback(
		(onOK) => {
			const dialog = {
				message: translate(
					"Current changes will be lost. Do you really want to proceed?"
				),
				title: translate("Question"),
				onOK,
				type: "confirm",
			}
			update((draft) => {
				draft.loader = false
				draft.dialog = dialog
			})
		},
		[update]
	)

	const isCustomDirty =
		past.some((e) => e.id === HISTORY.CUSTOM) ||
		future.some((e) => e.id === HISTORY.CUSTOM)
	const isWidgetDirty =
		past.some((e) => e.id === HISTORY.WIDGET) ||
		future.some((e) => e.id === HISTORY.WIDGET)

	/**
	 * Provides ability to display a confirmation alert before executing the provided function.
	 *
	 * @param {function} fn - Any function that needs to show an alert.
	 * @param {string} [type] - Optional. The type of history to be considered as dirty.
	 *     Possible values are HISTORY.CUSTOM or HISTORY.WIDGET.
	 *     If not provided, all history is considered to be dirty.
	 * @returns {function} - The function with alert.
	 * @example
	 * const wrappedFunction = React.useMemo(()=>runIfConfirmed(myFunction, HISTORY.CUSTOM),[myFunction]);
	 *
	 *  Now, wrappedFunction will display an alert and execute myFunction only if the custom history is not dirty.
	 *
	 */
	const runIfConfirmed = React.useCallback(
		(fn, type) =>
			(...args) => {
				const isDirty =
					type === HISTORY.WIDGET
						? isWidgetDirty
						: type === HISTORY.CUSTOM
						? isCustomDirty
						: isWidgetDirty || isCustomDirty
				if (isDirty) {
					showConfirmation(() => fn(...args))
				} else fn(...args)
			},
		[showConfirmation, isCustomDirty, isWidgetDirty]
	)

	const onNewWithConfirmation = React.useMemo(
		() => runIfConfirmed(onNew),
		[onNew, runIfConfirmed]
	)

	const handleRefreshWithConfirmation = React.useMemo(
		() => runIfConfirmed(props.refresh),
		[props.refresh, runIfConfirmed]
	)

	return (
		<ToolbarContainer border shadow="sm" className="toolbar-container">
			<SelectionContainer>
				{modelType !== MODEL_TYPE.BASE && (
					<ToolbarButton
						onClick={onNewWithConfirmation}
						disabled={isNewDisabled}
					>
						<MaterialIcon color="body" fontSize={20} icon="add" />
					</ToolbarButton>
				)}
				<ToolbarButton onClick={save} disabled={loader}>
					{" "}
					<MaterialIcon color="body" fontSize={20} icon="save" />
				</ToolbarButton>
				{modelType === MODEL_TYPE.CUSTOM && (
					<ToolbarButton onClick={removeView} disabled={isRemoveDisabled}>
						<MaterialIcon color="body" fontSize={20} icon="delete" />
					</ToolbarButton>
				)}
			</SelectionContainer>
			{!isStudioLite && (
				<ViewContainer gap={3}>
					<ViewSelection
						model={model}
						update={update}
						modelType={modelType}
						reset={reset}
						modelField={modelField}
						selectedView={selectedView}
						entityType={entityType}
						metaFieldStore={metaFieldStore}
						runIfConfirmed={runIfConfirmed}
						{...props}
					/>
				</ViewContainer>
			)}
			<ToolbarActions>
				{isComponentVisible ? (
					<ClickAwayListener onClickAway={() => handleOutsideClick(false)}>
						<Box>
							<Select
								options={options}
								autoHighlight={true}
								open={true}
								autoFocus={true}
								onChange={handleChange}
								onHighlightChange={onHighlightChange}
								getOptionLabel={getOptionLabel}
								isOptionEqualToValue={getOptionSelected}
							/>
						</Box>
					</ClickAwayListener>
				) : (
					<ToolbarButton
						onClick={handleSearch}
						disabled={
							loader ||
							(modelType === MODEL_TYPE.BASE && !model
								? true
								: modelType === MODEL_TYPE.BASE &&
								  !widgets &&
								  !customFieldWidgets
								? true
								: false)
						}
					>
						{" "}
						<MaterialIcon color="body" fontSize={20} icon="search" />
					</ToolbarButton>
				)}
				<ToolbarButton
					onClick={handleRefreshWithConfirmation}
					disabled={loader || (!customModel && !model)}
				>
					<MaterialIcon color="body" fontSize={20} icon="refresh" />
				</ToolbarButton>
				<ToolbarButton onClick={() => props.undo()} disabled={past.length <= 0}>
					<MaterialIcon color="body" fontSize={20} icon="undo" />
				</ToolbarButton>
				<ToolbarButton
					onClick={() => props.redo()}
					disabled={future.length <= 0}
				>
					<MaterialIcon color="body" fontSize={20} icon="redo" />
				</ToolbarButton>
			</ToolbarActions>
		</ToolbarContainer>
	)
}

export default React.memo(Toolbar)
