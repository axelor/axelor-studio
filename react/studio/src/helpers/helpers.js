import AxelorService from "../services/api"
import {
  fetchAttrsList,
  fetchCustomFields,
  fetchViews,
  metaJsonFieldService,
} from "../Toolbar/api"
import { generateCustomModelSchema, generateXMLToViewSchema } from "../utils"
import { validateWidgets } from "../store/validation"

import convert from "xml-js"
import { generateXpath } from "../store/xpathGenerator"
import { MODEL_TYPE } from "../constants"
import _ from "lodash"
import { getPanel } from "../fields"

const metaViewService = new AxelorService({
  model: "com.axelor.meta.db.MetaView",
})

export const metaFieldFilter = (model) => {
  const _domain = `self.json = true and self.metaModel.id=${
    model ? model.id : -1
  }`
  return {
    _domain,
    fields: ["name"],
  }
}

export const getAttrsData = async (model, view) => {
  const data = await fetchAttrsList({
    model: model.name,
    view: view.name,
  })
  return data
}

export const getSchemaData = (views, fields, attrsList) => {
  const data = generateXMLToViewSchema({
    view: views.view,
    fields,
    extensionXML: views.extensionXML,
    attrsList,
  })
  return data
}

export const fetchJSONFields = (ids, record, update, draft) => {
  const criteria = []
  if (ids.length) {
    criteria.push({ fieldName: "id", operator: "in", value: ids })
    const data = {
      criteria,
    }
    metaJsonFieldService.search({ data, sortBy: ["sequence"] }).then((res) => {
      if (res.data) {
        const list = res.data || []
        const schema = generateCustomModelSchema(list, record)
        update((draft) => {
          draft.widgets = {
            ...schema.widgets,
          }
          draft.items = schema.items
          draft.loader = false
          validateWidgets(draft, schema.widgets, false)
        })
      } else {
        update((draft) => {
          draft.loader = false
        })
      }
    })
  } else {
    const schema = generateCustomModelSchema([], record)
    draft.widgets = {
      ...schema.widgets,
    }
    draft.items = schema.items
    draft.loader = false
    draft.model = record
    draft.customModel = record
    draft.editWidget = -1
    draft.editWidgetType = null
    validateWidgets(draft, schema.widgets, false)
  }
}

export const fetchMetaViewService = async (
  view,
  modelName,
  fields,
  model,
  update
) => {
  const viewData = {
    _domain: `self.type='form' and self.model='${modelName}' and (self.computed = true OR self.name NOT IN (select meta.name from MetaView meta where meta.computed = true))`,
  }
  const fetchFields = [
    "name",
    "model",
    "title",
    "type",
    "extension",
    "xmlId",
    "computed",
    "xml",
  ]

  const res = await metaViewService.search({
    data: viewData,
    fields: fetchFields,
  })

  const { data = [] } = res
  const viewOptions = data.filter((d) => d.name === view)
  const [selectedViewOption] = viewOptions
  update((draft) => {
    draft.selectedView = selectedViewOption
  })

  const views = await fetchViews(selectedViewOption)

  if (views) {
    const attrsList = await getAttrsData(model, { name: view })
    const schema = getSchemaData(views, fields, attrsList)
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
        { fieldName: "name", operator: "=", value: `${view}` },
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
      _domain: `self.xmlId = 'studio-${view}' and self.extension = true`,
    }
    metaViewService
      .search({ data: _viewSearch })
      .then((res) => {
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
      })
      .catch((err) => {
        throw err
      })

    update((draft) => {
      draft.attrsList = attrsList
      draft.selectedView = selectedViewOption
      if (views.view) {
        draft.view = { fields: draft.metaFields, view: views.view }
        draft.exView = views.view
      }
      draft.customFields = []
      draft.customFieldWidgets = null
      draft.customFieldItems = []
      draft.modelField = null
      draft.loader = false
      draft.extensionMoves = []
      draft.widgetErrorList = {}
      draft.customErrorList = {}
      if (schema) {
        draft.widgets = schema.widgets
        draft.items = schema.items
        draft.metaFields = [...draft.metaFieldStore].filter(
          (field) =>
            schema.fieldList.findIndex((f) => f.name === field.name) === -1
        )
        validateWidgets(draft, schema.widgets, false)
      }
      generateXpath(draft)
    })
  } else {
    update((draft) => {
      draft.loader = false
    })
  }
}

export const handleMetaFieldSelect = (field, model, update) => {
  if (field) {
    fetchCustomFields(field, model).then((res) => {
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
        draft.modelField = field
        draft.customFieldHasChanges = false
        validateWidgets(draft, schema.widgets, true)
      })
    })
  } else {
    update((draft) => {
      draft.customFieldWidgets = null
      draft.customFieldItems = []
      draft.customFields = []
      draft.modelField = field
      draft.customFieldHasChanges = false
    })
  }
}

export const getCustomFieldsData = (model, customField, update) => {
  const payload = metaFieldFilter(model)
  const service = new AxelorService({
    model: "com.axelor.meta.db.MetaField",
  })
  const data = {
    ...(payload._domain && { _domain: payload._domain }),
    ...(payload._domainContext && {
      _domainContext: payload._domainContext,
    }),
    criteria: [...(payload.criteria || [])],
    operator: "and",
  }
  const fields = payload.fields || []
  service.search({ fields, data }).then((response = {}) => {
    const { data = [] } = response
    if (response && response.data) {
      const field = data.find((d) => d.name === customField)
      handleMetaFieldSelect(field, model, update)
    }
  })
}
