import React from "react"
import convert from "xml-js"
import _ from "lodash"
import Toolbar from "./Toolbar"
import { useStore } from "../store/context"
import { generateView } from "../store/extensionGenerator"
import AxelorService from "../services/api"
import {
	getDefaultProperties,
	generateXMLToViewSchema,
	getCustomModelFields,
	getFormProperties,
	processXML,
	isCreatedFromStudio,
	generateViewFromJson,
	generateCustomModelSchema,
	translate,
	isPanelTab,
	getDuplicateArrayValues,
	hasSidePanel,
	hasMainPanel,
} from "../utils"
import { validateWidgets } from "../store/validation"
import {
	MODEL_TYPE,
	conditionProperties,
	otherNoQuoteProps,
	ItemTypes,
	TYPE,
	HISTORY,
} from "../constants"
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
	deleteAttrsList,
} from "./api"
import DeleteConfirmation from "./DeleteConfirmation"
import { getXML } from "../store/computeXML"
import { generateXpath, eGeneratePath } from "../store/xpathGenerator"
import {
	optimizeExtension,
	getUpdatedAttrsList,
} from "../store/optimizeExtension"
import { getPanel } from "../fields"
import {
	Button,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@axelor/ui"

const metaViewService = new AxelorService({
	model: "com.axelor.meta.db.MetaView",
})
const customFieldService = new AxelorService({
	model: "com.axelor.meta.db.MetaJsonField",
})

const getCurrentTabIndex = (widgets) => {
	if (!widgets) return
	const panelTab = Object.values(widgets).find(
		(widget) => widget.type === TYPE.tabs
	)
	const currentTabIndex = panelTab?.items?.indexOf(panelTab?.current)
	return currentTabIndex
}

const getWidgets = ({ widgets, items }) => {
	Object.keys(widgets).forEach((widgetId) => {
		const path = eGeneratePath(widgets, items, widgetId)
		widgets[widgetId].xPath = path
	})
	return widgets
}

function ToolbarContainer() {
	const {
		state,
		update,
		startLoader,
		undo,
		redo,
		clearHistory,
		onSelect,
		onWidgetChange,
		changeCurrentTab,
	} = useStore()
	const [deleteConfirmationDialog, setDeleteConfirmationDialog] =
		React.useState(false)
	const { customFieldWidgets, widgets, modelType, isStudioLite, queryModel } =
		state

	const closeLoader = React.useCallback(() => {
		update((draft) => {
			draft.loader = false
		})
	}, [update])

	const showAlert = React.useCallback(
		(message, title, onOK) => {
			const dialog = {
				message: translate(message) || translate("Some error occurred"),
				...(title ? { title: translate(title) } : {}),
				type: "alert",
				onOK,
			}
			update((draft) => {
				draft.loader = false
				draft.dialog = dialog
			})
		},
		[update]
	)

	const reset = React.useCallback(
		(updater, draft) => {
			const callbackfn = (draft) => {
				updater && updater(draft)
				draft.customErrorList = {}
				draft.widgetErrorList = {}
				draft.customModel = null
				draft.exView = null
				draft.view = null
				draft.extensionXML = null
				draft.extensionView = null
				draft.loader = false
				draft.metaFields = draft.metaFieldStore || []
				draft.selectedView = null
				draft.attrsList = []
				draft.model = null
				const newId = _.uniqueId()
				draft.widgets = {
					"-1": {
						type: "form",
						cols: 12,
						extension: false,
						name: isStudioLite ? queryModel?.name : null,
						title: isStudioLite ? queryModel?.title : null,
						...getDefaultProperties(draft.modelType),
					},
					0: { type: "dump_field", name: "" },
					[newId]: getPanel(draft.modelType, {
						name: `panel${newId}`,
					}),
				}
				draft.items = [`${newId}`]
				draft.editWidget = -1
				draft.editWidgetType = null
			}
			if (draft) {
				callbackfn(draft)
			} else {
				update(callbackfn)
			}
		},
		[update, isStudioLite, queryModel]
	)

	const removeView = React.useCallback(
		function removeView() {
			startLoader()
			const clearView = (dialog) => {
				update((draft) => {
					clearHistory(
						draft,
						draft.modelType === MODEL_TYPE.CUSTOM
							? HISTORY.WIDGET
							: HISTORY.CUSTOM
					)
					draft.customModel = null
					draft.dialog = dialog
					draft.widgets = null
					draft.items = []
					draft.view = null
					draft.metaFields = []
					draft.selectedView = null
					draft.originalXML = null
					draft.extensionXML = null
					draft.selectedView = null
					draft.loader = false
					draft.extensionView = null
					draft.widgetErrorList = {}
					if (draft.modelType === MODEL_TYPE.CUSTOM) {
						reset(null, draft)
					}
				})
			}
			if (state.modelType === MODEL_TYPE.CUSTOM) {
				if (state.model || state.customModel) {
					removeCustomModel(state.model || state.customModel).then((res) => {
						const { data, status } = res || {}
						if (status === -1) {
							const { message = "" } = data || {}
							showAlert(message)
							return
						} else {
							clearView(null)
						}
					})
				}
			} else {
				let record
				if (state.extensionView) {
					record = {
						id: state.extensionView.id,
						version: state.extensionView.version,
					}
				} else if (
					state.selectedView &&
					state.selectedView.xmlId &&
					state.selectedView.xmlId.indexOf("studio-") === 0
				) {
					record = {
						id: state.selectedView.id,
						version: state.selectedView.version,
					}
				}
				if (record) {
					metaViewService.removeAll([record]).then((e) => {
						clearView(null)
					})
				}
			}
		},
		[update, state, startLoader, clearHistory, reset, showAlert]
	)

	const refresh = React.useCallback(async () => {
		if (state.modelType === MODEL_TYPE.CUSTOM) {
			const { customModel } = state
			if (!customModel) return
			const record =
				(await fetchCustomModel(customModel.id, (error) => {
					showAlert(error?.message, error?.title)
				})) || {}
			const { fields = [], ...rest } = record
			if (rest.studioMenu) {
				rest.studioMenu = {
					...customModel.studioMenu,
					...rest.studioMenu,
				}
			}
			fetchJSONFields(
				fields.map((f) => f.id),
				update,
				rest
			)
			update((draft) => {
				draft.customModel = {
					...(record || {}),
					studioMenu: rest?.studioMenu,
				}
				draft.model = record
				draft.loader = false
				draft.removedCustomFields = []
				draft.widgetErrorList = {}
				draft.customErrorList = {}
				clearHistory(draft)
			})
		} else {
			if (state.widgets) {
				const { view } = state
				const res = await metaViewService.fetch(view?.view?.id)
				if (res && res.status === -1) {
					const { message, title } = res.data || {}
					showAlert(message, title)
					return
				}
				const record = res && res.data && res.data[0]
				const attrsList = await fetchAttrsList({
					model: state.model.fullName,
					view: state.selectedView.name,
				})
				update((draft) => {
					draft.loader = false
					const views = draft.view
					const schema = generateXMLToViewSchema({
						view: record,
						fields: draft.metaFieldStore,
						extensionXML: views?.extensionXML,
						attrsList: attrsList || [],
					})
					draft.widgets = schema.widgets
					draft.items = schema.items
					draft.extensionMoves = []
					draft.attrsList = attrsList || []
					draft.widgetErrorList = {}
					draft.customErrorList = {}
					generateXpath(draft)
					clearHistory(draft)
					validateWidgets(draft, schema.widgets, false)
				})
			}
			if (
				(state.customFieldItems || state.removedCustomFields.length) &&
				state.modelField?.name
			) {
				startLoader()
				fetchCustomFields(state.modelField, state.model).then((res) => {
					if (res && res.status === -1) {
						const { message, title } = res.data || {}
						showAlert(message, title)
						return
					}
					const { data = [] } = res
					const schema = generateCustomModelSchema(
						data,
						undefined,
						"",
						"customForm"
					)
					update((draft) => {
						const newId = _.uniqueId()
						draft.customFieldWidgets =
							Object.keys(schema.widgets)?.length > 2
								? schema.widgets
								: {
										...schema.widgets,
										[newId]: getPanel(MODEL_TYPE.BASE, {
											name: `panel${newId}`,
											model: draft.model.fullName,
										}),
								  }
						draft.customFieldItems =
							schema.items?.length > 0 ? schema.items : [`${newId}`]
						draft.customFields = data
						draft.loader = false
						draft.removedCustomFields = []
						draft.widgetErrorList = {}
						draft.customErrorList = {}
						clearHistory(draft)
						validateWidgets(draft, schema.widgets, true)
					})
				})
			} else {
				closeLoader()
			}
		}
	}, [update, state, closeLoader, startLoader, showAlert, clearHistory])

	const isTabsPanelEmpty = React.useCallback(() => {
		const propertyValues =
			Object.values(
				(modelType === MODEL_TYPE.BASE ? customFieldWidgets : widgets) || {}
			) || []
		const panelTab = propertyValues.find((v) => v.type === TYPE.tabs)
		if (panelTab && !panelTab?.items?.length) {
			showAlert("Tabs should have atleast one panel")
			return false
		} else {
			return true
		}
	}, [customFieldWidgets, widgets, modelType, showAlert])

	const isOnlySidePanel = React.useCallback(() => {
		if (
			hasSidePanel(state.items, state.widgets) &&
			!hasMainPanel(state.items, state.widgets)
		) {
			showAlert("Main panel is required to have side panels")
			return true
		}
		return false
	}, [state.items, state.widgets, showAlert])

	const saveView = React.useCallback(async () => {
		if (!state.widgets) {
			return
		}
		if (!isTabsPanelEmpty() || isOnlySidePanel()) return
		startLoader()
		if (window.parent) {
			window.parent.studioOutput = JSON.stringify({
				isSave: true,
				form: state.widgets[-1]?.title,
			})
		}
		if (state.modelType === MODEL_TYPE.CUSTOM) {
			const { fields } = getCustomModelFields(
				state.items,
				state.widgets,
				null,
				true
			)
			const propertyValues = Object.values(state.widgets || {}) || []

			const duplicateValues = getDuplicateArrayValues(propertyValues, false)
			if (duplicateValues.length > 0) {
				showAlert(
					`${translate(
						"Field name should be unique. Check"
					)} ${duplicateValues.map((duplicate) => ` ${duplicate.name}`)}`
				)
				return
			}

			const formProperties = state.widgets[-1]
			if (!formProperties.name || !formProperties.title) {
				showAlert("Please enter form name and title")
				return
			}
			if (state.removedCustomFields.length) {
				const res = await customFieldService.removeAll(
					state.removedCustomFields
				)
				if (res && res.status === -1) {
					const { message, title } = res.data || {}
					showAlert(message, title)
					return
				}
			}
			let customModel = {
				...state.customModel,
				...getFormProperties(formProperties),
				fields,
				...(state.customModel && { version: state.customModel.version }),
			}
			if (formProperties.isGenerateMenu === true) {
				customModel["studioMenu"] = {
					...(state.customModel || {}).studioMenu,
					title: formProperties.menuBuilderTitle,
					parentMenu: formProperties.menuBuilderParent,
					version: ((state.customModel || {}).studioMenu || {}).$version,
				}
			}
			const { isGenerateMenu } = state.customModel || {}
			if (formProperties.isGenerateMenu !== isGenerateMenu) {
				const res = await generateMenuChange(customModel)
				const { data = [] } = res
				if (data[0] && data[0].reload) {
					const modelResult = await fetchCustomModel(
						customModel.id,
						(error) => {
							showAlert(error?.message, error?.title)
						}
					)
					if (!modelResult) return
					customModel = {
						...customModel,
						studioMenu: null,
						version: modelResult.version,
					}
				}
			}
			saveCustomModel(customModel).then((res) => {
				const { data, status } = res || {}
				if (status === -1) {
					const { message = "", title } = data || {}
					let errorMessage = message
					if (
						title &&
						title.includes(translate("Unique constraint violation"))
					) {
						errorMessage = translate("Model name should be unique")
						if (message.includes("com.axelor.meta.db.MetaJsonRecord")) {
							errorMessage = translate("Field name should be unique")
						}
					}
					showAlert(errorMessage)
					return
				}
				const record = data && data[0]
				const { fields = [], ...rest } = record
				if (rest.studioMenu) {
					rest.studioMenu = {
						...customModel.studioMenu,
						...rest.studioMenu,
					}
				}

				const currentTabIndex = getCurrentTabIndex(state.widgets)

				fetchJSONFields(
					fields.map((f) => f.id),
					update,
					rest,
					currentTabIndex
				)
				update((draft) => {
					draft.customModel = record
					draft.model = record
					draft.loader = false
					draft.removedCustomFields = []
					clearHistory(draft)
				})
			})
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
				]
				if (!state.exView || isCreatedFromStudio(state.exView)) {
					const formProperties = state.widgets[-1]
					if (!formProperties.name || !formProperties.title) {
						showAlert("Please enter form name and title")
						return
					}
					const viewSearch = await metaViewService.search({
						data: { _domain: `self.name = '${formProperties.name}'` },
					})
					if (
						viewSearch &&
						viewSearch.total &&
						viewSearch.total > 0 &&
						!state.exView?.id
					) {
						showAlert("View name already exists")
						return
					}
					const patch = generateView(
						state.widgets,
						state.items,
						state.modelType
					)
					const model = state.model.fullName
					const form = {
						elements: [
							{
								name: "form",
								type: "element",
								attributes: {
									model,
									...getFormProperties(formProperties, [
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
					}
					const xml = processXML(
						convert.json2xml(form, {
							compact: false,
							fullTagEmptyElement: false,
						})
					)
					let data = {
						xml,
						extension: formProperties.extension,
						type: "form",
						name: formProperties.name,
						title: formProperties.title,
						model,
						xmlId: `studio-${formProperties.name}`,
					}
					if (state.exView && state.exView.id) {
						data["id"] = state.exView.id
						data["version"] = state.exView.version
						data["xmlId"] = state.exView.xmlId || data.xmlId
					}
					metaViewService.save(data).then(async (res) => {
						if (res.status === -1) {
							const error = res.data
							showAlert(error?.string || error?.message, error?.title)
						} else if (res.data && res.data[0]) {
							const fetchResult = await metaViewService.fetch(res.data[0].id)
							if (fetchResult.data && fetchResult.data[0]) {
								const record = fetchResult.data[0]
								update((draft) => {
									const schema = generateXMLToViewSchema({
										view: record,
										fields: draft.metaFieldStore,
									})
									draft.widgets = schema.widgets
									draft.items = schema.items
									draft.metaView = record
									draft.exView = record
									draft.selectedView = { ...record }
									draft.loader = false
									clearHistory(draft)
									validateWidgets(draft, schema.widgets, false)
								})
							}
						}
					})
				} else {
					const { view } = state.view
					const model = state.model.fullName
					const originalSchema = generateViewFromJson({
						view: state.originalXML,
						fields: state.metaFieldStore,
					})
					const widgets = getWidgets(originalSchema)
					const moves = optimizeExtension(state, widgets)
					const { changedAttrsList, removedAttrsList } = getUpdatedAttrsList(
						state,
						widgets
					)
					const extension = getXML(moves, state)
					let isAttrsChanged = false
					let attrsList = []
					if (changedAttrsList.length) {
						isAttrsChanged = true
						const conditionalValues = Object.values(conditionProperties)
						const list = changedAttrsList.map((attr) => {
							if (
								[...conditionalValues, ...otherNoQuoteProps].includes(attr.name)
							) {
								return attr
							}
							return { ...attr, value: `"${attr.value}"` }
						})
						await saveAttrsList(list, (error) => {
							showAlert(error?.message, error?.title)
						})
					}
					if (removedAttrsList.length) {
						isAttrsChanged = true
						await deleteAttrsList(removedAttrsList, (error) => {
							showAlert(error?.message, error?.title)
						})
					}
					if (isAttrsChanged) {
						attrsList = await fetchAttrsList({
							model: state.model.fullName,
							view: state.selectedView.name,
						})
					}
					if (!extension.length && !state.extensionXML) {
						if (state.extensionView) {
							removeView()
						} else {
							update((draft) => {
								draft.loader = false
								const views = draft.view
								if (isAttrsChanged) {
									const schema = generateXMLToViewSchema({
										view: views.view,
										fields: draft.metaFieldStore,
										extensionXML: views.extensionXML,
										attrsList,
									})
									draft.widgets = schema.widgets
									draft.items = schema.items
									draft.extensionMoves = []
									draft.attrsList = attrsList
									generateXpath(draft)
									clearHistory(draft)
									validateWidgets(draft, schema.widgets, false)
								}
							})
						}
						return
					}
					const getExistingExtension = (json) => {
						if (!json) {
							return []
						}
						const { elements } = json
						if (elements[0] && elements[0].elements) {
							return elements[0].elements
						}
					}
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
					}
					const xml = processXML(
						convert.json2xml(form, {
							compact: false,
							fullTagEmptyElement: false,
						})
					)
					let data = {
						xml,
						extension: true,
						type: state.widgets[-1].type,
					}
					if (state.extensionView) {
						data = {
							...data,
							id: state.extensionView.id,
							version: state.extensionView.version,
						}
					} else {
						data = {
							...data,
							model,
							name: view.name,
							title: view.title,
							xmlId: `studio-${view.name}`,
						}
					}
					if (state.extensionView) {
						if (state.extensionView.xml === data.xml) {
							update((draft) => {
								draft.loader = false
								if (isAttrsChanged) {
									update((draft) => {
										draft.loader = false
										const views = draft.view
										const schema = generateXMLToViewSchema({
											view: views.view,
											fields: draft.metaFieldStore,
											extensionXML: views.extensionXML,
											attrsList,
										})
										draft.widgets = schema.widgets
										draft.items = schema.items
										if (isAttrsChanged) {
											draft.attrsList = attrsList
										}
										generateXpath(draft)
										clearHistory(draft)
										validateWidgets(draft, schema.widgets, false)
									})
								}
							})
							return
						}
					}
					metaViewService.save(data).then(async (res) => {
						if (res.status === -1) {
							showAlert(res.data?.string)
						} else if (res.data && res.data[0]) {
							const record = res.data[0]
							const { view } = state.view
							const views = await fetchViews(view)
							update((draft) => {
								const schema = generateXMLToViewSchema({
									view: views.view,
									fields: draft.metaFieldStore,
									extensionXML: views.extensionXML,
									attrsList,
								})
								draft.widgets = schema.widgets
								draft.items = schema.items
								draft.exView = res.data[0]
								draft.extensionMoves = []
								draft.loader = false
								if (isAttrsChanged) {
									draft.attrsList = attrsList
								}
								draft.extensionView = {
									...draft.extensionView,
									...record,
									version:
										views.extensionXML.id === record.id
											? views.extensionXML.version
											: record.version,
								}
								generateXpath(draft)
								clearHistory(draft)
								validateWidgets(draft, schema.widgets, false)
							})
						}
					})
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
	])

	const handleClose = React.useCallback(() => {
		update((draft) => {
			draft.dialog = null
		})
	}, [update])

	const handleNew = React.useCallback(() => {
		startLoader()
		reset((draft) => {
			clearHistory(draft)
		})
	}, [reset, startLoader, clearHistory])

	React.useEffect(() => {
		reset((draft) => {
			draft.modelType = MODEL_TYPE.CUSTOM
		})
	}, [reset])

	const saveCustomFieldView = React.useCallback(async () => {
		if (
			(state.customFieldItems || state.removedCustomFields.length) &&
			state.modelField?.name
		) {
			if (!isTabsPanelEmpty()) return
			const customWidgets = Object.fromEntries(
				Object.entries(state.customFieldWidgets).filter(
					([, value]) =>
						(value.type === ItemTypes.CONTAINER && value.items?.length > 0) ||
						isPanelTab(value) || //allowing empty panel tab
						value.type !== ItemTypes.CONTAINER ||
						typeof value.id === "number"
				)
			)
			const propertyValues = Object.values(customWidgets || {}) || []

			const duplicateValues = getDuplicateArrayValues(propertyValues, true)
			if (duplicateValues.length > 0) {
				showAlert(
					`${translate(
						"Field name should be unique. Check"
					)} ${duplicateValues.map((duplicate) => ` ${duplicate.name}`)}`
				)
				return
			}

			startLoader()
			const extraProps = {
				modelField: state.modelField.name,
				model: state.model.fullName,
			}
			const { fields } = getCustomModelFields(
				state.customFieldItems,
				customWidgets,
				extraProps,
				true
			)
			if (fields.length || state.removedCustomFields.length) {
				if (state.removedCustomFields.length) {
					const res = await customFieldService.removeAll(
						state.removedCustomFields
					)
					if (res && res.status === -1) {
						const { message, title } = res.data || {}
						showAlert(message, title)
						return
					}
				}

				const all = fields.map((field) => customFieldService.save(field))
				const res = await Promise.all(all)
				const failedRes = res && res.find((r) => r.status === -1)
				if (failedRes && failedRes.data) {
					const { title, message } = failedRes.data || {}
					let errorMessage = message
					if (
						title &&
						title.includes(translate("Unique constraint violation"))
					) {
						errorMessage = "Field name should be unique"
					}
					showAlert(errorMessage)
					return
				}
				fetchCustomFields(state.modelField, state.model).then((res) => {
					const { data = [] } = res

					const currentTabIndex = getCurrentTabIndex(state.customFieldWidgets)
					const schema = generateCustomModelSchema(
						data,
						undefined,
						"",
						"customForm",
						currentTabIndex
					)
					update((draft) => {
						const newId = _.uniqueId()
						draft.customFieldWidgets =
							Object.keys(schema.widgets)?.length > 2
								? schema.widgets
								: {
										...schema.widgets,
										[newId]: getPanel(MODEL_TYPE.BASE, {
											name: `panel${newId}`,
											model: draft.model.fullName,
										}),
								  }
						draft.customFieldItems =
							schema.items?.length > 0 ? schema.items : [`${newId}`]
						draft.customFields = data
						draft.loader = false
						draft.removedCustomFields = []
						clearHistory(draft)
						validateWidgets(draft, schema.widgets, true)
					})
				})
			} else {
				closeLoader()
				const schema = generateCustomModelSchema(
					[],
					undefined,
					"",
					"customForm"
				)
				const newId = _.uniqueId()
				update((draft) => {
					draft.customFieldWidgets = {
						...schema.widgets,
						[newId]: getPanel(MODEL_TYPE.BASE, {
							name: `panel${newId}`,
							model: draft.model.fullName,
						}),
					}
					draft.customFieldItems = [`${newId}`]
					clearHistory(draft)
					validateWidgets(draft, schema.widgets, true)
				})
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
	])

	const handleConfirmationClose = React.useCallback(() => {
		setDeleteConfirmationDialog(false)
	}, [])

	const deleteView = React.useCallback(() => {
		setDeleteConfirmationDialog(true)
	}, [])

	const handleRemoveConfirmation = React.useCallback(() => {
		handleConfirmationClose()
		removeView()
	}, [removeView, handleConfirmationClose])

	function renderDialog() {
		const { dialog } = state
		const { message, title, type, onOK } = dialog ?? {}
		const handleOK = () => {
			onOK?.()
			handleClose()
		}
		return (
			dialog && (
				<Dialog open={!!message}>
					<DialogHeader onCloseClick={handleClose}>
						<DialogTitle>{translate(title || "Alert")}</DialogTitle>
					</DialogHeader>
					<DialogContent>
						<div dangerouslySetInnerHTML={{ __html: translate(message) }}></div>
					</DialogContent>
					<DialogFooter>
						<Button
							onClick={handleOK}
							variant="primary"
							size="sm"
							autoFocus={type !== "confirm"}
						>
							{translate("OK")}
						</Button>
						{type === "confirm" && (
							<Button
								onClick={handleClose}
								variant="secondary"
								size="sm"
								autoFocus
							>
								{translate("Cancel")}
							</Button>
						)}
					</DialogFooter>
				</Dialog>
			)
		)
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
				changeCurrentTab={changeCurrentTab}
			/>
			<DeleteConfirmation
				open={deleteConfirmationDialog}
				onClose={handleConfirmationClose}
				onOk={handleRemoveConfirmation}
				message="Are you sure? Do you want to delete it?"
			/>
		</React.Fragment>
	)
}

export default React.memo(ToolbarContainer)
