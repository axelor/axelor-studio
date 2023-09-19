import React, { useCallback, useState } from "react"
import { IconButton } from "@mui/material"
import { styled } from "@mui/material/styles"
import classnames from "classnames"
import ViewSelection from "./ViewSelection"
import { HISTORY, MODEL_TYPE, TYPE } from "../constants"
import { useKeyPress } from "../custom-hooks/useKeyPress"
import { useComponentVisible } from "../custom-hooks/useComponentVisible"
import { getWidgetElementId, translate } from "../utils"

import Select from "./Select"
import { useStore } from "../store/context"

const ToolbarContainer = styled("div")(() => ({
	display: "flex",
	flexWrap: "wrap",
	justifyContent: "space-between",
	width: "100%",
	height: "inherit",
	backgroundColor: "rgb(41, 56, 70)",
	padding: "0.5rem 0.75rem",
	[`&.modern-dark`]: {
		backgroundColor: "#323232",
	},
}))
const SelectionContainer = styled("div")(() => ({
	display: "flex",
	alignItems: "center",
	flexWrap: "wrap",
}))
const ViewContainer = styled("div")(() => ({
	display: "flex",
	flex: 1,
	alignItems: "center",
	flexWrap: "wrap",
}))
const ToolbarActions = styled("div")(() => ({
	justifyContent: "space-between",
	display: "flex",
	alignItems: "center",
}))
const CrudIcon = styled("i")(() => ({
	height: "1em !important",
	width: "1em !important",
	cursor: "pointer",
	fontSize: "0.5em !important",
}))

function isStudioView(view) {
	if (view && view.xmlId && view.xmlId.indexOf("studio-") === 0) {
		return true
	}
	return false
}

function ToolbarButton(props) {
	return (
		<IconButton
			sx={{
				color: "#fff",
				padding: "5px 10px",
				"&[disabled] > i": {
					color: "#555",
				},
			}}
			{...props}
			size="large"
		/>
	)
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
		<ToolbarContainer>
			<SelectionContainer
				sx={{
					display: "flex",
					alignItems: "center",
					flexWrap: "wrap",
				}}
			>
				{modelType !== MODEL_TYPE.BASE && (
					<ToolbarButton
						onClick={onNewWithConfirmation}
						disabled={isNewDisabled}
					>
						<CrudIcon className={classnames("fa fa-plus")}></CrudIcon>
					</ToolbarButton>
				)}
				<ToolbarButton onClick={save} disabled={loader}>
					{" "}
					<CrudIcon className={classnames("fa fa-floppy-o")}></CrudIcon>
				</ToolbarButton>
				{modelType === MODEL_TYPE.CUSTOM && (
					<ToolbarButton onClick={removeView} disabled={isRemoveDisabled}>
						<CrudIcon className={classnames("fa fa-trash-o")}></CrudIcon>
					</ToolbarButton>
				)}
			</SelectionContainer>
			{!isStudioLite && (
				<ViewContainer>
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
					<Select
						options={options}
						autoHighlight={true}
						open={true}
						autoFocus={true}
						onChange={handleChange}
						onClose={handleClose}
						onHighlightChange={onHighlightChange}
						handleOutsideClick={handleOutsideClick}
						getOptionLabel={getOptionLabel}
						isOptionEqualToValue={getOptionSelected}
					/>
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
						<CrudIcon className={classnames("fa fa-search")}></CrudIcon>
					</ToolbarButton>
				)}
				<ToolbarButton
					onClick={handleRefreshWithConfirmation}
					disabled={loader || (!customModel && !model)}
				>
					<CrudIcon className={classnames("fa fa-refresh")}></CrudIcon>
				</ToolbarButton>
				<ToolbarButton onClick={() => props.undo()} disabled={past.length <= 0}>
					<CrudIcon className={classnames("fa fa-reply")}></CrudIcon>
				</ToolbarButton>
				<ToolbarButton
					onClick={() => props.redo()}
					disabled={future.length <= 0}
				>
					<CrudIcon className={classnames("fa fa-share")}></CrudIcon>
				</ToolbarButton>
			</ToolbarActions>
		</ToolbarContainer>
	)
}

export default React.memo(Toolbar)
