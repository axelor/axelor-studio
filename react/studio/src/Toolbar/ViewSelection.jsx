import React from "react"

import AxelorService from "../services/api"
import { generateCustomModelSchema, translate } from "../utils"
import { validateWidgets } from "../store/validation"
import Select from "./Select"
import { relationalFields, MODEL_TYPE, HISTORY } from "../constants"
import { getEnableAppBuilder, fetchViews, fetchCustomFields } from "./api"
import { modelSearch } from "./customModelSearch"
import { generateXpath } from "../store/xpathGenerator"
import convert from "xml-js"
import _ from "lodash"

import {
	fetchJSONFields,
	getAttrsData,
	getSchemaData,
	metaFieldFilter,
} from "../helpers/helpers"
import { getPanel } from "../fields"

const metaViewService = new AxelorService({
	model: "com.axelor.meta.db.MetaView",
})

const modelTypes = [
	{ name: translate("View"), value: MODEL_TYPE.BASE },
	{ name: translate("Custom"), value: MODEL_TYPE.CUSTOM },
]

function ViewSelection({
	model,
	update,
	modelType,
	modelField,
	startLoader,
	entityType,
	metaFieldStore,
	clearHistory,
	reset,
	selectedView,
	runIfConfirmed,
}) {
	const modelName = `com.axelor.meta.db.${
		modelType !== MODEL_TYPE.CUSTOM ? "MetaModel" : "MetaJsonModel"
	}`

	const handleModelSelect = React.useMemo(
		() =>
			runIfConfirmed(async (model) => {
				const metaModelService = new AxelorService({ model: modelName })

				if (!model) {
					if (modelType === MODEL_TYPE.CUSTOM) {
						reset((draft) => clearHistory(draft))
						return
					}
					update((draft) => {
						clearHistory(draft)
						draft.model = null
						draft.customModel = null
						draft.items = []
						draft.exView = null
						draft.view = null
						draft.widgets = null
						draft.customFieldWidgets = null
						draft.customFieldItems = []
						draft.customFields = []
						draft.modelField = null
						draft.extensionXML = null
						draft.extensionView = null
						draft.originalXML = null
						draft.selectedView = null
						draft.metaFields = []
						draft.metaFieldStore = []
						draft.extensionMoves = []
						draft.widgetErrorList = {}
						draft.customErrorList = {}
						draft.attrsList = []
						draft.highlightedOption = null
					})
					return
				}
				let data = {
					fields: ["metaFields", "packageName", "name", "fullName"],
					related: {
						metaFields: [
							"typeName",
							"label",
							"mappedBy",
							"relationship",
							"name",
							"packageName",
						],
					},
				}
				if (modelType === MODEL_TYPE.CUSTOM) {
					update((draft) => {
						draft.loader = true
					})
					data = {
						related: {
							studioMenu: ["title", "parentMenu"],
						},
					}
				}

				// update selection(model) immediately
				update((draft) => {
					draft.model = model
				})

				metaModelService.fetch(model.id, data).then((res) => {
					if (res.data) {
						const record = res.data[0]
						const { fields = [], ...rest } = record
						update((draft) => {
							clearHistory(draft)
							draft.model = model
							draft.entityType = model.entityType
							draft.widgets = null
							draft.items = []
							draft.view = null
							draft.exView = null
							draft.modelField = null
							draft.customFields = []
							draft.customFieldWidgets = null
							draft.customFieldItems = []
							draft.originalXML = null
							draft.extensionXML = null
							draft.extensionView = null
							draft.extensionMoves = []
							draft.widgetErrorList = {}
							draft.customErrorList = {}
							draft.attrsList = []
							draft.selectedView = null
							draft.editWidget = -1
							draft.editWidgetType = null
							draft.highlightedOption = null
							const _fields = (record.metaFields || []).map((f) => {
								return JSON.parse(
									JSON.stringify({
										...f,
										type:
											relationalFields[f.relationship] ||
											(f.typeName || "").toLowerCase(),
										...(f.relationship && {
											targetModel: `${f.packageName}.${f.typeName}`,
										}),
										packageName: undefined,
									})
								)
							})
							if (modelType === MODEL_TYPE.BASE) {
								draft.metaFieldStore = [..._fields]
								draft.metaFields = [..._fields]
							} else {
								fetchJSONFields(
									fields.map((f) => f.id),
									rest,
									update,
									draft
								)
								draft.customModel = record
							}
						})
					}
				})
			}),
		[update, modelName, modelType, clearHistory, reset, runIfConfirmed]
	)

	const handleViewSelect = React.useMemo(
		() =>
			runIfConfirmed(async (view) => {
				startLoader()
				if (!view) {
					update((draft) => {
						clearHistory(draft, HISTORY.WIDGET)
						draft.items = []
						draft.exView = null
						draft.view = null
						draft.widgets = null
						draft.extensionXML = null
						draft.extensionView = null
						draft.originalXML = null
						draft.loader = false
						draft.metaFields = draft.metaFieldStore
						draft.selectedView = null
						draft.extensionMoves = []
						draft.widgetErrorList = {}
						draft.attrsList = []
					})
					return
				}

				// update selection(view) immediately
				update((draft) => {
					draft.selectedView = view
				})

				const views = await fetchViews(view)
				const attrsList = await getAttrsData(model, view)
				const schema = getSchemaData(views, metaFieldStore, attrsList)
				const originalViewData = {
					operator: "and",
					criteria: [
						{
							operator: "or",
							criteria: [
								{ fieldName: "computed", operator: "=", value: false },
								{ fieldName: "computed", operator: "isNull" },
							],
						},
						{
							operator: "or",
							criteria: [
								{ fieldName: "extension", operator: "=", value: false },
								{ fieldName: "extension", operator: "isNull" },
							],
						},
						{ fieldName: "name", operator: "=", value: `${view.name}` },
					],
				}
				metaViewService.search({ data: originalViewData }).then((res) => {
					const { data = [] } = res
					if (data[0]) {
						update((draft) => {
							draft.originalXML = JSON.parse(
								convert.xml2json(data[0].xml, {
									compact: false,
									fullTagEmptyElement: false,
								})
							)
						})
					}
				})
				// fetch studio extension view
				const _viewSearch = {
					_domain: `self.xmlId = 'studio-${view.name}' and self.extension = true`,
				}
				const res = await metaViewService.search({ data: _viewSearch })
				const { data: resData = [] } = res
				const record = resData[0]
				if (record) {
					update((draft) => {
						draft.extensionView = record
						draft.extensionXML = JSON.parse(
							convert.xml2json(record.xml, {
								compact: false,
								fullTagEmptyElement: false,
							})
						)
					})
				}
				update((draft) => {
					clearHistory(draft, HISTORY.WIDGET)
					draft.attrsList = attrsList
					draft.selectedView = view
					if (views.view) {
						draft.view = { fields: draft.metaFields, view: views.view }
						draft.exView = views.view
					}
					draft.loader = false
					draft.extensionMoves = []
					draft.widgetErrorList = {}
					draft.customErrorList = {}
					if (schema) {
						draft.widgets = schema.widgets
						draft.items = schema.items
						draft.metaFields = [...(draft.metaFieldStore || [])]?.filter(
							(field) =>
								schema.fieldList.findIndex((f) => f.name === field.name) === -1
						)
						validateWidgets(draft, schema.widgets, false)
					}
					generateXpath(draft)
				})
			}, HISTORY.WIDGET),
		[update, startLoader, metaFieldStore, clearHistory, model, runIfConfirmed]
	)

	const viewFilter = React.useCallback(() => {
		let _domain = `self.type='form'`
		let _model = `${model ? model.fullName : ""}`
		_domain = `${_domain} and self.model='${_model}' and (self.computed = true OR self.name NOT IN (select meta.name from MetaView meta where meta.computed = true))`
		return {
			_domain,
			fields: [
				"name",
				"model",
				"title",
				"type",
				"extension",
				"xmlId",
				"computed",
				"xml",
			],
		}
	}, [model])

	const modelFilter = React.useCallback(() => {
		return {
			fields: ["name", "fullName", "packageName"],
		}
	}, [])

	const handleMetaField = React.useMemo(
		() =>
			runIfConfirmed((field) => {
				if (field) {
					// update selection(field) immediately
					update((draft) => {
						draft.modelField = field
					})

					fetchCustomFields(field, model).then((res) => {
						const { data = [] } = res
						const schema = generateCustomModelSchema(
							data,
							undefined,
							"",
							"customForm"
						)
						update((draft) => {
							clearHistory(draft, HISTORY.CUSTOM)
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
							draft.modelField = field
							draft.customErrorList = {}
							validateWidgets(draft, schema.widgets, true)
						})
					})
				} else {
					update((draft) => {
						clearHistory(draft, HISTORY.CUSTOM)
						draft.customFieldWidgets = null
						draft.customFieldItems = []
						draft.customFields = []
						draft.modelField = field
						draft.customErrorList = {}
					})
				}
			}, HISTORY.CUSTOM),
		[model, update, runIfConfirmed, clearHistory]
	)

	const handleMetaFieldFilter = React.useCallback(
		() => metaFieldFilter(model),
		[model]
	)

	const handleTypeSelect = React.useMemo(
		() =>
			runIfConfirmed((type) => {
				const { value } = type
				if ([MODEL_TYPE.CUSTOM, MODEL_TYPE.BASE].includes(value)) {
					getEnableAppBuilder().then((res) => {
						update((draft) => {
							draft.enableStudioApp = res
						})
					})
				}
				const updater = (draft) => {
					draft.modelType = type ? type.value : null
					draft.entityType = null
					draft.modelField = null
					draft.customFields = []
					draft.customFieldWidgets = null
					draft.customFieldItems = []
					draft.metaFieldStore = []
					draft.extensionMoves = []
					clearHistory(draft)
				}
				if (value === MODEL_TYPE.CUSTOM) {
					reset(updater)
					return
				}
				update((draft) => {
					clearHistory(draft)
					updater(draft)
					draft.model = null
					draft.customModel = null
					draft.widgets = null
					draft.items = []
					draft.view = null
					draft.exView = null
					draft.metaFields = []
					draft.metaFields = []
					draft.selectedView = null
					draft.widgetErrorList = {}
					draft.customErrorList = {}
					draft.attrsList = []
				})
			}),
		[update, reset, clearHistory, runIfConfirmed]
	)

	const handleViewFilterData = React.useCallback((list) => {
		const newList = list.filter((view) => {
			if (!view.computed) {
				const index = list.findIndex((e) => e.name === view.name && e.computed)
				if (index !== -1) {
					return false
				}
			}
			if (view.extension === true) {
				return false
			}
			return true
		})
		return newList
	}, [])

	const getOptionLabel = (option) => {
		if (option.extension === true) {
			return `${option.name} (${translate("Extension")})`
		}
		if (option.computed === true) {
			return `${option.name} (${translate("Computed")})`
		}
		return option.name
	}
	return (
		<>
			<Select
				options={modelTypes}
				value={modelTypes.find((e) => e.value === modelType) || null}
				filterSelectedOptions={true}
				label="Type"
				onChange={handleTypeSelect}
				disableClearable
			/>
			<Select
				key={modelType}
				onChange={handleModelSelect}
				label="Model"
				model={modelName}
				searchFilter={modelFilter}
				value={model || null}
				onSearch={modelSearch}
				modelType={modelType}
			/>
			{modelType === MODEL_TYPE.BASE && (
				<React.Fragment>
					<Select
						onChange={handleViewSelect}
						label="View"
						model="com.axelor.meta.db.MetaView"
						searchFilter={viewFilter}
						getOptionLabel={getOptionLabel}
						value={selectedView || null}
						filterData={handleViewFilterData}
					/>
					<Select
						label="Custom fields"
						model="com.axelor.meta.db.MetaField"
						value={modelField || null}
						searchFilter={handleMetaFieldFilter}
						onChange={(modelField) => handleMetaField(modelField)}
					/>
				</React.Fragment>
			)}
		</>
	)
}

export default React.memo(ViewSelection)
