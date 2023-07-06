import { conditionProperties } from "../constants";
import AxelorService from "./../services/axelor.rest";
import Utils, { generateCustomModelSchema, getMenuBuilder } from "./../utils";

export const metaJsonFieldService = new AxelorService({
	model: "com.axelor.meta.db.MetaJsonField",
});
export const metaModelService = new AxelorService({
	model: "com.axelor.meta.db.MetaJsonModel",
});
const appStudioService = new AxelorService({
	model: "com.axelor.studio.db.AppStudio",
});
const appUserService = new AxelorService({ model: "com.axelor.auth.db.User" });

const metaViewService = new AxelorService({
	model: "com.axelor.meta.db.MetaView",
});
export const modelService = new AxelorService({
	model: "com.axelor.meta.db.MetaModel",
});

export const metaAttrsService = new AxelorService({
	model: "com.axelor.meta.db.MetaAttrs",
});

export const metaSelectService = new AxelorService({
	model: "com.axelor.meta.db.MetaSelect",
});

export const selectionBuilderService = new AxelorService({
	model: "com.axelor.studio.db.StudioSelection",
});

export const metaTranslationService = new AxelorService({
	model: "com.axelor.meta.db.MetaTranslation",
});

export async function getCustomModel(options) {
	const result = await metaModelService.search(options);
	const { data = [] } = result;
	return data[0];
}

export function fetchCustomFields(modelField, model) {
	const _domain = `self.jsonModel = null and self.modelField='${modelField.name}' and self.model='${model.fullName}'`;
	return metaJsonFieldService.search({
		data: { _domain },
		sortBy: ["sequence"],
	});
}

/**
 * selection fields are needs to be save seperately to save selections
 */
export async function saveCustomModel(model) {
	if (!model) return;
	const res = await metaModelService.save(model);
	const { data, status } = res || {};
	if (status === -1) {
		return res;
	}
	const { fields } = (data && data[0]) || {};
	const getFields = (all) => {
		const fields = all
			.map((res) => {
				const { data = [] } = res;
				if (data[0]) {
					return { id: data[0].id, $version: data[0].version };
				}
				return undefined;
			})
			.filter((e) => e);
		return fields;
	};
	const response = await Promise.all(
		model.fields.map((field) => {
			const updatedField = fields && fields.find((f) => f.name === field.name);
			return metaJsonFieldService.save({
				...field,
				id: updatedField?.id,
				version: updatedField?.version,
			});
		})
	);
	const updatedFields = getFields(response);
	return {
		data: [
			{
				...((data && data[0]) || {}),
				fields: updatedFields,
			},
		],
	};
}

export function fetchJSONFields(ids, update, record = {}, currentTabIndex) {
	const criteria = [];
	if (ids.length) {
		criteria.push({ fieldName: "id", operator: "in", value: ids });

		const data = {
			criteria,
		};
		metaJsonFieldService.search({ data, sortBy: ["sequence"] }).then((res) => {
			if (res.data) {
				const list = res.data || [];
				const schema = generateCustomModelSchema(
					list,
					record,
					"",
					"form",
					currentTabIndex
				);
				update((draft) => {
					draft.items = list.filter((l) => l.type === "panel").map((e) => e.id);
					draft.widgets = {
						...schema.widgets,
					};
					draft.items = schema.items;
				});
			}
		});
	} else {
		update((draft) => {
			draft.widgets = {
				"-1": {
					type: "form",
					...record,
					...getMenuBuilder(record ? record.studioMenu : undefined),
				},
				0: { type: "dump_field", name: "" },
			};
			draft.items = [];
			draft.loader = false;
		});
	}
}

export function removeCustomModel(model) {
	return metaModelService.removeAll([model]);
}

export async function getEnableAppBuilder() {
	const payload = {
		data: {
			_domain: "self.app.code = :code",
			_domainContext: { code: "studio" },
		},
		fields: ["enableStudioApp"],
		limit: 1,
		offset: 0,
	};
	const studioResult = await appStudioService.search({ ...payload });
	if (
		Array.isArray(studioResult && studioResult.data) &&
		studioResult.data[0]
	) {
		return studioResult.data[0].enableStudioApp;
	}
	return false;
}

export async function generateMenuChange(customModel) {
	const _context = {
		_model: "com.axelor.meta.db.MetaJsonModel",
		_id: null,
		...customModel,
	};
	const changeAction =
		"action-studio-json-model-method-isgeneratemenu-onchange";
	const data = {
		action: changeAction,
		model: "com.axelor.meta.db.MetaJsonModel",
		data: {
			context: _context,
		},
	};
	return await metaModelService.action(data);
}

export async function fetchCustomModel(modelId, handleError = () => {}) {
	const result = await metaModelService.fetch(modelId, {
		related: {
			studioMenu: ["title", "parentMenu"],
		},
	});
	if (result?.status === -1) {
		handleError(result.data || {});
		return;
	}
	const { data = [] } = result || {};
	return data[0];
}

export async function fetchViews(view) {
	const viewCriteria = {
		operator: "and",
		criteria: [{ fieldName: "name", operator: "=", value: `${view.name}` }],
	};
	const viewList = await metaViewService.search({ data: viewCriteria });
	let views;
	if (viewList.data) {
		views = Utils.getViews(viewList.data, view.name);
	}
	return views;
}

export async function fetchModelFields(model) {
	if (!model || (model && (!model.packageName || !model.name))) return [];
	let fields = [];
	const _data = {
		_domain: `self.packageName = '${model.packageName}' and self.name = '${model.name}'`,
	};
	const result = await modelService.search({ data: _data });
	if (result.data && result.data[0]) {
		const record = result.data[0];
		const data = {
			fields: ["metaFields"],
			related: {
				metaFields: [
					"typeName",
					"label",
					"mappedBy",
					"relationship",
					"name",
					"packageName",
					"typeName",
				],
			},
		};
		const modelData = await modelService.fetch(record.id, data);

		if (modelData && modelData.data[0]) {
			fields = modelData.data[0].metaFields;
			return fields;
		}
	}
	return fields;
}

export async function fetchAttrsList({ model, view }) {
	const criteria = [
		{ fieldName: "model", operator: "=", value: model },
		{ fieldName: "view", operator: "=", value: view },
	];
	const result = await metaAttrsService.search({
		data: { criteria },
		limit: null,
	});
	if (result.data && Array.isArray(result.data)) {
		const conditionPropertiesKeys = Object.keys(conditionProperties);
		const conditionPropertiesValues = Object.values(conditionProperties);

		const data = [...result.data].map((item) => {
			if (conditionPropertiesValues.includes(item.name)) {
				if (item.value.startsWith('"') && item.value.endsWith('"')) {
					item.value = item.value.replace(`"`, "");
					item.value = item.value.replace(`"`, "");
				} else {
					if (!["true", "false"].includes(item.value)) {
						item.name =
							conditionPropertiesKeys[
								conditionPropertiesValues.indexOf(item.name)
							];
					}
				}
			} else {
				item.value = item.value.replace(`"`, "");
				item.value = item.value.replace(`"`, "");
			}
			return item;
		});
		return data;
	}
	return [];
}

export async function saveAttrsList(list, handleError = () => {}) {
	const result = await metaAttrsService.saveAll([...list]);

	if (result?.status === -1) {
		handleError(result.data || {});
		return [];
	}
	if (result.data && Array.isArray(result.data)) {
		return result.data;
	}
	return [];
}

export async function deleteAttrsList(list, handleError = () => {}) {
	const result = await metaAttrsService.removeAll(list);
	if (result?.status === -1) {
		handleError(result.data || {});
		return [];
	}
	if (result.data && Array.isArray(result.data)) {
		return result.data;
	}
	return [];
}

export async function fetchLanguages() {
	const criteria = [
		{ fieldName: "name", operator: "=", value: "select.language" },
	];
	const result = await metaSelectService.search({
		data: { criteria },
		fields: ["items.value", "items.title"],
	});
	if (result && result.data && Array.isArray(result.data)) {
		return result.data.map((d) => {
			return { title: d["items.title"], value: d["items.value"] };
		});
	}
	return [];
}

export async function getTranslationList(keyList) {
	const criteria = [{ fieldName: "key", operator: "in", value: keyList }];
	const result = await metaTranslationService.search({ data: { criteria } });
	if (result.data && Array.isArray(result.data)) {
		return result.data;
	}
	return [];
}

export async function saveTranslationList(list, handleError = () => {}) {
	const result = await metaTranslationService.saveAll([...list]);
	if (result?.status === -1) {
		handleError(result.data || {});
		return [];
	}
	if (result.data && Array.isArray(result.data)) {
		return result.data;
	}
	return [];
}

export async function deleteTranslationList(list, handleError = () => {}) {
	const result = await metaTranslationService.removeAll(list);
	if (result?.status === -1) {
		handleError(result.data || {});
		return [];
	}
	if (result.data && Array.isArray(result.data)) {
		return result.data;
	}
	return [];
}

export async function fetchUserPreferences() {
	const userInfo = await appUserService.info();
	if (userInfo && userInfo["user.id"]) {
		const userResponse = await appUserService.fetch(userInfo["user.id"], {
			fields: ["theme"],
		});
		if (userResponse && userResponse.data && userResponse.data[0]) {
			return userResponse.data[0];
		}
	}
	return null;
}

export async function getSelectionText(metaSelect) {
	let selectionText = "";
	if (metaSelect) {
		const context = {
			metaSelect: {
				...metaSelect,
			},
		};
		const payloadData = {
			data: { context },
			action: "action-studio-selection-method-fill-selection-text",
			model: "com.axelor.studio.db.StudioSelection",
		};
		const actionResponse = await selectionBuilderService.action(payloadData);
		const { data = [] } = actionResponse;
		if (data[0]) {
			const _properties = data[0].values || {};
			if (_properties.selectionText) {
				selectionText = _properties.selectionText;
			}
		}
	}
	return selectionText;
}
