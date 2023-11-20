import _, { camelCase } from "lodash"
import { original } from "immer"
import {
  TYPE,
  FIELD_TYPE,
  PANEL_TYPE,
  IDS,
  MODEL_TYPE,
  DEFAULT_VALUE,
  typeReplacer as TYPE_REPLACER,
  relationalFields,
} from "./constants"
import { getFields } from "./fields"
import convert from "xml-js"
import { validateWidget } from "./store/validation"
import format from "xml-beautifier"
import dasherize from "dasherize"

export function camleCaseString(word) {
  let string =
    word &&
    word.replace(/([A-Z])/g, " $1").replace(/^./, function (str) {
      return str.toUpperCase()
    })
  return string
}

export const caseConverter = (value, isCamelCase = true) => {
  if (!value) return
  value = value.trim()
  let convertedText
  if (isCamelCase) {
    convertedText = camelCase(value)
  } else {
    let textToConvert = camelCase(value)
    convertedText = textToConvert[0].toUpperCase() + textToConvert.slice(1)
  }
  return convertedText
}

export const capitalizeFirst = (value) => {
  let result = value.replace(/([A-Z])/g, " $1")
  let finalResult =
    result && result.charAt(0).toUpperCase() + result.slice(1).toLowerCase()
  return finalResult
}

export function translate(str) {
  if (window && window.top && window.top._t && typeof str === "string") {
    return window.top._t(str)
  }
  return str
}

const getSpacer = ({ widget, id, ...other }) => ({
  colSpan: widget.colSpan || 1,
  serverType: FIELD_TYPE.spacer,
  type: TYPE.field,
  name: `spacer${id}`,
  title: "Spacer",
  ...other,
})

export function isWidgetOfType(widget, type) {
  if (type === TYPE.panel)
    return widget?.type === type && widget?.serverType !== TYPE.tabs
  return widget?.type === type || widget?.serverType === type
}

export function isMaxWidget(widget) {
  if (
    [relationalFields.ManyToMany, "json-many-to-many"].some((type) =>
      isWidgetOfType(widget, type)
    )
  ) {
    return widget?.widget !== "TagSelect"
  }
  return [
    FIELD_TYPE.separator,
    TYPE.tabs,
    TYPE.panel,
    relationalFields.OneToMany,
    "json-one-to-many",
  ].some((type) => isWidgetOfType(widget, type))
}
export const isWidgetSpacer = (widget) =>
  isWidgetOfType(widget, FIELD_TYPE.spacer)

export const arrangeGrid = (state, { id, index, panelId }, widgetType) => {
  const isCustomField = widgetType === "customField"
  const widgets = isCustomField ? state.customFieldWidgets : state.widgets
  const panel = widgets[panelId]
  const removeWidget = widgets[id] || { colSpan: 1 }
  const isLastItemRemove = panel.items[panel.items.length - 1] === id
  let ids = []

  // remove widget from items array
  panel.items.splice(index, 1)

  // Delete all spacers at the end of panel
  if (isLastItemRemove) {
    while (isLastItemSpacer(panel.items)) {
      ids.push(panel.items.pop())
    }
  }
  // generate replacement spacer
  if (!isWidgetSpacer(widgets[id]) && !isLastItemRemove) {
    let newId = _.uniqueId()
    let otherProps = {}
    if (state.modelType === MODEL_TYPE.CUSTOM) {
      otherProps = {
        model: removeWidget.model,
        modelField: removeWidget.modelField,
      }
    }
    //creating spacer for the removed widget
    widgets[newId] = getSpacer({
      widget: {},
      id: newId,
      colSpan: removeWidget.colSpan,
      ...getWidgetAttrs(),
      ...otherProps,
    })
    panel.items.splice(index, 0, newId)
  }
  return [...ids, id]

  function isLastItemSpacer(items) {
    if (!items || !items.length) return false
    const lastItem = items[items.length - 1]
    const lastWidget = widgets[lastItem]
    return isWidgetSpacer(lastWidget)
  }

  function getWidgetAttrs() {
    // if removed widget has colSpan in its widgetAttrs, copy it to the spacer
    if (removeWidget.widgetAttrs?.colSpan)
      return {
        widgetAttrs: {
          colSpan: removeWidget.widgetAttrs?.colSpan,
        },
      }
    // make spacer occupy 12 colSpan for maxWidgets
    if (!isSidebarPanel(panel) && isMaxWidget(removeWidget)) {
      return { widgetAttrs: { colSpan: 12 } }
    }
    return {}
  }
}

// generates widgets(spacers)
const collectWidgets = ({
  grid,
  items,
  widgetIndex,
  widgetId,
  currentRowIndex,
}) => {
  let beforeWidgets = []
  let afterWidgets = []
  let flag = true
  const prevRowIndex = currentRowIndex - 1
  const nextRowIndex = currentRowIndex + 1
  grid.forEach((cell, cellIndex) => {
    if (
      !cell.separator &&
      cell.rowIndex >= prevRowIndex && // consider only for prevRow, currentRow, nextRow
      cell.rowIndex <= nextRowIndex
    ) {
      const cellColSpan = Number(cell.colSpan || 1)
      if (cell.rowIndex <= currentRowIndex) {
        // if current row or prev row
        if (cellIndex < widgetIndex) {
          if (cell.id) {
            beforeWidgets = []
          } else {
            beforeWidgets.push({
              ...cell,
              colSpan: cellColSpan || 6,
              isSpacer: true,
            })
          }
        }
      }
      if (flag) {
        if (cell.rowIndex === currentRowIndex && cellIndex > widgetIndex) {
          // if current row and after dropped widget
          if (cell.id) {
            flag = false
          } else if (items.length) {
            afterWidgets.push({ ...cell, isSpacer: true })
          }
        }
      }
    }
  })
  // TODO: try to not generate after/before widgets in the above forEach loop, instead of clearing them later
  if (items.length) {
    // find last item index
    let lastItem = items[items.length - 1]
    if (lastItem === widgetId) {
      //if lastItem is dragged Item , then consider previous item as last
      lastItem = items[items.length - 2]
    }
    if (lastItem) {
      const lastItemIndex = grid.findIndex((x) => `${x.id}` === `${lastItem}`)
      // if droped at the end of list, afterWidgets are not needed.
      if (widgetIndex > lastItemIndex && lastItemIndex !== -1) {
        afterWidgets = []
      }
    } else {
      //when ther is no lastItem, afterWidgets are not neeeded.
      afterWidgets = []
    }
  }
  // clear beforeWidgets that occupy the entire row (when widget is dropped into the first cell/separator of a row)
  if (beforeWidgets.length) {
    const _beforeWidgets = [...beforeWidgets]
    _beforeWidgets.forEach((widget, index, widgets) => {
      if (
        widgets.findIndex((el) => widget.rowIndex === el.rowIndex) === index
      ) {
        const totalColSpan = widgets.reduce(
          (acc, el) =>
            el.rowIndex === widget.rowIndex ? acc + el.colSpan : acc,
          0
        )
        if (totalColSpan >= 12) {
          beforeWidgets = _beforeWidgets.filter(
            (el) => el.rowIndex !== widget.rowIndex
          )
        }
      }
    })
  }
  return { afterWidgets, beforeWidgets }
}

export function isExtensionView(state) {
  return state.exView && !isCreatedFromStudio(state.exView)
}

const getItemInsertionIndex = (dragWidget, hoverWidget, items) => {
  let dropIndex = Number(hoverWidget.index)

  // Handle horizontal cell placement for tabs
  if (hoverWidget.meta.horizontal) {
    if (
      dragWidget.panelId === hoverWidget.panelId &&
      dragWidget.index < hoverWidget.index // Since layout doesn't change in tabs, using dragWidget.index is safe
    ) {
      // If tab is moved forward
      dropIndex = dropIndex - 2
    }
    return Math.ceil(dropIndex / 2)
  }

  let grid = hoverWidget.meta.grid || []

  // Find the previous widget that is not a dumpField, use its index to determine insertion index.
  while (dropIndex > 0) {
    const previousWidgetId = grid[dropIndex].id

    if (previousWidgetId !== IDS.dumpField) {
      if (previousWidgetId === dragWidget.id) {
        // DragWidget will not be present in the modified items array, since it has already been removed.
        const originalIndex = original(items).indexOf(previousWidgetId)
        // If original and modified items have same length , we assume spacer has replaced dragWidget
        const hasReplacementSpacerGenerated =
          items.length === original(items).length

        return hasReplacementSpacerGenerated ? originalIndex + 1 : originalIndex
      }
      return items.indexOf(previousWidgetId) + 1
    }
    dropIndex--
  }
  /**
   * Handles a special case for sidePanel where the grid doesn't contain all the widgets in the items array.
   */
  if (hoverWidget.panelType === "sidePanel") {
    const firstSidePanelId = grid.find((item) => item.id !== IDS.dumpField)?.id
    if (firstSidePanelId) {
      // Insert at the firstSidePanel
      return items.indexOf(firstSidePanelId)
    } else {
      // Insert at the end of items
      return items.length
    }
  }

  // When there is no previous widget, insert at the beginning
  return 0
}

// reorder widgets based on dummy widgets
export const reorderGrid = (hoverWidget, dragWidget) => (draft) => {
  const isCustomField = hoverWidget._type === "customField"
  const dragWidgetItems =
    hoverWidget._type === "customField" && !dragWidget.panelId
      ? "customFieldItems"
      : "items"
  const _items =
    hoverWidget._type === "customField" && !hoverWidget.panelId
      ? "customFieldItems"
      : "items"
  const _widgets =
    hoverWidget._type === "customField"
      ? draft.customFieldWidgets
      : draft.widgets
  const destinationItems = (
    (hoverWidget.panelId ? _widgets[hoverWidget.panelId] : draft)[_items] || []
  ).slice()

  const { grid = [], row: hoverCellRowIndex } = hoverWidget.meta

  const isNew =
    !dragWidget.id ||
    Object.values(IDS.createWidgets).indexOf(dragWidget.id) > -1

  // generate UniqueId for new widget, else keep the old id
  const widgetId = isNew ? _.uniqueId() : dragWidget.id
  /*
      If layout changes while the element is being dragged, then dragWidget.index will be outdated,
      rely on dragWidgetIndex for grid layouts
    */
  const dragWidgetIndex =
    grid.find((item) => item.id === dragWidget.id)?.cellIndice ??
    dragWidget.index

  const dragAttrs = { ...dragWidget.attrs }
  const dragWidgetAttrs = { ...(dragAttrs.widgetAttrs || {}) }

  const parentPanel = _widgets[hoverWidget.panelId]

  //  when panel is dragged
  if (dragAttrs.type === TYPE.panel) {
    //dropping into sidePanel
    if (hoverWidget.panelType === "sidePanel") {
      dragWidgetAttrs.sidebar = "true"
      delete dragWidgetAttrs.tab
    }
    // dropping into mainPanel
    if (hoverWidget.panelType === "mainPanel") {
      delete dragWidgetAttrs.sidebar
      delete dragWidgetAttrs.tab
    }
    // Handle dropping into tabs-panel
    if (parentPanel && parentPanel.type === TYPE.tabs) {
      dragAttrs.title = dragAttrs.title || translate("Tab")

      dragWidgetAttrs.tab = "true"
      delete dragWidgetAttrs.sidebar
    }
  }

  let widgetIndex = Number(hoverWidget.index)
  let {
    beforeWidgets, //holds spacers to be added before the dropped widget
    afterWidgets, // holds spacers to be added after the dropped widget
  } = collectWidgets({
    grid,
    items: destinationItems,
    widgetIndex,
    widgetId: dragWidget.id,
    currentRowIndex: hoverCellRowIndex,
  })

  // if drag widget is existing one then remove it from its panel
  if (dragWidget.id && _widgets[dragWidget.id]) {
    const sourcePanel = dragWidget.panelId
      ? _widgets[dragWidget.panelId]
      : draft
    const sourceItems = sourcePanel[dragWidgetItems]
    const sourceItemIndex = sourceItems.indexOf(dragWidget.id)

    if ([PANEL_TYPE.grid].includes(sourcePanel.layout)) {
      let newId = _.uniqueId()
      const isLastItem = sourceItems[sourceItems.length - 1] === dragWidget.id
      let isLastItemInSamePanel = false // true if last widget is dropped after itself in the same panel
      if (isLastItem && dragWidget.panelId === hoverWidget.panelId) {
        if (dragWidgetIndex < hoverWidget.index) {
          isLastItemInSamePanel = true
        }
      }
      const hoverParent = dragWidget.panelId
        ? _widgets[dragWidget.panelId]
        : null
      let isPanelTab = false
      if (
        hoverParent &&
        [TYPE.tabs, TYPE.panelStack].includes(hoverParent.type)
      ) {
        isPanelTab = true
      }
      if ((isLastItem && !isLastItemInSamePanel) || isPanelTab) {
        sourceItems.splice(sourceItemIndex, 1)

        const isLastItemRemovable = (items) => {
          if (!items || !items.length) return false

          const lastItem = items[items.length - 1]
          if (lastItem === hoverWidget.id) return false //Do not remove hover spacer

          const lastWidget = _widgets[lastItem]
          if (!isWidgetSpacer(lastWidget)) return false // Do not remove non spacer widgets

          if (dragWidget.panelId === hoverWidget.panelId) {
            let lastItemMetaGrid
            try {
              lastItemMetaGrid = hoverWidget?.meta?.grid?.findLast(
                (cell) => cell.id === lastItem
              )
            } catch {
              // TODO: remove later.
              // for older browsers
              lastItemMetaGrid = hoverWidget?.meta?.grid?.find(
                (cell) => cell.id === lastItem
              )
            }

            if (lastItemMetaGrid) {
              if (lastItemMetaGrid.rowIndex < hoverWidget.meta.row) {
                return false //Do not remove widgets above hoverWidget
              }
              if (
                lastItemMetaGrid.rowIndex === hoverWidget.meta.row &&
                lastItemMetaGrid.columnIndex < hoverWidget.meta.colIndex
              ) {
                return false // Do not remove widgets before hoverWidget in the same row
              }
            }
          }
          return true
        }

        //remove all spacers at the end of panel
        while (isLastItemRemovable(sourcePanel.items)) {
          const id = sourcePanel.items.pop()
          if (_widgets[id].id && typeof _widgets[id].id !== "symbol") {
            draft.removedCustomFields.push({
              id: _widgets[id].id,
              version: _widgets[id].version,
            })
          }
          delete _widgets[id]
        }
        // remove afterWidgets that are after the last removed spacer
        if (dragWidget.panelId === hoverWidget.panelId) {
          if (!sourcePanel.items.length) {
            afterWidgets = []
          } else {
            const lastWidgetId = sourcePanel.items[sourcePanel.items.length - 1]
            const lastWidgetCellIndice = hoverWidget.meta?.grid?.find(
              (cell) => cell.id === lastWidgetId
            )?.cellIndice
            afterWidgets = afterWidgets.filter(
              (widget) => widget.cellIndice < lastWidgetCellIndice
            )
          }
        }
      } else {
        let attrs = {
          colSpan: _widgets[dragWidget.id].colSpan || 1,
          serverType: FIELD_TYPE.spacer,
          type: TYPE.field, // check later if this can be changed to spacer
          name: `spacer${newId}`,
          title: "Spacer",
        }
        if (draft.modelType === MODEL_TYPE.CUSTOM) {
          attrs.model = dragAttrs.model
          attrs.modelField = dragAttrs.modelField
        }
        if (dragWidgetAttrs.colSpan) {
          attrs.widgetAttrs = {
            //copy the dragged widget's colspan to the spacer
            colSpan: dragWidgetAttrs.colSpan,
          }
        } else if (!isSidebarPanel(sourcePanel) && isMaxWidget(dragAttrs)) {
          attrs.widgetAttrs = {
            /*
               since default colspan for maxWidget is 12 and for spacer is itemSpan,
               so make spacers colspan as 12, to avoid  shifting widgets
               */
            colSpan: 12,
          }
        }
        _widgets[newId] = Object.assign({}, attrs)
        sourceItems.splice(sourceItemIndex, 1, newId)
      }
    } else {
      sourceItems.splice(sourceItemIndex, 1)
    }
  }

  // if widget is dropped on the spacer
  if (isWidgetSpacer(hoverWidget.attrs)) {
    const spacerWidgetAttrsColSpan = hoverWidget.attrs.widgetAttrs?.colSpan

    const parentPanelWidgetAttrs = _widgets[hoverWidget.panelId]?.widgetAttrs
    const parentPanelItemSpan = parentPanelWidgetAttrs?.itemSpan
    const isParentPanelSidebar = parentPanelWidgetAttrs?.sidebar
    // make dragged widget fit into the spacer by modifying colSpan
    dragWidgetAttrs.colSpan = getColSpan()
    if (dragWidgetAttrs.colSpan === undefined) delete dragWidgetAttrs.colSpan
    // add spacer to the delete list if spacer is already saved
    if (hoverWidget.attrs?.id && typeof hoverWidget.attrs?.id !== "symbol") {
      draft.removedCustomFields.push({
        id: hoverWidget.attrs.id,
        version: hoverWidget.attrs.version,
      })
    }
    /* reset colSpan to default(6) to make it fit into spacer when both
       ItemSpan & widgetAttr colspan doesn't exist */
    if (!parentPanelItemSpan && !spacerWidgetAttrsColSpan) {
      dragAttrs.colSpan = 6
    }

    // Add modified widgetAttrs to dragWidget
    dragAttrs.widgetAttrs = dragWidgetAttrs

    if (isNew && dragAttrs.name) {
      dragAttrs.name = `${dragAttrs.name}${widgetId}`
    }

    if (isNew) {
      _widgets[widgetId] = dragAttrs
    } else {
      _widgets[dragWidget.id] = { ..._widgets[dragWidget.id], ...dragAttrs }
    }

    // remove the spacer from the _items array and add the draggedWidget
    ;(hoverWidget.panelId ? _widgets[hoverWidget.panelId] : draft)[
      _items
    ].splice(destinationItems.indexOf(hoverWidget.id), 1, widgetId)

    //delete the spacer from the widgets
    delete _widgets[hoverWidget.id]
    validateWidget(draft, widgetId, isCustomField)
    return widgetId

    function getColSpan() {
      if (isMaxWidget(dragAttrs)) {
        if (spacerWidgetAttrsColSpan) {
          // if spacer has colSpan of 12 then clear colSpan since maxWidgets occupies 12 by default
          return spacerWidgetAttrsColSpan === 12
            ? undefined
            : spacerWidgetAttrsColSpan
        }
        if (parentPanelItemSpan) {
          /*
            when spacer doesn't have colSpan , it occupies parentPanelItemSpan, however maxWidgets ignores it,
            so, make its colspan as parentPanelItemSpan,
           */
          return parentPanelItemSpan
        }
        if (isParentPanelSidebar) {
          // default itemSpan of sidebar and default colSpan of maxWidgets are both 12, so don't set colSpan
          return undefined
        }
        // force colspan to 6 when dropped into spacer.
        return 6
      }
      // for all other widgets, copy spacers colSpan
      return spacerWidgetAttrsColSpan
    }
  }

  // remove all dummy cells for flow layout
  const destinationPanel = hoverWidget.panelId
    ? _widgets[hoverWidget.panelId]
    : draft
  if ((destinationPanel.layout || PANEL_TYPE.flow) === PANEL_TYPE.flow) {
    beforeWidgets = []
    afterWidgets = []
  }

  // Add modified widgetAttrs to dragWidget
  dragAttrs.widgetAttrs = dragWidgetAttrs

  const newIds = []
  // fill all widgets in panel
  beforeWidgets
    .concat([{ ...dragWidget, attrs: dragAttrs }])
    .concat(afterWidgets)
    .forEach((widget) => {
      let attrs = Object.assign({}, widget.attrs || {})
      let newId = widget.id
      const isCreateWidget =
        Object.values(IDS.createWidgets).indexOf(widget.id) > -1
      const isNew = !newId || isCreateWidget
      // new drag widgets
      if (isNew) {
        newId = isCreateWidget ? widgetId : _.uniqueId()
        if (attrs.name) {
          attrs.name = `${attrs.name}${newId}`
        }
      }
      if (widget.isSpacer) {
        // if its spacer widgets
        const _attrs = dragAttrs || {}
        const parentPanelItemSpan =
          _widgets[hoverWidget.panelId]?.widgetAttrs?.itemSpan

        const getWidgetAttrs = () => {
          const defaultItemSpan = hoverWidget.meta.isSideBarWidget ? 12 : 6
          // if spacer's colspan is not the same as itemSpan , add it in widgetAttrs.
          if (
            Number(parentPanelItemSpan || defaultItemSpan) !==
            Number(widget.colSpan)
          ) {
            return {
              widgetAttrs: {
                colSpan: widget.colSpan,
              },
            }
          }
        }

        attrs = getSpacer({
          widget,
          id: newId,
          model: _attrs.model,
          modelField: _attrs.modelField,
          ...getWidgetAttrs(),
        })
      }
      // add new widget
      if (isNew) {
        _widgets[newId] = Object.assign({}, attrs)
      } else {
        _widgets[dragWidget.id] = Object.assign(
          { ..._widgets[dragWidget.id] },
          attrs
        )
      }
      newIds.push(newId)
    })
  // put all new widgets into panel
  const panelItems =
    (hoverWidget.panelId ? _widgets[hoverWidget.panelId] : draft)[_items] || []

  panelItems.splice(
    getItemInsertionIndex(dragWidget, hoverWidget, panelItems),
    0,
    ...newIds
  )
  newIds.forEach((id) => validateWidget(draft, id, isCustomField))
  return widgetId
}

export const getWidgetType = (widgetAttrs, defaultType) => {
  const uiFields = ["spacer", "label", "button"]
  let _type =
    widgetAttrs.isModelField || widgetAttrs.serverType === "field"
      ? "field"
      : widgetAttrs.type
      ? widgetAttrs.type.toLowerCase()
      : defaultType
  _type = uiFields.includes(widgetAttrs.serverType)
    ? widgetAttrs.serverType
    : _type
  return _type
}

const getTarget = (fieldTarget, itemTarget) => {
  return fieldTarget || itemTarget
}

export const isPanelTab = (field) => {
  const { type, widgetAttrs } = field
  if (type === TYPE.panel && widgetAttrs) {
    if (widgetAttrs.tab === "true") {
      return true
    }
  }
  return false
}

// TODO : this is outdated, check later.
const getColSpan = (widget) => {
  const defaultColspan = widget.type === TYPE.panel ? 12 : 6
  return widget.widgetAttrs?.colSpan || defaultColspan
}

const getCols = (widget) => {
  if ([TYPE.panel, TYPE.tabs].includes(widget.type)) {
    return { cols: 12 }
  }
  return {}
}

export const getMenuBuilder = (studioMenu) => {
  if (studioMenu) {
    return {
      menuBuilderTitle: studioMenu.title,
      menuBuilderParent: studioMenu.parentMenu,
    }
  }
  return {}
}

export const generateCustomModelSchema = (
  fields = [],
  record,
  typeLateral = "",
  formType = "form",
  currentTabIndex
) => {
  let flag = false
  const _widgets = {}
  const formItems = []
  const tabItems = []
  let _panelId
  fields &&
    fields.length &&
    fields.forEach((f) => {
      // Convert widgetAttrs from JSON string to object
      f.widgetAttrs = JSON.parse(f.widgetAttrs || "{}")
      const _ID = _.uniqueId()
      const isTab = isPanelTab(f)
      if ([TYPE.panel, TYPE.tabs].includes(f.type)) {
        flag = true
        _panelId = _ID
        f["items"] = []
        f["layout"] = "grid"
      } else if (!flag) {
        const _item = _widgets[_panelId]
        if (_item) {
          _item.items.push(_ID)
          _widgets[_panelId] = {
            ..._widgets[_panelId],
            items: [..._item.items],
          }
        } else {
          flag = true
        }
      }
      if (flag) {
        flag = false
        if (isTab) {
          tabItems.push(_ID)
        } else {
          formItems.push(_ID)
        }
      }
      if (f.selectionText && f.selectionText.length) {
        f.updateSelection = true
      }
      _widgets[_ID] = {
        ...f,
        colSpan: getColSpan(f),
        ...getCols(f),
        type: `${f.type}${typeLateral}`,
      }
    })
  // add tab panel if tabItems has length
  if (tabItems.length) {
    const _ID = _.uniqueId()
    const field = {
      items: [...tabItems],
      type: TYPE.tabs,
      title: translate("Tab panel"),
      ...(currentTabIndex ? { current: tabItems[currentTabIndex] } : {}),
    }
    formItems.push(_ID)
    _widgets[_ID] = { ...field }
  }
  const form = formType === "customForm" ? IDS.customForm : IDS.form
  const schema = {
    widgets: {
      [form]: {
        type: formType,
        cols: 12,
        ...record,
        ...getMenuBuilder(record ? record.studioMenu : undefined),
      },
      [IDS.dumpField]: {
        type: TYPE.dumpField,
        name: "",
      },
      ..._widgets,
    },
    items: [...formItems],
  }
  return schema
}

export function processXML(xmlString, indent) {
  return format(xmlString)
}

export const replacer = (key, modelType) => {
  const camelToDash = ["formView", "gridView", "minSize", "maxSize"]
  const xField = ["bind"]
  if (modelType === MODEL_TYPE.BASE) {
    const keyReplacer = {
      targetModel: "target",
      minSize: "min",
      maxSize: "max",
    }
    key = keyReplacer[key] || key
    if (camelToDash.includes(key)) {
      key = camelToDashCase(key)
    }
    if (xField.includes(key)) {
      key = `x-${camelToDashCase(key)}`
    }
  }
  return key
}

const editorKeyReplacer = (key, modelType) => {
  const keyReplacer = {
    targetModel: "target",
    minSize: "min",
    maxSize: "max",
  }
  if (modelType === MODEL_TYPE.BASE) {
    const _keyIndex = Object.values(keyReplacer).findIndex((v) => v === key)
    if (_keyIndex !== -1) {
      key = Object.keys(keyReplacer)[_keyIndex]
    }
  }
  return key
}

//this is similar to isDummyWidget , to be checked later for removal
function isDummyField(widget) {
  const modelTypes = []
  getFields()
    .filter((fields) => ["Fields", "Relational fields"].includes(fields.name))
    .forEach((f) => {
      const { value = [] } = f
      const types = value.map((v) => v.serverType)
      modelTypes.push(...types)
    })
  return widget.serverType === "field" && modelTypes.includes(widget.type)
}

export function valueConverter(value, key) {
  const ltKeys = ["title", "text"]
  if (value && ltKeys.includes(key)) {
    value = value.replace(/</g, "&lt;")
  }
  return value
}

export const getWidgetAttrs = (attrs, exempt = [], modelType) => {
  const widgetAttrs = {}
  const exemptedAttrs = [
    "version",
    "type",
    "typeName",
    "label",
    "items",
    "serverType",
    "layout",
    "cols",
    "isModelField",
    "relationship",
    "current",
    "autoTitle",
    "metaModel",
    "targetSearch",
    "editorType",
    "studioApp",
    ...exempt,
  ]
  if (attrs.serverType !== "field") {
    exemptedAttrs.push("targetModel", "targetName", "target")
  }
  Object.keys(attrs).forEach((key) => {
    if (!exemptedAttrs.includes(key) && attrs[key] !== "") {
      let flag = true
      if (modelType === MODEL_TYPE.BASE && isDefaultValue(key, attrs[key])) {
        flag = false
      }
      if (flag) {
        if (key === "dummyType") {
          widgetAttrs["type"] = attrs[key]
        } else {
          widgetAttrs[replacer(key, modelType)] = valueConverter(
            attrs[key],
            key
          )
        }
      }
    }
  })
  // check for dummy model field
  if (attrs.type === TYPE.panelInclude) {
    if (typeof attrs.view === "object") {
      widgetAttrs.view = attrs.view.name
    }
  }
  if (attrs.isModelField || isDummyField(attrs)) {
    widgetAttrs["type"] = attrs.type
  }
  if (attrs.type === TYPE.panelRelated) {
    widgetAttrs["name"] = attrs.field
  }
  if (widgetAttrs.name) {
    // change array field index
    const squareIndex = widgetAttrs.name.indexOf("[")
    if (squareIndex !== -1) {
      widgetAttrs.name = widgetAttrs.name.substring(0, squareIndex)
    }
  }
  return widgetAttrs
}

const getCustomWidget = (widget, exempt = []) => {
  const _widget = {}
  const exemptedAttrs = [
    "image",
    "serverType",
    "isModelField",
    "current",
    ...exempt,
  ]
  Object.keys(widget).forEach((key) => {
    if (!exemptedAttrs.includes(key)) {
      if (key === "type" && ["item", "field"].includes(widget[key])) {
        _widget[key] = widget["serverType"]
      } else {
        _widget[key] = widget[key] === "" ? null : widget[key]
      }
    }
  })
  return _widget
}

export const getCustomModelFields = (
  items = [],
  widgets,
  additionalProps = {},
  countSequence = false,
  sequence = 0
) => {
  const fields = []
  items.forEach((item) => {
    if (widgets[item]) {
      let _widget = { ...widgets[item] }
      const exempt = []
      if (!["dump_field", "form"].includes(_widget.type)) {
        if (_widget.type !== TYPE.tabs) {
          if (typeof _widget.id === "symbol") {
            delete _widget.id
          }
          if (_widget.showTitle !== "false") {
            delete _widget.showTitle
          }
          // stringify the widgetAttrs before sending it to the server
          if (_widget.widgetAttrs) {
            _widget.widgetAttrs = JSON.stringify(_widget.widgetAttrs)
          }
          if (countSequence) {
            _widget.sequence = sequence
            sequence++
          }
          if (_widget.serverType === "spacer") {
            exempt.push("title")
          }
          fields.push({
            ...getCustomWidget(_widget, exempt),
            ...additionalProps,
          })
        }
        if (_widget.items && _widget.items.length) {
          const modelFields = getCustomModelFields(
            _widget.items,
            widgets,
            additionalProps,
            countSequence,
            sequence
          )
          fields.push(...modelFields.fields)
          sequence = modelFields.sequence
        }
      }
    }
  })
  return { fields, sequence }
}

export const isCreatedFromStudio = ({ xmlId = null, extension }) => {
  if (xmlId && !extension) {
    const index = xmlId.indexOf("studio-")
    if (index === 0) {
      return true
    }
  }
  return false
}

export const getFormProperties = (form, exempt = []) => {
  const except = ["type", "cols", "items", ...exempt]
  const properties = {}
  Object.keys(form).forEach((key) => {
    if (!except.includes(key)) {
      properties[key] =
        form[key] === ""
          ? null
          : key === "widgetAttrs"
          ? JSON.stringify(form[key] || {}) // convert widgetAttrs to JSON string before sending it to server
          : form[key]
    }
  })
  return properties
}

/**
 * Checks whether value is same as default value or not
 * for given property name.
 * Returns boolean true/false
 * @param {string} name
 * @param {string} value
 */
const isAttrHasDefaultValue = (name, value) => {
  const defaultValue = DEFAULT_VALUE[name]
  if (defaultValue !== undefined && `${defaultValue}` === `${value}`) {
    return true
  }
  return false
}

export const getProperty = (
  name,
  value,
  parentField,
  parentValue,
  shouldCheckParent = true
) => {
  const obj = { [name]: value }
  if (shouldCheckParent) {
    const _value = { ...parentValue }
    if (parentField && ![undefined, "", null].includes(value)) {
      // check for default value
      if (isAttrHasDefaultValue(name, value)) {
        delete _value[name]
        return { [parentField]: _value }
      }
      _value[name] = value
      return { [parentField]: _value }
    } else if (parentField && !value) {
      delete _value[name]
      return { [parentField]: _value }
    }
  }
  if (name === "showTitle" && value === true) {
    return { showTitle: undefined }
  }
  return obj
}

export const getPropertyValue = (
  list,
  name,
  parentField,
  defaultValue,
  shouldCheckParent = true
) => {
  if (shouldCheckParent && parentField) {
    if (list[parentField]) {
      const field = list[parentField]
      return [undefined, null].includes(field[name])
        ? defaultValue
        : field[name]
    }
    return defaultValue || null
  }
  return [undefined, null].includes(list[name]) ? defaultValue : list[name]
}

export const getDefaultProperties = (modelType) => {
  switch (modelType) {
    case MODEL_TYPE.CUSTOM:
      return { formWidth: "large" }
    case MODEL_TYPE.BASE: {
      return { width: "large" }
    }
    default:
      return {}
  }
}

const camelToDashCase = (string, caseString = "-") => {
  return string.replace(/[A-Z]/g, (m) => caseString + m.toLowerCase())
}

export const dashToCamelCase = (string) => {
  return string.replace(/-([a-z])/g, function (g) {
    return g[1].toUpperCase()
  })
}

export const isDefaultValue = (field, value) => {
  const fieldValue = DEFAULT_VALUE[field]
  if ([true, false].includes(fieldValue) && `${value}` === `${fieldValue}`) {
    return true
  }
  return false
}

export const exploreTarget = (target, which = 3) => {
  // 2 for parent check and 3 for itself/child element check
  const targetSplit = target.split("/")
  const length = targetSplit.length
  let parent = length > 3 ? targetSplit[length - 2] : targetSplit[length - 1]
  let self = length > 3 ? targetSplit[length - 1] : undefined
  return { parent, self }
}

export const getViews = (list, viewName) => {
  let view = list.find((v) => v.computed === true)
  let originalXML = list.find(
    (v) => v.computed !== true && v.extension !== true
  )
  const extensionXML = list.find(
    (v) => v.extension === true && v.xmlId === `studio-${viewName}`
  )
  return {
    view: view || originalXML,
    originalXML,
    extensionXML,
  }
}

const getElementTypes = (name, field, _type) => {
  let serverType
  let type
  if (field) {
    serverType = field.type.toLowerCase()
    type = name
  } else {
    serverType = name
    type = _type ? _type : name === "field" ? undefined : name // if element is field then set default type string
  }
  return {
    serverType: TYPE_REPLACER[serverType] || serverType,
    type: TYPE_REPLACER[type] || type,
  }
}

const getTitle = (attributes, field) => {
  if (attributes.title) {
    return { title: attributes.title }
  }
  if (field?.label) {
    return { autoTitle: field.label }
  }
  if (attributes.name) {
    return { autoTitle: camelToDashCase(attributes.name, " ") }
  }
  return {}
}

export const generateViewFromJson = ({
  view,
  fields,
  original,
  extensionXML,
  attrsList,
}) => {
  const { elements } = view

  const getElementName = (attributes, parent, itemList, elementType) => {
    const nameObj = { name: attributes.name }
    return nameObj
  }

  const getElementToWidget = (element, fields, parent, itemList) => {
    let widget = {}
    let field
    if (element) {
      const { type, ...attributes } = element.attributes || {}
      if (element.name.indexOf("panel") === -1) {
        field = fields?.find((f) => f.name === attributes.name)
      }
      const attrs = {}
      Object.keys(attributes).map((key) => {
        let _key = key
        if (key.indexOf("x-") === 0) {
          _key = key.substring(2)
        }
        attrs[editorKeyReplacer(dashToCamelCase(_key), MODEL_TYPE.BASE)] =
          attributes[key]
        return undefined
      })
      const targetModel = getTarget(
        field?.target || field?.targetModel,
        attributes.target
      )
      widget = {
        ...attrs,
        colSpan: Number(attributes.colSpan || 6),
        ...getElementName(attributes, parent, itemList, element.name),
        ...getElementTypes(element.name, field, type),
        ...getTitle(attributes, field),
      }
      if (targetModel) {
        widget.targetModel = targetModel
      }
      if (
        element.name &&
        (element.name.indexOf(TYPE.panel) >= 0 ||
          [TYPE.menubar, TYPE.toolbar].includes(element.name))
      ) {
        widget.colSpan = Number(attributes.colSpan || 12)
        widget.cols = 12
        widget.layout = "grid"
        widget.serverType =
          widget.type === "panel" && widget.tab === true
            ? TYPE.tabs
            : widget.serverType || widget.type
      }
    }
    return { widget, field }
  }

  const getSpecialType = (element) => {
    return element.name
  }
  const getXMLToViewItems = (elements = [], fields, parent) => {
    const exclude = ["panel-mail"]
    let _widgets = {}
    const itemList = []
    const fieldList = []
    elements.forEach((element) => {
      if (element.attributes && `${element.attributes.json}` === "true") {
        return
      }
      if (!exclude.includes(element.name) && element.type !== "cdata") {
        const _ID = _.uniqueId()
        const { widget, field } = getElementToWidget(
          element,
          fields,
          parent,
          itemList
        )
        if (field) {
          fieldList.push(field)
        }
        itemList.push(_ID)
        if (element.name && element.name.indexOf(TYPE.panel) >= 0) {
          widget.items = []
        }
        if (element.elements && element.name !== "field") {
          const items = getXMLToViewItems(
            element.elements,
            fields,
            element.attributes
          )
          _widgets = { ..._widgets, ...items._widgets }
          widget.items = [...items.itemList]
          fieldList.push(...items.fieldList)
        }
        if (element.elements && element.name === "field") {
          // check for viewer
          const type = getSpecialType(element.elements[0])
          if (type) {
            widget.type = type
            widget.elements = element.elements
          }
        }
        // override with meta attrs list
        if (widget.name) {
          const list =
            attrsList &&
            attrsList.length > 0 &&
            attrsList.filter((attr) => attr.field === widget.name)
          list &&
            list.forEach((attr) => {
              if (["selection-in"].includes(attr.name)) {
                widget[attr.name] = attr.value
              } else {
                widget[
                  editorKeyReplacer(dashToCamelCase(attr.name), MODEL_TYPE.BASE)
                ] = attr.value
              }
            })
        }
        _widgets[_ID] = { ...widget }
      }
    })
    return { _widgets, itemList, fieldList }
  }

  const { itemList, _widgets, fieldList } = getXMLToViewItems(elements, fields)
  const form = _widgets[itemList[0]]
  const items = form.items || []
  delete _widgets[itemList[0]]
  const schema = {
    widgets: {
      [IDS.form]: {
        type: TYPE.form,
        cols: 12,
        ...form,
        items: undefined,
      },
      [IDS.dumpField]: {
        type: TYPE.dumpField,
        name: "",
      },
      ..._widgets,
    },
    items,
    fieldList,
  }
  return schema
}

export const generateXMLToViewSchema = ({
  view,
  fields,
  original = false,
  extensionXML,
  attrsList,
}) => {
  const { elements } = JSON.parse(
    convert.xml2json(view?.xml, {
      compact: false,
      fullTagEmptyElement: false,
    })
  )
  return generateViewFromJson({
    view: { elements },
    fields,
    original,
    extensionXML,
    attrsList,
  })
}

export function getDefaultGridFormName(str, isForm = false, isJson = false) {
  if (!str) return
  if (isJson) {
    return `custom-model-${str.name}-${isForm ? "form" : "grid"}`
  }
  const models = str.split(".")
  const modelString = models[models.length - 1]
  if (!modelString) return
  const viewName = dasherize(modelString)
  return `${viewName.toLowerCase()}-${isForm ? "form" : "grid"}`
}

export function getDuplicateArrayValues(arr, isCustomForm = false) {
  const duplicateValues = arr.reduce(
    (accumulator, currentValue, currentIndex, array) => {
      if (
        array.findIndex((obj) => obj.name === currentValue.name) !==
          currentIndex &&
        accumulator.findIndex((obj) => obj.name === currentValue.name) === -1
      ) {
        if (isCustomForm ? currentValue.type !== "customForm" : true) {
          accumulator.push(currentValue)
        }
      }
      return accumulator
    },
    []
  )
  return duplicateValues
}
export const getParams = () => {
  const params = new URL(document.location).searchParams
  const isStudioLite = JSON.parse(params.get("isStudioLite") || false)
  const modelTitle = params.get("modelTitle")
  const type = JSON.parse(params.get("json") || true)
  const model = params.get("model")
  const view = params.get("view")
  const customField = params.get("customField")

  return {
    type,
    model,
    view,
    customField,
    isStudioLite,
    modelTitle,
  }
}

export const isSidebarPanel = (widget) =>
  JSON.parse(widget?.sidebar || widget.widgetAttrs?.sidebar || false)

export const hasSidePanel = (items, widgets) =>
  items.some((item) => isSidebarPanel(widgets[item]))

export const hasMainPanel = (items, widgets) =>
  items.some((item) => !isSidebarPanel(widgets[item]))

export const changeEditWidgetIfNeeded = (draft) => {
  if (!draft.editWidget) return
  const isCustomField = draft.editWidgetType === "customField"
  const _widgets = isCustomField ? draft.customFieldWidgets : draft.widgets
  const _items = isCustomField ? draft.customFieldItems : draft.items
  if (!_widgets[draft.editWidget]) return
  const { isEditWidgetATab, currentTab } = getEditWidgetInfo()
  if (!isEditWidgetATab || !currentTab) return
  draft.editWidget = currentTab
  return

  function getEditWidgetInfo() {
    const info = {
      isEditWidgetATab: false,
      currentTab: null,
    }
    if (isCustomField || draft.modelType === MODEL_TYPE.CUSTOM) {
      const isTab = JSON.parse(
        _widgets[draft.editWidget].widgetAttrs?.tab || "false"
      )
      if (!isTab) return info
      info.isEditWidgetATab = true
      const tabsPanelId = _items.find((id) => _widgets[id].type === TYPE.tabs)
      const currentTab =
        _widgets[tabsPanelId].current || _widgets[tabsPanelId].items?.[0]
      info.currentTab = currentTab
      return info
    }
    // for real-forms we assume that tabsPanels will only be there in topLevel items
    const tabsPanelIds = draft.items.filter(
      (id) => _widgets[id].type === TYPE.tabs
    )

    if (!tabsPanelIds.length) return info
    for (const id of tabsPanelIds) {
      const tabItems = _widgets[id].items
      if (tabItems) {
        const isTab = tabItems.includes(draft.editWidget)
        if (isTab) {
          info.isEditWidgetATab = true
          info.currentTab = _widgets[id].current || tabItems[0]
          return info
        }
      }
    }
    return info
  }
}

export const getWidgetElementId = (id) => `widget-${id}`
