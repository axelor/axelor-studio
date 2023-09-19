import { getWidgetAttrs } from "./../utils"
import { MODEL_TYPE, TYPE } from "./../constants"

const exemptedAttrs = [
	"items",
	"cols",
	"serverType",
	"version",
	"type",
	"widgetAttrs",
	"current",
	"selectionList",
	"autoTitle",
	"isModelField",
	"elements",
	"relationship",
	"isDummy",
	"metaModel",
	"targetSearch",
	"layout",
	"massUpdate",
	"xPath",
	"tz",
]

function getWidgetAttrsObject(widget, modelType = MODEL_TYPE.BASE) {
	return getWidgetObject(widget, [], null, modelType)
}

export function getExtendJson2({
	target,
	type,
	position,
	source,
	name,
	value,
	widgetAttrs,
	itemSource,
	...rest
}) {
	const attributes = { target }
	let elements = []
	if (widgetAttrs && !["replace", "attribute", "move"].includes(type)) {
		if (Array.isArray(widgetAttrs)) {
			elements = widgetAttrs
				.map((widget) => {
					return getWidgetAttrsObject(widget)
				})
				.filter((e) => e)
		} else {
			elements.push(getWidgetAttrsObject(widgetAttrs))
		}
	}
	if (elements.length || ["replace", "attribute", "move"].includes(type)) {
		const object = {
			attributes,
			type: "element",
			name: "extend",
			elements: [
				{
					type: "element",
					name: type,
					attributes: {
						position,
						source,
						name,
						value,
					},
					elements,
				},
			],
		}
		return JSON.parse(JSON.stringify(object))
	}
	return
}

export function getWidgetObject(widget, other = [], view, modelType) {
	const { id, image, elements = [], ...attributes } = widget
	const uiFields = [
		"panel",
		"panel-related",
		"panel-dashlet",
		"panel-tabs",
		"panel-stack",
		"panel-include",
		"button",
		"label",
		"spacer",
		"separator",
		"menu",
		"item",
		"toolbar",
		"menubar",
		"divider",
	]
	let exempt = [...exemptedAttrs]
	let field = uiFields.includes(attributes.type) ? attributes.type : "field"
	field = uiFields.includes(attributes.serverType)
		? attributes.serverType
		: field
	field = widget.tab ? "panel-tabs" : field
	if (attributes.type === TYPE.panelInclude) {
		exempt = [...exempt, "title", "colSpan"]
	}
	if (field === TYPE.tabs) {
		exempt = [...exempt, "tab", "title"]
	}
	if (field === "spacer") {
		exempt = [...exempt, "title", "isDummy"]
	}
	if (field === TYPE.panelInclude) {
		exempt = [...exempt, "module", "name"]
	}
	if ([TYPE.menu, TYPE.menuItem, TYPE.toolbar, TYPE.menubar].includes(field)) {
		exempt = [...exempt, "colSpan"]
	}
	if ([TYPE.toolbar, TYPE.menubar].includes(field)) {
		exempt = [...exempt, "colSpan", "name", "title"]
	}
	if ([TYPE.divider].includes(field)) {
		exempt = [...exempt, "colSpan", "title"]
	}
	let object = {}
	object = {
		attributes: {
			...getWidgetAttrs(attributes, exempt, modelType),
		},
		type: "element",
		name: field,
		elements: [...other, ...elements],
	}
	return object
}

export function generateView(widgets, items, modelType) {
	let view = {}
	let elements = []
	if (items.length) {
		items.forEach((item) => {
			const widget = widgets[item]
			let subViews = []
			if (widget) {
				if (widget.items && widget.items.length) {
					subViews = generateView(widgets, widget.items, modelType)
				}
				elements.push({
					...getWidgetObject(widget, subViews, view, modelType),
				})
			}
		})
	}
	return elements
}
