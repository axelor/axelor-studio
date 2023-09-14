import React from "react";
import convert from "xml-js";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
} from "@material-ui/core";
import _ from "lodash";
import { makeStyles } from "@material-ui/core/styles";

import Toolbar from "./Toolbar";
import { useStore } from "../store/context";
import { generateView } from "../store/extensionGenerator";
import AxelorService from "../services/axelor.rest";
import Utils, {
	generateCustomModelSchema,
	translate,
	isPanelTab,
	getDuplicateArrayValues,
} from "../utils";
import {
	MODEL_TYPE,
	conditionProperties,
	otherNoQuoteProps,
	ItemTypes,
	PANEL_PROPS,
	TYPE,
} from "../constants";
import {
	saveCustomModel,
	fetchJSONFields,
	removeCustomModel,
	generateMenuChange,
	fetchCustomModel,
	fetchCustomFields,
	fetchViews,
	saveAttrsList,
	fetchAttrsList,
	saveTranslationList,
	getTranslationList,
	deleteAttrsList,
	deleteTranslationList,
} from "./api";
import DeleteConfirmation from "./DeleteConfirmation";
import { getXML } from "../store/computeXML";
import { generateXpath, eGeneratePath } from "../store/xpathGenerator";
import {
	optimizeExtension,
	getUpdatedAttrsList,
} from "../store/optimizeExtension";

const metaViewService = new AxelorService({
	model: "com.axelor.meta.db.MetaView",
});
const customFieldService = new AxelorService({
	model: "com.axelor.meta.db.MetaJsonField",
});

const useStyles = makeStyles(() => ({
	paper: {
		minWidth: 300,
	},
	button: {
		textTransform: "none",
		backgroundColor: "#0275d8",
		borderColor: "#0275d8",
		color: "#fff",
		"&:hover": {
			backgroundColor: "#0275d8",
			borderColor: "#0275d8",
			color: "#fff",
		},
	},
}));

const getCurrentTabIndex = (widgets) => {
	if (!widgets) return;
	const panelTab = Object.values(widgets).find(
		(widget) => widget.type === TYPE.tabs
	);
	const currentTabIndex = panelTab?.items?.indexOf(panelTab?.current);
	return currentTabIndex;
};

const getWidgets = ({ widgets, items }) => {
	Object.keys(widgets).forEach((widgetId) => {
		const path = eGeneratePath(widgets, items, widgetId);
		widgets[widgetId].xPath = path;
	});
	return widgets;
};

const getChangedTranslationList = (
	list,
	initialList,
	removedTranslationList
) => {
	const deletedTranslationList = [];
	const changedTranslationList =
		list?.length > 0 &&
		list.filter((item) => {
			if (removedTranslationList.indexOf(item.key) !== -1) {
				item.id &&
					deletedTranslationList.push({ id: item.id, version: item.version });
				return false;
			}
			if (item.id) {
				const initialItem = initialList.find(
					(i) => i.language === item.language && i.key === item.key
				);
				if (initialItem && initialItem.message !== item.message) {
					return true;
				}
				return false;
			}
			return true;
		});
	return { changedTranslationList, deletedTranslationList };
};

function ToolbarContainer(props) {
	const {
		state,
		update,
		startLoader,
		undo,
		redo,
		clearHistory,
		onSelect,
		onWidgetChange,
	} = useStore();
	const [deleteConfirmationDialog, setDeleteConfirmationDialog] =
		React.useState(false);
	const { customFieldWidgets, widgets, modelType, isStudioLite, queryModel } =
		state;
	const classes = useStyles();

	const closeLoader = React.useCallback(() => {
		update((draft) => {
			draft.loader = false;
		});
	}, [update]);

	const showAlert = React.useCallback(
		(message, title) => {
			const dialog = {
				message: translate(message) || translate("Some error occurred"),
				...(title ? { title: translate(title) } : {}),
				type: "alert",
			};
			update((draft) => {
				draft.loader = false;
				draft.dialog = dialog;
			});
		},
		[update]
	);

	const reset = React.useCallback(
		(updater, draft) => {
			const callbackfn = (draft) => {
				updater && updater(draft);
				draft.errorList = {};
				draft.customModel = null;
				draft.exView = null;
				draft.view = null;
				draft.extensionXML = null;
				draft.extensionView = null;
				draft.loader = false;
				draft.metaFields = draft.metaFieldStore || [];
				draft.selectedView = null;
				draft.translationList = [];
				draft.initialTranslationList = [];
				draft.attrsList = [];
				draft.model = null;
				const newId = _.uniqueId();
				draft.widgets = {
					"-1": {
						type: "form",
						cols: 12,
						extension: false,
						name: isStudioLite ? queryModel?.name : null,
						title: isStudioLite ? queryModel?.title : null,
						...Utils.getDefaultProperties(draft.modelType),
					},
					0: { type: "dump_field", name: "" },
					[newId]: {
						name: `panel${newId}`,
						...PANEL_PROPS,
					},
				};
				draft.items = [`${newId}`];
				draft.editWidget = -1;
				draft.editWidgetType = null;
				draft.tabIndex = 0;
			};
			if (draft) {
				callbackfn(draft);
			} else {
				update(callbackfn);
			}
		},
		[update, isStudioLite, queryModel]
	);

	const removeView = React.useCallback(
		function removeView() {
			startLoader();
			const clearView = (dialog) => {
				update((draft) => {
					clearHistory(draft);
					draft.customModel = null;
					draft.dialog = dialog;
					draft.widgets = null;
					draft.initialItems = null;
					draft.initialWidgets = null;
					draft.items = [];
					draft.view = null;
					draft.metaFields = [];
					draft.selectedView = null;
					draft.originalXML = null;
					draft.extensionXML = null;
					draft.selectedView = null;
					draft.loader = false;
					draft.extensionView = null;
					draft.errorList = {};
					if (draft.modelType === MODEL_TYPE.CUSTOM) {
						reset(null, draft);
					}
				});
			};
			if (state.modelType === MODEL_TYPE.CUSTOM) {
				if (state.model || state.customModel) {
					removeCustomModel(state.model || state.customModel).then((res) => {
						const { data, status } = res || {};
						if (status === -1) {
							const { message = "" } = data || {};
							showAlert(message);
							return;
						} else {
							clearView(null);
						}
					});
				}
			} else {
				let record;
				if (state.extensionView) {
					record = {
						id: state.extensionView.id,
						version: state.extensionView.version,
					};
				} else if (
					state.selectedView &&
					state.selectedView.xmlId &&
					state.selectedView.xmlId.indexOf("studio-") === 0
				) {
					record = {
						id: state.selectedView.id,
						version: state.selectedView.version,
					};
				}
				if (record) {
					metaViewService.removeAll([record]).then((e) => {
						clearView(null);
					});
				}
			}
		},
		[update, state, startLoader, clearHistory, reset, showAlert]
	);

	const refresh = React.useCallback(async () => {
		if (state.modelType === MODEL_TYPE.CUSTOM) {
			const { customModel } = state;
			if (!customModel) return;
			const record =
				(await fetchCustomModel(customModel.id, (error) => {
					showAlert(error?.message, error?.title);
				})) || {};
			const { fields = [], ...rest } = record;
			if (rest.studioMenu) {
				rest.studioMenu = {
					...customModel.studioMenu,
					...rest.studioMenu,
				};
			}
			fetchJSONFields(
				fields.map((f) => f.id),
				update,
				rest
			);
			update((draft) => {
				draft.customModel = {
					...(record || {}),
					studioMenu: rest?.studioMenu,
				};
				draft.model = record;
				draft.loader = false;
				draft.removedCustomFields = [];
				draft.errorList = {};
				clearHistory(draft);
			});
		} else {
			if (state.widgets) {
				const { view } = state;
				const res = await metaViewService.fetch(view?.view?.id);
				if (res && res.status === -1) {
					const { message, title } = res.data || {};
					showAlert(message, title);
					return;
				}
				const record = res && res.data && res.data[0];
				const attrsList = await fetchAttrsList({
					model: state.model.fullName,
					view: state.selectedView.name,
				});
				update((draft) => {
					draft.loader = false;
					const views = draft.view;
					const schema = Utils.generateXMLToViewSchema({
						view: record,
						fields: draft.metaFieldStore,
						extensionXML: views?.extensionXML,
						attrsList: attrsList || [],
					});
					draft.widgets = schema.widgets;
					draft.initialWidgets = schema.widgets;
					draft.items = schema.items;
					draft.initialItems = schema.items;
					draft.extensionMoves = [];
					draft.attrsList = attrsList || [];
					draft.errorList = {};
					draft.baseHasChanges = false;
					generateXpath(draft);
					clearHistory(draft);
				});
			}
			if (
				(state.customFieldItems || state.removedCustomFields.length) &&
				state.modelField?.name
			) {
				startLoader();
				fetchCustomFields(state.modelField, state.model).then((res) => {
					if (res && res.status === -1) {
						const { message, title } = res.data || {};
						showAlert(message, title);
						return;
					}
					const { data = [] } = res;
					const schema = generateCustomModelSchema(
						data,
						undefined,
						"",
						"customForm"
					);
					update((draft) => {
						const newId = _.uniqueId();
						draft.customFieldWidgets =
							Object.keys(schema.widgets)?.length > 2
								? schema.widgets
								: {
										...schema.widgets,
										[newId]: {
											name: `panel${newId}`,
											...PANEL_PROPS,
											model: draft.model.fullName,
										},
								  };
						draft.customFieldItems =
							schema.items?.length > 0 ? schema.items : [`${newId}`];
						draft.customFields = data;
						draft.loader = false;
						draft.removedCustomFields = [];
						draft.errorList = {};
						draft.customFieldHasChanges = false;
						clearHistory(draft);
					});
				});
			} else {
				closeLoader();
			}
		}
	}, [update, state, closeLoader, startLoader, showAlert, clearHistory]);

	const isTabsPanelEmpty = React.useCallback(() => {
		const propertyValues =
			Object.values(
				(modelType === MODEL_TYPE.BASE ? customFieldWidgets : widgets) || {}
			) || [];
		const panelTab = propertyValues.find((v) => v.type === TYPE.tabs);
		if (panelTab && !panelTab?.items?.length) {
			showAlert("Tabs should have atleast one panel");
			return false;
		} else {
			return true;
		}
	}, [customFieldWidgets, widgets, modelType, showAlert]);

	const isOnlySidePanel = React.useCallback(() => {
		const { sideItems, mainItems } = state;
		if (sideItems.length && !mainItems.length) {
			showAlert("Main panel is required to have side panels");
			return true;
		}
		return false;
	}, [state, showAlert]);

	const saveView = React.useCallback(async () => {
		if (!state.widgets) {
			return;
		}
		if (!isTabsPanelEmpty() || isOnlySidePanel()) return;
		startLoader();
		if (window.parent) {
			window.parent.studioOutput = JSON.stringify({
				isSave: true,
				form: state.widgets[-1]?.title,
			});
		}
		if (state.modelType === MODEL_TYPE.CUSTOM) {
			const { fields } = Utils.getCustomModelFields(
				state.items,
				state.widgets,
				null,
				true
			);
			const propertyValues = Object.values(state.widgets || {}) || [];

			const duplicateValues = getDuplicateArrayValues(propertyValues, false);
			if (duplicateValues.length > 0) {
				showAlert(
					`${translate(
						"Field name should be unique. Check"
					)} ${duplicateValues.map((duplicate) => ` ${duplicate.name}`)}`
				);
				return;
			}

			const formProperties = state.widgets[-1];
			if (!formProperties.name || !formProperties.title) {
				showAlert("Please enter form name and title");
				return;
			}
			if (state.removedCustomFields.length) {
				const res = await customFieldService.removeAll(
					state.removedCustomFields
				);
				if (res && res.status === -1) {
					const { message, title } = res.data || {};
					showAlert(message, title);
					return;
				}
			}
			let customModel = {
				...state.customModel,
				...Utils.getFormProperties(formProperties),
				fields,
				...(state.customModel && { version: state.customModel.version }),
			};
			if (formProperties.isGenerateMenu === true) {
				customModel["studioMenu"] = {
					...(state.customModel || {}).studioMenu,
					title: formProperties.menuBuilderTitle,
					parentMenu: formProperties.menuBuilderParent,
					version: ((state.customModel || {}).studioMenu || {}).$version,
				};
			}
			const { isGenerateMenu } = state.customModel || {};
			if (formProperties.isGenerateMenu !== isGenerateMenu) {
				const res = await generateMenuChange(customModel);
				const { data = [] } = res;
				if (data[0] && data[0].reload) {
					const modelResult = await fetchCustomModel(
						customModel.id,
						(error) => {
							showAlert(error?.message, error?.title);
						}
					);
					if (!modelResult) return;
					customModel = {
						...customModel,
						studioMenu: null,
						version: modelResult.version,
					};
				}
			}
			saveCustomModel(customModel).then((res) => {
				const { data, status } = res || {};
				if (status === -1) {
					const { message = "", title } = data || {};
					let errorMessage = message;
					if (
						title &&
						title.includes(translate("Unique constraint violation"))
					) {
						errorMessage = translate("Model name should be unique");
						if (message.includes("com.axelor.meta.db.MetaJsonRecord")) {
							errorMessage = translate("Field name should be unique");
						}
					}
					showAlert(errorMessage);
					return;
				}
				const record = data && data[0];
				const { fields = [], ...rest } = record;
				if (rest.studioMenu) {
					rest.studioMenu = {
						...customModel.studioMenu,
						...rest.studioMenu,
					};
				}

				const currentTabIndex = getCurrentTabIndex(state.widgets);

				fetchJSONFields(
					fields.map((f) => f.id),
					update,
					rest,
					currentTabIndex
				);
				update((draft) => {
					draft.customModel = record;
					draft.model = record;
					draft.loader = false;
					draft.removedCustomFields = [];
					clearHistory(draft);
				});
			});
		} else {
			if (state.widgets) {
				const exemptAttributes = [
					"viewId",
					"modelId",
					"version",
					"helpOverride",
					"menubar",
					"xml",
					"computed",
					"xmlId",
					"type",
					"cols",
					"colSpan",
					"serverType",
				];
				if (!state.exView || Utils.isCreatedFromStudio(state.exView)) {
					const formProperties = state.widgets[-1];
					if (!formProperties.name || !formProperties.title) {
						showAlert("Please enter form name and title");
						return;
					}
					const viewSearch = await metaViewService.search({
						data: { _domain: `self.name = '${formProperties.name}'` },
					});
					if (
						viewSearch &&
						viewSearch.total &&
						viewSearch.total > 0 &&
						!state.exView?.id
					) {
						showAlert("View name already exists");
						return;
					}
					const patch = generateView(
						state.widgets,
						state.items,
						state.modelType
					);
					const model = state.model.fullName;
					const form = {
						elements: [
							{
								name: "form",
								type: "element",
								attributes: {
									model,
									...Utils.getFormProperties(formProperties, [
										...exemptAttributes,
										"extension",
										"id",
									]),
									id:
										state.exView && state.exView.xmlId
											? state.exView.xmlId
											: `studio-${formProperties.name}`,
								},
								elements: [...patch],
							},
						],
					};
					const xml = Utils.processXML(
						convert.json2xml(form, {
							compact: false,
							fullTagEmptyElement: false,
						})
					);
					let data = {
						xml,
						extension: formProperties.extension,
						type: "form",
						name: formProperties.name,
						title: formProperties.title,
						model,
						xmlId: `studio-${formProperties.name}`,
					};
					if (state.exView && state.exView.id) {
						data["id"] = state.exView.id;
						data["version"] = state.exView.version;
						data["xmlId"] = state.exView.xmlId || data.xmlId;
					}
					metaViewService.save(data).then(async (res) => {
						if (res.status === -1) {
							const error = res.data;
							showAlert(error?.string || error?.message, error?.title);
						} else if (res.data && res.data[0]) {
							const fetchResult = await metaViewService.fetch(res.data[0].id);
							if (fetchResult.data && fetchResult.data[0]) {
								const record = fetchResult.data[0];
								update((draft) => {
									const schema = Utils.generateXMLToViewSchema({
										view: record,
										fields: draft.metaFieldStore,
									});
									draft.widgets = schema.widgets;
									draft.initialWidgets = schema.widgets;
									draft.items = schema.items;
									draft.initialItems = schema.items;
									draft.metaView = record;
									draft.exView = record;
									draft.selectedView = { ...record };
									draft.loader = false;
									draft.baseHasChanges = false;
									clearHistory(draft);
								});
							}
						}
					});
				} else {
					const { view } = state.view;
					const model = state.model.fullName;
					const originalSchema = Utils.generateViewFromJson({
						view: state.originalXML,
						fields: state.metaFieldStore,
					});
					const widgets = getWidgets(originalSchema);
					const moves = optimizeExtension(state, widgets);
					const { changedAttrsList, removedAttrsList } = getUpdatedAttrsList(
						state,
						widgets
					);
					const extension = getXML(moves, state);
					let isAttrsChanged = false;
					let attrsList = [];
					if (changedAttrsList.length) {
						isAttrsChanged = true;
						const conditionalValues = Object.values(conditionProperties);
						const list = changedAttrsList.map((attr) => {
							if (
								[...conditionalValues, ...otherNoQuoteProps].includes(attr.name)
							) {
								return attr;
							}
							return { ...attr, value: `"${attr.value}"` };
						});
						await saveAttrsList(list, (error) => {
							showAlert(error?.message, error?.title);
						});
					}
					if (removedAttrsList.length) {
						isAttrsChanged = true;
						await deleteAttrsList(removedAttrsList, (error) => {
							showAlert(error?.message, error?.title);
						});
					}
					if (isAttrsChanged) {
						attrsList = await fetchAttrsList({
							model: state.model.fullName,
							view: state.selectedView.name,
						});
					}
					const { changedTranslationList, deletedTranslationList } =
						getChangedTranslationList(
							state.translationList,
							state.initialTranslationList,
							state.removedTranslationList
						);
					let translationList = [];
					let isTranslationChanged = false;
					if (changedTranslationList?.length) {
						isTranslationChanged = true;
						await saveTranslationList(changedTranslationList, (error) => {
							showAlert(error?.message, error?.title);
						});
					}
					if (deletedTranslationList?.length) {
						isTranslationChanged = true;
						await deleteTranslationList(deletedTranslationList, (error) => {
							showAlert(error?.message, error?.title);
						});
					}
					if (isTranslationChanged) {
						const translationNames = Object.values(state.widgets)
							.filter(
								(widget) => widget.title && widget.title.startsWith("studio:")
							)
							.map((widget) => widget.title);
						translationList = await getTranslationList(translationNames);
						update((draft) => {
							draft.translationList = translationList;
							draft.initialTranslationList = translationList;
							draft.removedTranslationList = [];
						});
					}
					if (!extension.length && !state.extensionXML) {
						if (state.extensionView) {
							removeView();
						} else {
							update((draft) => {
								draft.loader = false;
								const views = draft.view;
								if (isAttrsChanged) {
									const schema = Utils.generateXMLToViewSchema({
										view: views.view,
										fields: draft.metaFieldStore,
										extensionXML: views.extensionXML,
										attrsList,
									});
									draft.widgets = schema.widgets;
									draft.initialWidgets = schema.widgets;
									draft.items = schema.items;
									draft.initialItems = schema.items;
									draft.extensionMoves = [];
									draft.attrsList = attrsList;
									draft.baseHasChanges = false;
									generateXpath(draft);
									clearHistory(draft);
								}
							});
						}
						return;
					}
					const getExistingExtension = (json) => {
						if (!json) {
							return [];
						}
						const { elements } = json;
						if (elements[0] && elements[0].elements) {
							return elements[0].elements;
						}
					};
					const form = {
						elements: [
							{
								type: "element",
								name: state.widgets[-1].type,
								attributes: {
									model,
									id: `studio-${view.name}`,
									title: state.widgets[-1].title,
									name: view.name,
									extension: "true",
								},
								elements: [
									...getExistingExtension(state.extensionXML),
									...extension,
								],
							},
						],
					};
					const xml = Utils.processXML(
						convert.json2xml(form, {
							compact: false,
							fullTagEmptyElement: false,
						})
					);
					let data = {
						xml,
						extension: true,
						type: state.widgets[-1].type,
					};
					if (state.extensionView) {
						data = {
							...data,
							id: state.extensionView.id,
							version: state.extensionView.version,
						};
					} else {
						data = {
							...data,
							model,
							name: view.name,
							title: view.title,
							xmlId: `studio-${view.name}`,
						};
					}
					if (state.extensionView) {
						if (state.extensionView.xml === data.xml) {
							update((draft) => {
								draft.loader = false;
								if (isAttrsChanged) {
									update((draft) => {
										draft.loader = false;
										const views = draft.view;
										const schema = Utils.generateXMLToViewSchema({
											view: views.view,
											fields: draft.metaFieldStore,
											extensionXML: views.extensionXML,
											attrsList,
										});
										draft.widgets = schema.widgets;
										draft.initialWidgets = schema.widgets;
										draft.items = schema.items;
										draft.initialItems = schema.items;
										if (isAttrsChanged) {
											draft.attrsList = attrsList;
										}
										draft.baseHasChanges = false;
										generateXpath(draft);
										clearHistory(draft);
									});
								}
							});
							return;
						}
					}
					metaViewService.save(data).then(async (res) => {
						if (res.status === -1) {
							showAlert(res.data?.string);
						} else if (res.data && res.data[0]) {
							const record = res.data[0];
							const { view } = state.view;
							const views = await fetchViews(view);
							update((draft) => {
								const schema = Utils.generateXMLToViewSchema({
									view: views.view,
									fields: draft.metaFieldStore,
									extensionXML: views.extensionXML,
									attrsList,
								});
								draft.widgets = schema.widgets;
								draft.initialWidgets = schema.widgets;
								draft.items = schema.items;
								draft.initialItems = schema.items;
								draft.exView = res.data[0];
								draft.extensionMoves = [];
								draft.loader = false;
								if (isAttrsChanged) {
									draft.attrsList = attrsList;
								}
								draft.extensionView = {
									...draft.extensionView,
									...record,
									version:
										views.extensionXML.id === record.id
											? views.extensionXML.version
											: record.version,
								};
								draft.baseHasChanges = false;
								generateXpath(draft);
								clearHistory(draft);
							});
						}
					});
				}
			}
		}
	}, [
		state,
		update,
		startLoader,
		isTabsPanelEmpty,
		isOnlySidePanel,
		removeView,
		clearHistory,
		showAlert,
	]);

	const handleClose = React.useCallback(() => {
		update((draft) => {
			draft.dialog = null;
		});
	}, [update]);

	const handleNew = React.useCallback(() => {
		startLoader();
		reset((draft) => {
			clearHistory(draft);
		});
	}, [reset, startLoader, clearHistory]);

	React.useEffect(() => {
		reset((draft) => {
			draft.modelType = MODEL_TYPE.CUSTOM;
		});
	}, [reset]);

	const saveCustomFieldView = React.useCallback(async () => {
		if (
			(state.customFieldItems || state.removedCustomFields.length) &&
			state.modelField?.name
		) {
			if (!isTabsPanelEmpty()) return;
			const customWidgets = Object.fromEntries(
				Object.entries(state.customFieldWidgets).filter(
					([, value]) =>
						(value.type === ItemTypes.CONTAINER && value.items?.length > 0) ||
						isPanelTab(value) || //allowing empty panel tab
						value.type !== ItemTypes.CONTAINER ||
						typeof value.id === "number"
				)
			);
			const propertyValues = Object.values(customWidgets || {}) || [];

			const duplicateValues = getDuplicateArrayValues(propertyValues, true);
			if (duplicateValues.length > 0) {
				showAlert(
					`${translate(
						"Field name should be unique. Check"
					)} ${duplicateValues.map((duplicate) => ` ${duplicate.name}`)}`
				);
				return;
			}

			startLoader();
			const extraProps = {
				modelField: state.modelField.name,
				model: state.model.fullName,
			};
			const { fields } = Utils.getCustomModelFields(
				state.customFieldItems,
				customWidgets,
				extraProps,
				true
			);
			if (fields.length || state.removedCustomFields.length) {
				if (state.removedCustomFields.length) {
					const res = await customFieldService.removeAll(
						state.removedCustomFields
					);
					if (res && res.status === -1) {
						const { message, title } = res.data || {};
						showAlert(message, title);
						return;
					}
				}

				const all = fields.map((field) => customFieldService.save(field));
				const res = await Promise.all(all);
				const failedRes = res && res.find((r) => r.status === -1);
				if (failedRes && failedRes.data) {
					const { title, message } = failedRes.data || {};
					let errorMessage = message;
					if (
						title &&
						title.includes(translate("Unique constraint violation"))
					) {
						errorMessage = "Field name should be unique";
					}
					showAlert(errorMessage);
					return;
				}
				fetchCustomFields(state.modelField, state.model).then((res) => {
					const { data = [] } = res;

					const currentTabIndex = getCurrentTabIndex(state.customFieldWidgets);
					const schema = generateCustomModelSchema(
						data,
						undefined,
						"",
						"customForm",
						currentTabIndex
					);
					update((draft) => {
						const newId = _.uniqueId();
						draft.customFieldWidgets =
							Object.keys(schema.widgets)?.length > 2
								? schema.widgets
								: {
										...schema.widgets,
										[newId]: {
											name: `panel${newId}`,
											...PANEL_PROPS,
											model: draft.model.fullName,
										},
								  };
						draft.customFieldItems =
							schema.items?.length > 0 ? schema.items : [`${newId}`];
						draft.customFields = data;
						draft.loader = false;
						draft.removedCustomFields = [];
						draft.customFieldHasChanges = false;
						clearHistory(draft);
					});
				});
			} else {
				closeLoader();
				const schema = generateCustomModelSchema(
					[],
					undefined,
					"",
					"customForm"
				);
				const newId = _.uniqueId();
				update((draft) => {
					draft.customFieldWidgets = {
						...schema.widgets,
						[newId]: {
							name: `panel${newId}`,
							...PANEL_PROPS,
							model: draft.model.fullName,
						},
					};
					draft.customFieldItems = [`${newId}`];
					draft.customFieldHasChanges = false;
					clearHistory(draft);
				});
			}
		}
	}, [
		update,
		closeLoader,
		state,
		startLoader,
		isTabsPanelEmpty,
		clearHistory,
		showAlert,
	]);

	const handleConfirmationClose = React.useCallback(() => {
		setDeleteConfirmationDialog(false);
	}, []);

	const deleteView = React.useCallback(() => {
		setDeleteConfirmationDialog(true);
	}, []);

	const handleRemoveConfirmation = React.useCallback(() => {
		handleConfirmationClose();
		removeView();
	}, [removeView, handleConfirmationClose]);

	function renderDialog() {
		const { dialog } = state;
		const { message, title, type, onOK } = dialog ?? {};

		const handleOK = () => {
			type === "confirm" && onOK && onOK();
			handleClose();
		};
		return (
			dialog && (
				<Dialog
					open={!!message}
					classes={{
						paper: classes.paper,
					}}
				>
					<DialogTitle>{translate(title || "Alert")}</DialogTitle>
					<DialogContent>
						<div dangerouslySetInnerHTML={{ __html: translate(message) }}></div>
					</DialogContent>
					<DialogActions>
						<Button
							onClick={handleOK}
							className={classes.button}
							color="primary"
							autoFocus={type !== "confirm"}
						>
							{translate("OK")}
						</Button>
						{type === "confirm" && (
							<Button
								onClick={handleClose}
								className={classes.button}
								variant="outlined"
								color="primary"
								autoFocus
							>
								{translate("Cancel")}
							</Button>
						)}
					</DialogActions>
				</Dialog>
			)
		);
	}

	return (
		<React.Fragment>
			{renderDialog()}
			<Toolbar
				update={update}
				isStudioLite={isStudioLite}
				saveView={saveView}
				saveCustomFieldView={saveCustomFieldView}
				removeView={deleteView}
				onNew={handleNew}
				startLoader={startLoader}
				undo={undo}
				redo={redo}
				refresh={refresh}
				clearHistory={clearHistory}
				reset={reset}
				showAlert={showAlert}
				onSelect={onSelect}
				onWidgetChange={onWidgetChange}
			/>
			<DeleteConfirmation
				open={deleteConfirmationDialog}
				onClose={handleConfirmationClose}
				onOk={handleRemoveConfirmation}
				message="Are you sure? Do you want to delete it?"
			/>
		</React.Fragment>
	);
}

export default React.memo(ToolbarContainer);
