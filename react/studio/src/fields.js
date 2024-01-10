import { TYPE, IDS, ItemTypes, MODEL_TYPE } from "./constants"

const getModel = (modelType) =>
	modelType === MODEL_TYPE.CUSTOM
		? { model: "com.axelor.meta.db.MetaJsonRecord", modelField: "attrs" }
		: null

export const getPanel = (modelType, options = {}) => {
	const { widgetAttrs, ...rest } = options
	return {
		name: "panel",
		type: ItemTypes.CONTAINER,
		items: [],
		image: "panel.png",
		id: IDS.createWidgets.panel,
		serverType: TYPE.panel,
		cols: 12,
		layout: "grid",
		colSpan: 12,
		widgetAttrs: {
			showTitle: false,
			...(modelType === MODEL_TYPE.BASE ? { colSpan: 12 } : {}),
			...widgetAttrs,
		},
		...getModel(modelType),
		...rest,
	}
}
export const getFields = (modelType) => {
	const getType = (type) =>
		modelType === MODEL_TYPE.BASE ? type : ItemTypes.ITEM
	const getServerType = (type) =>
		modelType === MODEL_TYPE.BASE ? "field" : type
	return [
		{
			name: "Common",
			isHidden: (props) => {
				return props.isStudioLite
			},
			value: [
				{
					attrs: {
						name: "label",
						title: "Label",
						type: "label",
						image: "label.png",
						id: IDS.createWidgets.field,
						serverType: "label",
						colSpan: 6,
						widgetAttrs: { showTitle: true },
						...getModel(modelType),
					},
				},
				{
					attrs: {
						name: "button",
						type: "button",
						title: "Button",
						image: "button.png",
						id: IDS.createWidgets.field,
						serverType: "button",
						colSpan: 6,
						widgetAttrs: { showTitle: true },
						...getModel(modelType),
					},
				},
				{
					attrs: {
						name: "separator",
						type: "separator",
						image: "seperator.png",
						id: IDS.createWidgets.field,
						serverType: "separator",
						colSpan: 6,
						widgetAttrs: { showTitle: true },
						...getModel(modelType),
					},
				},
				{
					attrs: {
						name: "selection",
						title: "Selection",
						type: ItemTypes.ITEM,
						image: "dropdown-arrow.png",
						id: IDS.createWidgets.field,
						serverType: "string",
						isSelectionField: true,
						updateSelection: true,
						colSpan: 6,
						widgetAttrs: { showTitle: true },
						...getModel(modelType),
					},
				},
			],
		},
		{
			name: "Panels",
			isHidden: (props) => {
				return props.isStudioLite
			},
			value: [
				{
					attrs: getPanel(modelType),
				},
				{
					attrs: {
						name: "Tabs",
						type: TYPE.tabs,
						image: "panel_tabs.png",
						tab: true,
						items: [],
						id: IDS.createWidgets.tabs,
						serverType: TYPE.panel,
						colSpan: 12,
						title: "Tabs",
						current: null,
						layout: "grid",
						widgetAttrs: { showTitle: false },
						...getModel(modelType),
					},
				},
			],
		},
		{
			name: "Fields",

			value: [
				{
					attrs: {
						name: "string",
						type: getType("string"),
						title: "String",
						image: "string.png",
						id: IDS.createWidgets.field,
						isModelField: true,
						visibleInGrid: true,
						serverType: getServerType("string"),
						colSpan: 6,
						widgetAttrs: { showTitle: true },
						...getModel(modelType),
					},
				},
				{
					attrs: {
						name: "integer",
						type: getType("integer"),
						title: "Integer",
						image: "integer.png",
						id: IDS.createWidgets.field,
						isModelField: true,
						serverType: getServerType("integer"),
						colSpan: 6,
						widgetAttrs: { showTitle: true },
						...getModel(modelType),
					},
				},
				{
					attrs: {
						name: "decimal",
						type: getType("decimal"),
						title: "Decimal",
						image: "decimal.png",
						id: IDS.createWidgets.field,
						isModelField: true,
						serverType: getServerType("decimal"),
						colSpan: 6,
						widgetAttrs: { showTitle: true },
						...getModel(modelType),
					},
				},
				{
					attrs: {
						name: "boolean",
						type: getType("boolean"),
						title: "Boolean",
						image: "boolean.png",
						id: IDS.createWidgets.field,
						isModelField: true,
						serverType: getServerType("boolean"),
						colSpan: 6,
						widgetAttrs: { showTitle: true },
						...getModel(modelType),
					},
				},
				{
					attrs: {
						name: "datetime",
						type: getType("datetime"),
						title: "Date time",
						image: "datetime.png",
						id: IDS.createWidgets.field,
						isModelField: true,
						serverType: getServerType("datetime"),
						colSpan: 6,
						widgetAttrs: { showTitle: true },
						...getModel(modelType),
					},
				},
				{
					attrs: {
						name: "date",
						type: getType("date"),
						title: "Date",
						image: "date.png",
						id: IDS.createWidgets.field,
						isModelField: true,
						serverType: getServerType("date"),
						colSpan: 6,
						widgetAttrs: { showTitle: true },
						...getModel(modelType),
					},
				},
				{
					attrs: {
						name: "time",
						type: getType("time"),
						title: "Time",
						image: "time.png",
						id: IDS.createWidgets.field,
						isModelField: true,
						serverType: getServerType("time"),
						colSpan: 6,
						widgetAttrs: { showTitle: true },
						...getModel(modelType),
					},
				},
			],
		},
		{
			name: "Relational fields",
			value: [
				{
					attrs: {
						name: "manyToOne",
						type: ItemTypes.ITEM,
						title: "Many to one",
						image: "many-to-one.png",
						id: IDS.createWidgets.field,
						isModelField: true,
						serverType: "many-to-one",
						colSpan: 6,
						widgetAttrs: { showTitle: true },
						...getModel(modelType),
					},
				},
				{
					isHidden: (props) => props.isStudioLite,
					attrs: {
						name: "oneToMany",
						type: ItemTypes.ITEM,
						title: "One to many",
						image: "one-to-many.png",
						id: IDS.createWidgets.field,
						isModelField: true,
						serverType: "one-to-many",
						colSpan: 6,
						widgetAttrs: { showTitle: true },
						...getModel(modelType),
					},
				},
				{
					isHidden: () => false,
					attrs: {
						name: "manyToMany",
						type: ItemTypes.ITEM,
						title: "Many to many",
						image: "many-to-many.png",
						id: IDS.createWidgets.field,
						isModelField: true,
						serverType: "many-to-many",
						colSpan: 6,
						widgetAttrs: { showTitle: true },
						...getModel(modelType),
					},
				},
			],
		},
	]
}
