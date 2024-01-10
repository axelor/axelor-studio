import properties from "./../Properties/list"
import { MODEL_TYPE, TYPE } from "./../constants"
import { translate } from "../utils"

export function validate(field, modelType, isCustomField = false) {
	const errors = {}
	let selectedType =
		field.serverType === "field" ? field.type : field.serverType || field.type
	selectedType = selectedType && selectedType.toLowerCase().replace(/_/g, "-")
	let property = properties.find((option) => option.type === selectedType)
	if (selectedType === "form") {
		if (modelType === MODEL_TYPE.CUSTOM) {
			property = properties.find((option) => option.type === "modelForm")
		}
	}

	if (!property) {
		return errors
	}

	const propertyList = property.value.reduce((lst = [], obj) => {
		return lst.concat(obj.fields)
	}, [])

	propertyList.forEach((property) => {
		// For real form , do not validate if a property is ReadOnly
		if (modelType === MODEL_TYPE.BASE && !isCustomField && property.readOnly)
			return

		// For real form , Do not validate fields displayed only in CUSTOM MODEL & customFields
		if (
			property.dependModelType &&
			property.dependModelType !== MODEL_TYPE.BASE &&
			modelType === MODEL_TYPE.BASE &&
			!isCustomField
		)
			return
		// For real form, Do not validate fields displayed only in customFields
		if (
			property.dependModelType &&
			property.dependModelType === MODEL_TYPE.BASE &&
			property.showInBaseView === false &&
			modelType === MODEL_TYPE.BASE &&
			!isCustomField
		)
			return

		const addErrorMessage = (message) => {
			errors[property.name] = message
				? translate(message)
				: `${translate(property.title || property.name)} ${translate(
						"required"
				  )}`
		}
		if (
			(property.requiredFor &&
				property.requiredFor.includes(selectedType) &&
				!field[property.name]) ||
			(property.required && !field[property.name])
		) {
			addErrorMessage()
		}
		let value = false
		property?.requiredWhen &&
			property.requiredWhen.every((prop) => {
				value =
					prop?.parentField === "widgetAttrs"
						? prop.type === "boolean"
							? JSON.parse(field.widgetAttrs?.[prop.name] || "false")
							: field.widgetAttrs?.[prop.name]
						: field[prop.name]
				if (value) return false
				return true
			})
		if (property.requiredWhen && value && !field[property.name]) {
			if (property.name === "selection") {
				// Error is generated only when both selection and selectionText are missing
				if (!field["selectionText"])
					addErrorMessage("Selection or selection options are required")
			} else {
				addErrorMessage()
			}
		}
		if (property.regex) {
			const re = new RegExp(property.regex)
			if (!re.test(field[property.name]) && !errors[property.name]) {
				errors[property.name] = translate(property.regexErrorMessage)
			}
		}
	})
	return errors
}

export function validateOnRemove(state, id) {
	const widgetErrors = state.widgetErrorList[id]
	const customErrors = state.customErrorList[id]

	if (widgetErrors) {
		delete state.widgetErrorList[id]
	}
	if (customErrors) {
		delete state.customErrorList[id]
	}
}

export const validateWidget = (draft, id, isCustomField) => {
	const widgets = isCustomField ? draft.customFieldWidgets : draft.widgets
	const errorKey = isCustomField ? "customErrorList" : "widgetErrorList"
	const widget = widgets[id]

	if (widget) {
		// Do not validate tabs-panel since it doesn't get saved in server
		if (widget.type === TYPE.tabs) return
		const errors = validate(widgets[id], draft.modelType, isCustomField)

		if (Object.keys(errors).length) {
			draft[errorKey][id] = errors
		} else if (draft[errorKey][id]) {
			delete draft[errorKey][id]
		}
	}
}

export const validateWidgets = (draft, widgets, isCustomField) => {
	Object.keys(widgets).forEach((id) => {
		![-2, 0].includes(+id) && validateWidget(draft, id, isCustomField)
	})
}
