import { getWidgetType } from "./../utils"
import { TYPE } from "./../constants"

const getItemType = (type) => {
	const types = ["viewer", "editor", "hilite"]
	return types.includes(type) ? "field" : type
}

export function eGeneratePath(widgets, items = [], itemId, path = "") {
	if (itemId === -1) {
		return ""
	}
	const isFirstLevel = path === ""
	const hasSameNameInParentItems = (items, itemId) => {
		const widget = widgets[itemId]
		const sameWidgets = items.filter(
			(item) =>
				item !== itemId &&
				widgets[item] &&
				[widgets[item].name, widgets[item].originalName].includes(widget.name)
		)
		return sameWidgets.length > 0
	}

	const getSameItemIndex = (items, itemId) => {
		const widget = widgets[itemId]
		const sameWidgets = items.filter(
			(item) =>
				widgets[item] &&
				[widgets[item].name, widgets[item].originalName].includes(widget.name)
		)
		return sameWidgets.indexOf(itemId) + 1
	}

	const getTypeWiseItemIndex = (items, type, itemId) => {
		const sameWidgets = items.filter(
			(item) =>
				widgets[item] &&
				getItemType(getWidgetType(widgets[item], "field")) === type
		)
		return sameWidgets.indexOf(itemId) + 1
	}

	const isUniquePanel = () => {
		const widget = widgets[itemId]
		if (!widget.name) {
			return false
		}
		const widgetList = Object.values(widgets)
		const sameWidgets = widgetList.filter((w) => w.name === widget.name)
		return sameWidgets.length === 1
	}

	const canStopParentLink = () => {
		if (isFirstLevel) {
			return false
		}
		if (!isUniquePanel()) {
			return false
		}
		return true
	}

	let findRoot = true
	const widgetList = Object.values(widgets)
	const widgetIds = Object.keys(widgets)
	widgetList.forEach((widget, i) => {
		if (widget.items) {
			const index = widget.items.findIndex((e) => e === itemId)
			if (index !== -1) {
				findRoot = false
				const _widget = widgets[itemId]
				const widgetType = getItemType(getWidgetType(_widget, "field"))
				if (_widget.name) {
					let itemPath = `/${widgetType}[@name='${_widget.name}']`
					if (hasSameNameInParentItems(widget.items, itemId)) {
						const itemIndex = getSameItemIndex(widget.items, itemId)
						if (itemIndex > 0) {
							itemPath = `${itemPath}[${itemIndex}]`
						}
					}
					path = `${itemPath}${path}`
				} else {
					const itemIndex = getTypeWiseItemIndex(
						widget.items,
						widgetType,
						itemId
					)
					path = `/${widgetType}[${itemIndex}]${path}`
				}
				if (!canStopParentLink()) {
					path = eGeneratePath(widgets, items, widgetIds[i], path)
				} else {
					path = `/${path}`
				}
			}
		}
	})
	if (findRoot) {
		const index = items.findIndex((e) => e === itemId)
		if (index !== -1) {
			const _widget = widgets[itemId]
			if (_widget.name) {
				let itemPath = `//${_widget.type}[@name='${_widget.name}']`
				if ([TYPE.menubar, TYPE.toolbar, TYPE.divider].includes(_widget.type)) {
					itemPath = `//${_widget.type}`
				}
				if (hasSameNameInParentItems(items, itemId)) {
					const itemIndex = getSameItemIndex(items, itemId)
					if (itemIndex > 0) {
						itemPath = `${itemPath}[${itemIndex}]`
					}
				}
				path = `${itemPath}${path}`
			} else {
				const itemIndex = getTypeWiseItemIndex(items, _widget.type, itemId)
				path = `//${_widget.type}[${itemIndex}]${path}`
			}
		}
	}
	return path
}

// generate xpath for all widgets
export function generateXpath(draft) {
	Object.keys(draft.widgets || {}).forEach((widgetId) => {
		const path = eGeneratePath(draft.widgets, draft.items, widgetId)
		draft.widgets[widgetId].xPath = path
	})
}
