import properties from "./../Properties/list";
import { MODEL_TYPE, TYPE } from "./../constants";
import { translate } from "../utils";

export function validate(field, modelType, isCustomField = false) {
	const errors = {};
	let selectedType =
		field.serverType === "field" ? field.type : field.serverType || field.type;
	selectedType = selectedType && selectedType.toLowerCase().replace(/_/g, "-");
	let property = properties.find((option) => option.type === selectedType);
	if (selectedType === "form") {
		if (modelType === MODEL_TYPE.CUSTOM) {
			property = properties.find((option) => option.type === "modelForm");
		}
	}
	if (
		!isCustomField &&
		modelType === MODEL_TYPE.BASE &&
		[
			TYPE.panel,
			TYPE.panelStack,
			TYPE.tabs,
			TYPE.menu,
			TYPE.menubar,
			TYPE.toolbar,
		].includes(selectedType)
	) {
		if (field.items && field.items.length === 0) {
			const message =
				selectedType === TYPE.menu
					? translate("Atleast one menu item required")
					: translate("Atleast one children required");
			errors["items"] = message;
		}
	}
	if (!property) {
		return errors;
	}

	const widgetAttrs = JSON.parse(field["widgetAttrs"] || "{}");
	const propertyList = Object.keys(property.value).reduce((lst = [], key) => {
		return [...lst, ...property.value[key]];
	}, []);
	propertyList.forEach((property) => {
		// For real form , do not validate if a property is ReadOnly
		if (modelType === MODEL_TYPE.BASE && !isCustomField && property.readOnly)
			return;

		// For real form , Do not validate fields displayed only in CUSTOM MDOEL & customFields
		if (
			property.dependModelType &&
			property.dependModelType !== MODEL_TYPE.BASE &&
			modelType === MODEL_TYPE.BASE
		)
			return;
		// For real form, Do not validate fields displayed only in customFields
		if (
			property.dependModelType &&
			property.dependModelType === MODEL_TYPE.BASE &&
			property.showInBaseView === false &&
			modelType === MODEL_TYPE.BASE &&
			!isCustomField
		)
			return;

		const addErrorMessage = () => {
			errors[property.name] = `${translate(
				property.title || property.name
			)} ${translate("required")}`;
		};
		if (
			(property.requiredFor &&
				property.requiredFor.includes(selectedType) &&
				!field[property.name]) ||
			(property.required && !field[property.name])
		) {
			addErrorMessage();
		}
		let value = false;
		property?.requiredWhen &&
			property.requiredWhen.every((prop) => {
				value =
					prop?.parentField === "widgetAttrs"
						? prop.type === "boolean"
							? JSON.parse(widgetAttrs[prop.name] || "false")
							: widgetAttrs[prop.name]
						: field[prop.name];
				if (value) return false;
				return true;
			});
		if (property.requiredWhen && value && !field[property.name]) {
			if (field.isSelectionField) {
				return addErrorMessage();
			} else if (["menuBuilderTitle", "title"].includes(property.name)) {
				return addErrorMessage();
			} else if (
				["selectionText"].includes(property.name) &&
				field.updateSelection
			) {
				return addErrorMessage();
			}
		}
		if (property.regex) {
			const re = new RegExp(property.regex);
			if (!re.test(field[property.name]) && !errors[property.name]) {
				errors[property.name] = translate(property.regexErrorMessage);
			}
		}
	});
	return errors;
}

export function validateParentPanelItems(state, panelId) {
	const panel = state.widgets[panelId];
	const errors = state.errorList[panelId] || {};
	if (panel) {
		if (panel.items && panel.items.length > 0) {
			if (errors.items) {
				delete errors.items;
			}
		} else {
			errors.items = translate("Atleast one children required");
		}
		if (Object.keys(errors).length) {
			state.errorList[panelId] = errors;
		} else {
			delete state.errorList[panelId];
		}
	}
}

export function validateOnRemove(state, id) {
	const errors = state.errorList[id];
	if (errors) {
		delete state.errorList[id];
	}
}
