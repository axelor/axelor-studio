import React, { useCallback } from "react"
import _ from "lodash"

import {
	TYPE,
	IDS,
	PANEL_TYPE,
	MODEL_TYPE,
	ENTITY_TYPE,
	HISTORY,
} from "../constants"
import {
	reorderGrid,
	arrangeGrid,
	caseConverter,
	translate,
	isExtensionView,
	replacer,
	valueConverter,
	isCreatedFromStudio,
	isSidebarPanel,
	hasSidePanel,
	changeEditWidgetIfNeeded,
} from "../utils"
import { original, isDraft } from "immer"
import { useImmer } from "use-immer"
import { generateExtension } from "./computeXML"
import { generateXpath } from "./xpathGenerator"
import { validateOnRemove, validateWidget } from "./validation"
import { getPanel } from "../fields"

const StoreContext = React.createContext()

const getOriginal = (value) => (isDraft(value) ? original(value) : value)

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
	const [state, setState] = useImmer({
		future: [],
		past: [],
		title: "",
		items: [],
		widgets: null,
		editWidget: null,
		modelType: MODEL_TYPE.CUSTOM,
		customFields: [],
		customFieldItems: [],
		customFieldWidgets: null,
		modelField: null,
		loader: false,
		removedCustomFields: [],
		customErrorList: {},
		widgetErrorList: {},
		entityType: ENTITY_TYPE.META,
		actualType: null,
		extensionMoves: [],
		attrsList: [],
		isStudioLite: false,
		editWidgetType: null,
	})
	const { widgets, items } = state

	const hasOnlyOneNonSidebarItem = React.useMemo(() => {
		if (!widgets || !items.length) return false
		let index = 0
		let nonSidebarItemCount = 0

		while (index < items.length && nonSidebarItemCount <= 1) {
			if (!isSidebarPanel(widgets[items[index]])) {
				nonSidebarItemCount++
			}
			index++
		}
		return nonSidebarItemCount === 1
	}, [items, widgets])

	function getAllChildrenIds(id, widgetType) {
		const widgets =
			widgetType === "customField" ? state.customFieldWidgets : state.widgets
		const collectIds = (parent) => {
			const { items = [] } = widgets[parent]
			return items.reduce((all, item) => all.concat(collectIds(item)), [parent])
		}
		return collectIds(id)
	}

	function onExtension(moveIds, state) {
		if (state.exView && !isCreatedFromStudio(state.exView)) {
			generateExtension(moveIds, state)
		}
	}

	// update widget properties
	// pass draft if calling from inside another immer setState
	const onWidgetChange = React.useCallback(
		(
			{
				id,
				props,
				reset = false,
				skipGenerateHistory = false,
				changedPropertyName,
			},
			draft
		) => {
			const callbackfn = (draft) => {
				const isCustomField = draft.editWidgetType === "customField"
				!skipGenerateHistory &&
					generateHistory(
						draft,
						draft.modelType === MODEL_TYPE.BASE && isCustomField
					)
				const extendList = []
				const widgets =
					draft.editWidgetType === "customField"
						? draft.customFieldWidgets
						: draft.widgets
				if (reset) {
					widgets[id] = {}
				}
				const widget =
					draft.editWidgetType === "customField" && draft.customFieldWidgets
						? draft.customFieldWidgets[id]
						: draft.widgets && draft.widgets[id]
				if (widget) {
					Object.keys(props).forEach((key) => {
						let value = props[key]
						if (/^[a-z]/i.test(widget["name"])) {
							widget["name"] = caseConverter(
								widget["name"],
								!(props["type"] === TYPE.form)
							)
						}
						let doChange = true
						// add change in move
						const _value = widget[key] === undefined ? "" : widget[key]
						if (_value !== value) {
							const xPath = id === -1 ? "/" : widgets[id].xPath
							let _value = [undefined, null].includes(value) ? "" : value

							isExtensionView(draft) &&
								extendList.push({
									name: "attribute",
									target: xPath,
									attributes: {
										name: replacer(key, MODEL_TYPE.BASE),
										value: valueConverter(_value, key),
									},
									id,
								})
						}
						//TODO : colSpan value is not used anymore (i think) , try to remove it completely.
						if (key === "colSpan") {
							const parentId = Object.keys(widgets).find(
								(x) => (widgets[x].items || []).indexOf(id) > -1
							)
							value = Math.min(
								Number((widgets[parentId] && widgets[parentId].cols) || value),
								value
							)
							if (
								widgets &&
								parentId &&
								widgets[parentId].type === TYPE.panel
							) {
								value = widgets[parentId].widgetAttrs?.itemSpan || value
							}
							value = value || 6
						} else if (key === "cols" && value) {
							value = Math.min(12, Number(value))
						} else if (key === "widgetAttrs") {
							const items = widgets[id].items
							items &&
								items.forEach((item) => {
									const child = widgets[item]
									if (!child.widgetAttrs?.colSpan) {
										child.colSpan = value?.itemSpan
									}
								})
						}
						if (doChange) {
							widget[key] = value
							key === "layout" &&
								value === PANEL_TYPE.stack &&
								(widget.cols = 12)
						}
					})

					if (
						changedPropertyName === "sidebar" &&
						draft.modelType === MODEL_TYPE.CUSTOM &&
						!props.widgetAttrs?.sidebar &&
						draft.items.includes(id)
					) {
						const indexOfTabPanel = draft.items.findIndex(
							(itemId) => draft.widgets[itemId].type === TYPE.tabs
						)

						if (indexOfTabPanel !== -1) {
							const indexOfItem = draft.items.findIndex(
								(itemId) => itemId === id
							)
							if (indexOfItem > indexOfTabPanel) {
								draft.items[indexOfItem] = draft.items[indexOfTabPanel]
								draft.items[indexOfTabPanel] = id
							}
						}
					}
					validateWidget(draft, id, isCustomField)
				}
				if (
					draft.editWidgetType !== "customField" &&
					draft.modelType === MODEL_TYPE.BASE
				) {
					onExtension(extendList, draft)
					generateXpath(draft)
				}
			}

			if (draft) {
				callbackfn(draft)
			} else {
				setState(callbackfn)
			}
		},
		[setState]
	)

	// remove widget
	function onRemove(panelId, index, id, widgetType) {
		const isCustomField = widgetType === "customField"
		setState((draft) => {
			const canRemoveItem = () => {
				if (isSidebarPanel(draft.widgets[id])) return true
				const sidebarExists = hasSidePanel(draft.items, draft.widgets)
				return !sidebarExists || (sidebarExists && !hasOnlyOneNonSidebarItem)
			}

			if (
				draft.modelType === MODEL_TYPE.CUSTOM &&
				draft.items.includes(id) &&
				!canRemoveItem()
			) {
				const dialog = {
					message: translate("Main panel is required to have side panels"),
					type: "alert",
				}
				draft.loader = false
				draft.dialog = dialog
				return
			}

			generateHistory(
				draft,
				draft.modelType === MODEL_TYPE.BASE && isCustomField
			)

			const widgets =
				widgetType === "customField" ? draft.customFieldWidgets : draft.widgets
			const widgetItems =
				widgetType === "customField" ? "customFieldItems" : "items"

			const isPanel = panelId && IDS.form !== panelId
			index = (isPanel ? widgets[panelId].items : draft[widgetItems]).findIndex(
				(x) => `${x}` === `${id}`
			)
			if (index > -1 && widgets[id]) {
				let ids = getAllChildrenIds(id, widgetType)
				ids.forEach((id) => {
					if (isCustomField || state.modelType === MODEL_TYPE.CUSTOM) {
						const widget = widgets[id]
						if (widget.id && typeof widget.id !== "symbol") {
							draft.removedCustomFields.push({
								id: widget.id,
								version: widget.version,
							})
						}
					}
				})
				if (isPanel) {
					if (
						widgets[panelId].layout === PANEL_TYPE.grid &&
						![TYPE.menubar, TYPE.toolbar].includes(widgets[panelId].type) &&
						widgets[panelId].type !== TYPE.tabs
					) {
						const removedIds = arrangeGrid(
							draft,
							{ panelId, index, id },
							widgetType
						)
						ids = ids.concat(removedIds)
					} else {
						widgets[panelId].items.splice(index, 1)
					}
				} else {
					draft[widgetItems].splice(index, 1)
				}
				ids.forEach((id) => {
					const widget = widgets[id]
					if (widget) {
						if (
							widget.id &&
							typeof widget.id !== "symbol" &&
							!draft.removedCustomFields.find((field) => field.id === widget.id)
						) {
							draft.removedCustomFields.push({
								id: widget.id,
								version: widget.version,
							})
						}
						delete widgets[id]
					}
				})
				if (ids.indexOf(draft.editWidget) > -1) {
					draft.editWidget = null
				}
			}
			validateOnRemove(draft, id)
		})
	}

	// select widget, to open properties editor
	// pass draft if calling from inside another immer setState
	const onSelect = useCallback(
		({ id = null, type = null }, draft) => {
			const callbackfn = (draft) => {
				draft.editWidget = id
				draft.highlightedOption = null
				draft.editWidgetType = type
			}
			if (draft) {
				callbackfn(draft)
			} else {
				setState(callbackfn)
			}
		},
		[setState]
	)

	// pass draft if calling from inside another immer setState
	function addTabPanel({ id, skipGenerateHistory = false }, draft) {
		const panelId = _.uniqueId()
		const callbackfn = (draft) => {
			!skipGenerateHistory &&
				// In base model, tab can be only added in customfield
				generateHistory(draft, draft.modelType === MODEL_TYPE.BASE)
			const widgets =
				draft.modelType === MODEL_TYPE.BASE ? "customFieldWidgets" : "widgets"
			// if widget doesn't exist, do nothing
			if (!draft[widgets][id]) return
			// if widget isn't a tabs-panel, do nothing
			if (draft[widgets][id].type !== TYPE.tabs) return

			draft[widgets][id] = {
				...draft[widgets][id],
				items: [...(draft[widgets][id].items || []), panelId],
			}

			draft[widgets][panelId] = getPanel(draft.modelType, {
				...(widgets === "customFieldWidgets"
					? { model: draft.model.fullName }
					: {}),
				name: `panel${panelId}`,
				title: translate("Tab"),
				widgetAttrs: { tab: "true" },
			})
			delete draft[widgets][panelId].widgetAttrs.showTitle
			draft.editWidgetType =
				draft.modelType === MODEL_TYPE.BASE ? "customField" : null
		}
		if (draft) {
			callbackfn(draft)
		} else {
			setState(callbackfn)
		}
		changeCurrentTab(
			{
				id,
				current: panelId,
				isCustomField: state.modelType === MODEL_TYPE.BASE,
			},
			draft
		)
	}

	function onDrop(dragWidget, hoverWidget) {
		if (!hoverWidget || !dragWidget) return

		setState((draft) => {
			const { widgets, customFieldWidgets } = draft
			generateHistory(draft, draft.modelType === MODEL_TYPE.BASE)

			const index = draft.metaFields?.findIndex(
				(f) =>
					f.typeName === dragWidget.attrs.typeName &&
					f.name === dragWidget.attrs.name
			)
			if (index !== -1) {
				draft.metaFields && draft.metaFields.splice(index, 1)
			}

			const newId = reorderGrid(hoverWidget, dragWidget)(draft)

			/**
			 * While adding panel tabs add default tab panel
			 */
			const allWidgets =
				draft.modelType === MODEL_TYPE.BASE ? customFieldWidgets : widgets
			const tabId = Object.keys(allWidgets || {})?.find(
				(key) => allWidgets[key]?.type === TYPE.tabs
			)
			if (
				dragWidget?.attrs?.type === TYPE.tabs &&
				!dragWidget?.attrs?.items?.length
			) {
				addTabPanel(
					{
						id: tabId,
						skipGenerateHistory: true,
					},
					draft
				)
			} else if (
				allWidgets[hoverWidget.panelId]?.type === TYPE.tabs &&
				dragWidget?.attrs?.type === TYPE.panel
			) {
				//When panel is moved into tabs, set it as current tab
				changeCurrentTab(
					{
						id: tabId,
						current: newId || dragWidget.id,
						isCustomField: draft.modelType === MODEL_TYPE.BASE,
					},
					draft
				)
			} else if (newId) {
				onSelect({ id: newId, type: hoverWidget?._type }, draft)
			}
		})
	}

	const startLoader = React.useCallback(
		function startLoader() {
			setState((draft) => {
				draft.loader = true
			})
		},
		[setState]
	)

	function undo() {
		setState((draft) => {
			if (draft.past.length) {
				const past = draft.past[draft.past.length - 1]
				draft.future.unshift({
					...Object.keys(past).reduce((acc, key) => {
						return {
							...acc,
							[key]: key === "id" ? past[key] : getOriginal(draft[key]),
						}
					}, {}),
				})
				setPresent(past, draft)
				draft.past.splice(draft.past.length - 1, 1)
				changeEditWidgetIfNeeded(draft) // https://redmine.axelor.com/issues/63205#note-6
			}
		})
	}

	function redo() {
		setState((draft) => {
			if (draft.future.length) {
				const future = draft.future[0]
				draft.past.push({
					...Object.keys(future).reduce((acc, key) => {
						return {
							...acc,
							[key]: key === "id" ? future[key] : getOriginal(draft[key]),
						}
					}, {}),
				})
				setPresent(future, draft)
				draft.future.splice(0, 1)
				changeEditWidgetIfNeeded(draft) // https://redmine.axelor.com/issues/63205#note-6
			}
		})
	}

	function setPresent(object, draft) {
		Object.keys(object).forEach((key) => {
			if (key !== "id") {
				draft[key] = getOriginal(object[key])
			}
		})
	}

	function generateHistory(draft, isCustom) {
		!isCustom &&
			draft.past.push({
				id: HISTORY.WIDGET,
				widgets: getOriginal(draft.widgets),
				items: getOriginal(draft.items),
				extensionMoves: getOriginal(draft.extensionMoves),
				metaFields: getOriginal(draft.metaFields),
				widgetErrorList: getOriginal(draft.widgetErrorList),
				selectedView: getOriginal(draft.selectedView),
			})
		if (isCustom) {
			draft.past.push({
				id: HISTORY.CUSTOM,
				customFieldWidgets: getOriginal(draft.customFieldWidgets),
				customFields: getOriginal(draft.customFields),
				customFieldItems: getOriginal(draft.customFieldItems),
				removedCustomFields: getOriginal(draft.removedCustomFields),
				modelField: getOriginal(draft.modelField),
				customErrorList: getOriginal(draft.customErrorList),
			})
		}

		if (draft.future.length) {
			draft.future = draft.future.filter(
				(f) => f.id === (isCustom ? HISTORY.WIDGET : HISTORY.CUSTOM)
			)
		}
	}

	function clearHistory(draft, historyToClear) {
		if (historyToClear === HISTORY.CUSTOM) {
			draft.past = draft.past.filter((element) => element.id !== HISTORY.CUSTOM)
			draft.future = draft.future.filter(
				(element) => element.id !== HISTORY.CUSTOM
			)
		} else if (historyToClear === HISTORY.WIDGET) {
			draft.past = draft.past.filter((element) => element.id === HISTORY.CUSTOM)
			draft.future = draft.future.filter(
				(element) => element.id === HISTORY.CUSTOM
			)
		} else {
			draft.future = []
			draft.past = []
		}
	}

	const changeCurrentTab = useCallback(
		({ id, current, isCustomField, skipSelect }, draft) => {
			const callbackfn = (draft) => {
				const _widgets = isCustomField
					? draft.customFieldWidgets
					: draft.widgets
				if (_widgets?.[id]?.type !== TYPE.tabs) return
				// setting active-tab
				_widgets[id].current = current

				const type = isCustomField ? "customField" : null
				!skipSelect && onSelect({ id: current, type }, draft)
			}
			if (draft) {
				callbackfn(draft)
			} else {
				setState(callbackfn)
			}
		},
		[setState, onSelect]
	)

	const [clearTabChangeTimer, debouncedChangeTab] = React.useMemo(() => {
		const DELAY = 200
		let timer
		let prevArgs = []
		const clearTimer = () => (timer = timer && clearTimeout(timer))

		const debouncedChangeTab = (...args) => {
			const isSameArgs =
				args.length === prevArgs.length &&
				args.every((arg, index) => prevArgs[index] === arg)

			if (timer && isSameArgs) return

			prevArgs = args
			timer && clearTimeout(timer)
			timer = setTimeout(() => {
				timer = undefined
				const [id, current, isCustomField] = args
				changeCurrentTab({ id, current, isCustomField })
			}, DELAY)
		}

		return [clearTimer, debouncedChangeTab]
	}, [changeCurrentTab])

	const value = {
		onWidgetChange,
		debouncedChangeTab,
		clearTabChangeTimer,
		onDrop,
		onRemove,
		onSelect,
		state: { ...state, hasOnlyOneNonSidebarItem },
		update: setState,
		startLoader,
		undo,
		redo,
		clearHistory,
		addTabPanel,
		changeCurrentTab,
	}
	return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
	return React.useContext(StoreContext)
}

export function useStoreState() {
	const { state } = React.useContext(StoreContext)
	return state
}

export default StoreProvider
