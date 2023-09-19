import { getExtendJson2, getWidgetObject } from "./extensionGenerator"
import { MODEL_TYPE } from "./../constants"
import { isDefaultValue } from "./../utils"

function setAttributeOnNewWidget(items, widget, widgetId, state) {
	const widgets = state.widgets
	let inserted = false
	const getWidgetName = () => widgets[widgetId] && widgets[widgetId].name
	for (let i = 0; i < items.length; i++) {
		const item = items[i]
		if (item.name === getWidgetName()) {
			item[widget.attributes.name] = widget.attributes.value
			inserted = true
		}
		if (inserted) {
			break
		}
		if (item.items && item.items.length) {
			const _inserted = setAttributeOnNewWidget(
				item.items,
				widget,
				widgetId,
				state
			)
			if (_inserted) {
				inserted = _inserted
				break
			}
		}
	}
	return inserted
}

export function generateExtension(list, state) {
	const cleatVirtualAction = () => {
		const exemptedAttributes = [
			"widgetAttrs",
			"items",
			"current",
			"elements",
			"tz",
			"targetModel",
			"_type",
		]
		;[...list].forEach((item, i) => {
			if (item.name === "insert") {
				const id = item.id
				const removeIndex = list.findIndex(
					(item) => item.name === "replace" && item.id === id && !item.target
				)
				const insertIndex = list.findIndex(
					(item) => item.id === id && item.name === "insert"
				)
				if (removeIndex !== -1) {
					list.splice(removeIndex, 1)
					list.splice(insertIndex, 1)
				}
			}
			if (item.name === "attribute") {
				const id = item.id
				// set blank values for default value
				if (
					item.attributes &&
					isDefaultValue(item.attributes.name, item.attributes.value)
				) {
					const attrIndex = list.findIndex(
						(e) =>
							e.id === id &&
							e.name === "attribute" &&
							e.attributes.name === item.attributes.name
					)
					list.splice(attrIndex, 1, {
						...list[attrIndex],
						attributes: {
							...list[attrIndex].attributes,
							value: item.attributes.value,
						},
					})
				}
				if (
					item.attributes &&
					exemptedAttributes.includes(item.attributes.name)
				) {
					const attrIndex = list.findIndex(
						(item) =>
							item.id === id &&
							item.name === "attribute" &&
							exemptedAttributes.includes(item.attributes.name)
					)
					list.splice(attrIndex, 1)
				} else {
					let processed = false
					const getWidgetName = () =>
						state.widgets[id] && state.widgets[id].name
					for (let k = 0; k < state.extensionMoves.length; k++) {
						const move = state.extensionMoves[k]
						if (move.name === "insert") {
							const { elements } = move
							for (let j = 0; j < elements.length; j++) {
								const element = elements[j]
								if (element.name === getWidgetName()) {
									state.extensionMoves[k].elements[j][item.attributes.name] =
										item.attributes.value
									processed = true
									break
								}
								if (element.items && element.items.length) {
									let inserted = setAttributeOnNewWidget(
										element.items,
										item,
										id,
										state
									)
									if (inserted) {
										processed = true
									}
								}
							}
						}
						if (processed) {
							const attrIndex = list.findIndex(
								(item) => item.id === id && item.name === "attribute"
							)
							list.splice(attrIndex, 1)
							break
						}
					}
				}
			}
		})
	}
	cleatVirtualAction()
	state.extensionMoves.push(...list)
}

const generateNestedView = (items) => {
	const _items = items.map((item) => {
		let _subItems = []
		if (item.items) {
			_subItems = generateNestedView(item.items)
		}
		return getWidgetObject(
			{ ...item, elements: _subItems },
			[],
			null,
			MODEL_TYPE.BASE
		)
	})

	return _items
}

export function getXML(extensionMoves, state) {
	const patches = extensionMoves
		.map((move) => {
			let fields
			if (move.name === "insert") {
				fields = move.elements
					.map((field) => {
						if (field && field.items && field.items.length) {
							const f = { ...field }
							f.elements = generateNestedView(field.items)
							return f
						}
						return field
					})
					.filter((e) => e)
			}
			if (!move.target) {
				return undefined
			}
			return getExtendJson2({
				target: move.target,
				position: move.position,
				source: move.source,
				type: move.name,
				widgetAttrs: fields,
				...move.attributes,
			})
		})
		.filter((e) => e)
	return patches
}
