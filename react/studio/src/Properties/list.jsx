import fontAwesomeList from "./fa-icons"
import {
	Name,
	Type,
	Title,
	DefaultValue,
	StudioApp,
	Help,
	Sequence,
	Roles,
	ValueExpression,
	Selection,
	Widget,
	OnChange,
	Min,
	Max,
	Regex,
	JsonRelationalField,
	Domain,
	TargetJsonModel,
	TargetModel,
	GridView,
	FormView,
	Required,
	ColumnSequence,
	ReadOnly,
	Hidden,
	VisibleInGrid,
	ShowIf,
	HideIf,
	If,
	RequiredIf,
	ReadOnlyIf,
	IncludeIf,
	ValidIf,
	ColSpan,
	ShowTitle,
	OnNew,
	Editable,
	DummyType,
	CanSearch,
	Action,
	IfModule,
	OnlyIf,
	Height,
	Field,
	CanMove,
	OrderBy,
	IncludeFrom,
	IncludeView,
	IsGenerateMenu,
	MenuBuilderParent,
	MenuBuilderTitle,
	Model,
	Strong,
	Color,
	Background,
	ItemSpan,
	Css,
	Prompt,
	SelectionIn,
	ValueAdd,
	ValueDel,
	Active,
	Refresh,
	Value,
	Sidebar,
	CanCollapse,
	CollapseIf,
	SelectableType,
} from "./propertyFields"
import {
	StringField,
	IntegerField,
	StaticSelectField,
	SelectField,
	BooleanField,
} from "./fieldTypes"
import { MODEL_TYPE } from "../constants"

const createSection = (sectionProps) => (fieldOptionProps) => ({
	...sectionProps,
	...fieldOptionProps,
})

/** Sections */

// INFO: Hide a section for all widgets
// const overviewSection = createSection({
// name: "overview",
// title: "Overview",
// isHidden:(props)=>{ return true}  Customize the condition to control visibility.
// })

// INFO: Call the render function to get the rendered component
// const overviewSection = createSection({
// name: "overview",
// title: "Overview",
// render: (props) => {
// 		return <div>Test</div>
// 	},  Customize the component according to need.
// })

const overviewSection = createSection({
	name: "overview",
	title: "Overview",
})
const fieldSection = createSection({
	name: "fieldOptions",
	title: "Field options",
})
const uiSection = createSection({
	name: "uiOptions",
	title: "Ui options",
})
const conditionSection = createSection({
	name: "conditions",
	title: "Conditions",
})
const valueExprSection = createSection({
	name: "valueExpr",
	title: "Value expr",
})
const rolesSection = createSection({ name: "roles", title: "Roles" })
const widgetAttrSection = createSection({
	name: "widgetAttrs",
	title: "Widget attributes",
})
const actionSection = createSection({
	name: "actions",
	title: "Actions",
})
/** Options */
const stringOption = [
	overviewSection({
		fields: [
			Name({ existsCheck: true }),
			Type,
			SelectableType,
			Title,
			DefaultValue,
			StudioApp,
			Help,
			Sequence,
		],
	}),
	fieldSection({
		fields: [
			Selection,
			SelectionIn,
			Widget,
			OnChange,
			Min,
			Max,
			Regex,
			// StringField({ name: "regex", dependModelType: MODEL_TYPE.CUSTOM }),
			Value,
		],
	}),
	uiSection({
		fields: [
			Required,
			ReadOnly,
			BooleanField({
				name: "nameField",
				title: "Name column",
				dependModelType: MODEL_TYPE.CUSTOM,
			}),
			Hidden,
			VisibleInGrid,
			ColumnSequence,
			Css,
		],
	}),
	conditionSection({
		fields: [
			OnlyIf,
			ShowIf,
			HideIf,
			RequiredIf,
			ReadOnlyIf,
			IncludeIf,
			ValidIf,
		],
	}),
	valueExprSection({ fields: [ValueExpression] }),
	rolesSection({ fields: [Roles] }),
	widgetAttrSection({
		fields: [
			ColSpan,
			ShowTitle,
			BooleanField({
				name: "multiline",
				parentField: "widgetAttrs",
				modelType: MODEL_TYPE.CUSTOM,
				dependModelType: MODEL_TYPE.CUSTOM,
				isHidden: (props) => {
					return props?.widget?.isSelectionField
				},
			}),
		],
	}),
]

const integerOption = [
	overviewSection({
		fields: [
			Name({ existsCheck: true }),
			Type,
			SelectableType,
			Title,
			DefaultValue,
			StudioApp,
			Help,
			Sequence,
		],
	}),
	fieldSection({
		fields: [Selection, SelectionIn, Widget, OnChange, Min, Max, Value],
	}),
	uiSection({
		fields: [Required, ReadOnly, Hidden, VisibleInGrid, ColumnSequence, Css],
	}),
	conditionSection({
		fields: [
			OnlyIf,
			ShowIf,
			HideIf,
			RequiredIf,
			ReadOnlyIf,
			IncludeIf,
			ValidIf,
		],
	}),
	valueExprSection({ fields: [ValueExpression] }),
	rolesSection({ fields: [Roles] }),
	widgetAttrSection({ fields: [ColSpan, ShowTitle] }),
]

const decimalOption = [
	overviewSection({
		fields: [
			Name({ existsCheck: true }),
			Type,
			Title,
			DefaultValue,
			StudioApp,
			Help,
			Sequence,
		],
	}),
	fieldSection({
		fields: [
			Widget,
			OnChange,
			Min,
			Max,
			IntegerField({
				name: "precision",
				default: 6,
			}),
			IntegerField({
				name: "scale",
				default: 2,
			}),
			Value,
		],
	}),
	uiSection({
		fields: [Required, ReadOnly, Hidden, VisibleInGrid, ColumnSequence, Css],
	}),
	conditionSection({
		fields: [
			OnlyIf,
			ShowIf,
			HideIf,
			RequiredIf,
			ReadOnlyIf,
			IncludeIf,
			ValidIf,
		],
	}),
	valueExprSection({ fields: [ValueExpression] }),
	rolesSection({ fields: [Roles] }),
	widgetAttrSection({ fields: [ColSpan, ShowTitle] }),
]

const booleanOption = [
	overviewSection({
		fields: [
			Name({ existsCheck: true }),
			Type,
			Title,
			DefaultValue,
			StudioApp,
			Help,
			Sequence,
		],
	}),
	fieldSection({ fields: [Widget, OnChange, Value] }),
	uiSection({
		fields: [Required, ReadOnly, Hidden, VisibleInGrid, ColumnSequence, Css],
	}),
	conditionSection({
		fields: [
			OnlyIf,
			ShowIf,
			HideIf,
			RequiredIf,
			ReadOnlyIf,
			IncludeIf,
			ValidIf,
		],
	}),
	valueExprSection({ fields: [ValueExpression] }),
	rolesSection({ fields: [Roles] }),
	widgetAttrSection({ fields: [ColSpan, ShowTitle] }),
]

const datetimeOption = [
	overviewSection({
		fields: [
			Name({ existsCheck: true }),
			Type,
			Title,
			DefaultValue,
			StudioApp,
			Help,
			Sequence,
		],
	}),
	fieldSection({ fields: [Widget, OnChange, Value] }),
	uiSection({
		fields: [Required, ReadOnly, Hidden, VisibleInGrid, ColumnSequence, Css],
	}),
	conditionSection({
		fields: [
			OnlyIf,
			ShowIf,
			HideIf,
			RequiredIf,
			ReadOnlyIf,
			IncludeIf,
			ValidIf,
		],
	}),
	valueExprSection({ fields: [ValueExpression] }),
	rolesSection({ fields: [Roles] }),
	widgetAttrSection({ fields: [ColSpan, ShowTitle] }),
]

const panelOption = [
	overviewSection({
		fields: [Name({ existsCheck: true }), Type, Title, StudioApp],
	}),
	uiSection({
		fields: [
			ReadOnly,
			Hidden,
			Sidebar,
			CanCollapse,
			CollapseIf,
			ColumnSequence,
			Css,
			Active,
		],
	}),
	conditionSection({ fields: [OnlyIf, ShowIf, HideIf, ReadOnlyIf] }),
	rolesSection({ fields: [Roles] }),
	widgetAttrSection({ fields: [ColSpan, ItemSpan, ShowTitle] }),
]

const panelStackOption = [
	overviewSection({ fields: [Name({ existsCheck: true }), Type, StudioApp] }),
	uiSection({
		fields: [
			ReadOnly,
			Hidden,
			Sidebar,
			BooleanField({
				name: "canCollapse",
				parentField: "widgetAttrs",
				modelType: MODEL_TYPE.CUSTOM,
				dependModelType: MODEL_TYPE.CUSTOM,
			}),
			StringField({
				name: "collapseIf",
				parentField: "widgetAttrs",
				modelType: MODEL_TYPE.CUSTOM,
				dependModelType: MODEL_TYPE.CUSTOM,
			}),
			ColumnSequence,
			Css,
		],
	}),
	conditionSection({ fields: [ShowIf, HideIf, ReadOnlyIf] }),
	rolesSection({ fields: [Roles] }),
	widgetAttrSection({ fields: [ColSpan] }),
]

const panelTabOption = [
	overviewSection({
		fields: [Name({ existsCheck: true }), Type, Title, StudioApp],
	}),
	uiSection({ fields: [ReadOnly, Hidden, ColumnSequence, Css] }),
	conditionSection({ fields: [ShowIf, HideIf, ReadOnlyIf] }),
	rolesSection({ fields: [Roles] }),
	widgetAttrSection({ fields: [ShowTitle] }),
]

const buttonOption = [
	overviewSection({
		fields: [
			Name({ existsCheck: true }),
			Type,
			Title,
			StudioApp,
			Help,
			Sequence,
			Prompt,
		],
	}),
	fieldSection({
		fields: [
			Widget,
			SelectField({
				name: "onClick",
				title: "On click",
				required: true,
				ref: "com.axelor.meta.db.MetaAction",
				requiredFor: ["button"],
				dependModelType: MODEL_TYPE.CUSTOM,
				multiple: true,
				commaSeparated: true,
				canAddNew: true,
			}),
		],
	}),
	uiSection({ fields: [ReadOnly, Hidden, ColumnSequence, Css] }),
	conditionSection({
		fields: [OnlyIf, ShowIf, HideIf, ReadOnlyIf, IncludeIf, ValidIf],
	}),
	rolesSection({ fields: [Roles] }),
	widgetAttrSection({
		fields: [
			ColSpan,
			ShowTitle,
			StaticSelectField({
				name: "icon",
				title: "Icon",
				data: fontAwesomeList,
				helper: "https://fontawesome.com/cheatsheet",
				parentField: "widgetAttrs",
				modelType: MODEL_TYPE.CUSTOM,
			}),
		],
	}),
]

const seperatorOption = [
	overviewSection({
		fields: [
			Name({ existsCheck: true }),
			Type,
			Title,
			DefaultValue,
			StudioApp,
			Help,
			Sequence,
		],
	}),
	uiSection({ fields: [Hidden, ColumnSequence, Css] }),
	conditionSection({
		fields: [
			OnlyIf,
			ShowIf,
			HideIf,
			RequiredIf,
			ReadOnlyIf,
			IncludeIf,
			ValidIf,
		],
	}),
	rolesSection({ fields: [Roles] }),
	widgetAttrSection({ fields: [ColSpan] }),
]

const spacerOption = [
	overviewSection({ fields: [Name({ existsCheck: true }), Type, StudioApp] }),
	fieldSection({ fields: [] }),
	uiSection({ fields: [Hidden, ColumnSequence, Css] }),
	conditionSection({ fields: [OnlyIf, ShowIf, HideIf, ValidIf] }),
	rolesSection({ fields: [Roles] }),
	widgetAttrSection({ fields: [ColSpan] }),
]

const labelOption = [
	overviewSection({
		fields: [Name({ existsCheck: true }), Type, Title, StudioApp],
	}),
	fieldSection({ fields: [Widget] }),
	uiSection({ fields: [Required, Hidden, ColumnSequence, Css] }),
	conditionSection({
		fields: [OnlyIf, ShowIf, HideIf, RequiredIf, ReadOnlyIf, ValidIf],
	}),
	valueExprSection({ fields: [ValueExpression] }),
	rolesSection({ fields: [Roles] }),
	widgetAttrSection({ fields: [ColSpan, ShowTitle] }),
]

const viewerOption = [
	overviewSection({
		fields: [Name({ existsCheck: true }), Type, Title, StudioApp],
	}),
	fieldSection({ fields: [Widget] }),
	uiSection({ fields: [Required, Hidden, ReadOnly, ColumnSequence, Css] }),
	conditionSection({
		fields: [ShowIf, HideIf, RequiredIf, ReadOnlyIf, ValidIf],
	}),
	valueExprSection({ fields: [ValueExpression] }),
	rolesSection({ fields: [Roles] }),
	widgetAttrSection({ fields: [ColSpan, ShowTitle] }),
]

const manyToOneOption = [
	overviewSection({
		fields: [
			Name({ existsCheck: true }),
			Type,
			Title,
			DefaultValue,
			StudioApp,
			Help,
			Sequence,
		],
	}),
	fieldSection({
		fields: [
			Widget,
			OnChange,
			JsonRelationalField,
			Domain,
			TargetModel,
			GridView,
			FormView,
			Value,
		],
	}),
	uiSection({
		fields: [Required, ReadOnly, Hidden, VisibleInGrid, ColumnSequence, Css],
	}),
	conditionSection({
		fields: [
			OnlyIf,
			ShowIf,
			HideIf,
			RequiredIf,
			ReadOnlyIf,
			IncludeIf,
			ValidIf,
		],
	}),
	valueExprSection({ fields: [ValueExpression] }),
	rolesSection({ fields: [Roles] }),
	widgetAttrSection({ fields: [ColSpan, ShowTitle] }),
]

const manyToManyAndOneToManyOption = [
	overviewSection({
		fields: [
			Name({ existsCheck: true }),
			Type,
			Title,
			StudioApp,
			Help,
			Sequence,
		],
	}),
	fieldSection({
		fields: [
			Widget,
			OnChange,
			JsonRelationalField,
			Domain,
			TargetModel,
			GridView,
			FormView,
			ValueAdd,
			ValueDel,
			Value,
		],
	}),
	uiSection({
		fields: [Required, ReadOnly, Hidden, VisibleInGrid, ColumnSequence, Css],
	}),
	conditionSection({
		fields: [
			OnlyIf,
			ShowIf,
			HideIf,
			RequiredIf,
			ReadOnlyIf,
			IncludeIf,
			ValidIf,
		],
	}),
	valueExprSection({ fields: [ValueExpression] }),
	rolesSection({ fields: [Roles] }),
	widgetAttrSection({ fields: [ColSpan, ShowTitle] }),
]

const customRelationOption = [
	overviewSection({
		fields: [
			Name({ existsCheck: true }),
			Type,
			Title,
			StudioApp,
			Help,
			Sequence,
		],
	}),
	fieldSection({
		fields: [
			Widget,
			OnChange,
			JsonRelationalField,
			Domain,
			TargetJsonModel,
			Value,
		],
	}),
	uiSection({
		fields: [Required, ReadOnly, Hidden, VisibleInGrid, ColumnSequence, Css],
	}),
	conditionSection({
		fields: [
			OnlyIf,
			ShowIf,
			HideIf,
			RequiredIf,
			ReadOnlyIf,
			IncludeIf,
			ValidIf,
		],
	}),
	valueExprSection({ fields: [ValueExpression] }),
	rolesSection({ fields: [Roles] }),
	widgetAttrSection({ fields: [ColSpan, ShowTitle] }),
]

const formOption = [
	overviewSection({
		fields: [
			Name({ existsCheck: true }),
			{ ...Title, required: true },
			StudioApp,
			StaticSelectField({
				name: "formWidth",
				title: "Form width",
				data: ["large"],
			}),
			StringField({
				name: "orderBy",
				title: "Order by",
			}),
			IsGenerateMenu,
			MenuBuilderParent,
			MenuBuilderTitle,
		],
	}),
	actionSection({
		fields: [
			SelectField({
				title: "On new",
				name: "onNew",
				ref: "com.axelor.meta.db.MetaAction",
				dependModelType: MODEL_TYPE.CUSTOM,
				multiple: true,
				commaSeparated: true,
				canAddNew: true,
			}),
			SelectField({
				title: "On save",
				name: "onSave",
				ref: "com.axelor.meta.db.MetaAction",
				dependModelType: MODEL_TYPE.CUSTOM,
				multiple: true,
				commaSeparated: true,
				canAddNew: true,
			}),
		],
	}),
]

const commonOption = [
	overviewSection({ fields: [Name(), Type, Title, StudioApp] }),
	uiSection({ fields: [Hidden, VisibleInGrid, ColumnSequence, Css] }),
	conditionSection({
		fields: [ShowIf, HideIf, ReadOnlyIf, IncludeIf, ValidIf],
	}),
	widgetAttrSection({ fields: [ColSpan, ShowTitle] }),
]

const dummyOption = [overviewSection({ fields: [Name(), DummyType] })]
const viewOption = [
	overviewSection({
		fields: [Name({ existsCheck: true }), Type, { ...Title, readOnly: true }],
	}),
]

const gridOption = [
	overviewSection({
		fields: [Name({ existsCheck: true }), Type, Title, Model, Editable],
	}),
]

const panelDashletOption = [
	overviewSection({
		fields: [
			Name({ existsCheck: true }),
			Type,
			Action,
			Title,
			CanSearch,
			IfModule,
		],
	}),
	uiSection({ fields: [ReadOnly, Hidden, Height, Css, Refresh] }),
	conditionSection({ fields: [ShowIf, HideIf, ReadOnlyIf] }),
	widgetAttrSection({ fields: [ColSpan, ShowTitle] }),
]

const menuItemOption = [
	overviewSection({ fields: [Name({ existsCheck: true }), Type, Action] }),
	widgetAttrSection({ fields: [ShowTitle] }),
]

const dividerOption = [
	overviewSection({ fields: [Name({ existsCheck: true }), Type] }),
	conditionSection({ fields: [If, ShowIf, HideIf, IfModule] }),
]

const menuOption = [
	overviewSection({ fields: [Name({ existsCheck: true }), Type] }),
	widgetAttrSection({ fields: [ShowTitle] }),
	conditionSection({ fields: [If, IfModule, IncludeIf] }),
]

const panelRelatedOption = [
	overviewSection({
		fields: [Name({ existsCheck: true }), Type, Title, Field, OnNew, OnChange],
	}),
	uiSection({
		fields: [FormView, GridView, Height, Editable, ReadOnly, Hidden, Css],
	}),
	conditionSection({
		fields: [ShowIf, HideIf, ReadOnlyIf, ValidIf, CanMove, OrderBy],
	}),
	widgetAttrSection({ fields: [ColSpan, ShowTitle] }),
]

const panelIncludeOption = [
	overviewSection({ fields: [Type, IncludeView, IncludeFrom, IfModule] }),
	widgetAttrSection({ fields: [ShowTitle] }),
]

const hiliteOption = [
	overviewSection({
		fields: [Name({ existsCheck: true }), If, Color, Background, Strong, Css],
	}),
]

export const options = [
	{ type: "form", value: viewOption },
	{ type: "grid", value: gridOption },
	{ type: "modelForm", value: formOption },
	{ type: "string", value: stringOption },
	{ type: "byte[]", value: stringOption },
	{ type: "integer", value: integerOption },
	{ type: "number", value: integerOption },
	{ type: "decimal", value: decimalOption },
	{ type: "bigdecimal", value: decimalOption },
	{ type: "boolean", value: booleanOption },
	{ type: "datetime", value: datetimeOption },
	{ type: "localdatetime", value: datetimeOption },
	{ type: "zoneddatetime", value: datetimeOption },
	{ type: "date", value: datetimeOption },
	{ type: "localdate", value: datetimeOption },
	{ type: "time", value: datetimeOption },
	{ type: "panel", value: panelOption, dependModelType: MODEL_TYPE.BASE },
	{ type: "panel-stack", value: panelStackOption },
	{ type: "panel-tab", value: panelTabOption },
	{ type: "button", value: buttonOption },
	{ type: "separator", value: seperatorOption },
	{ type: "spacer", value: spacerOption },
	{ type: "label", value: labelOption },
	{ type: "many-to-one", value: manyToOneOption },
	{ type: "many-to-many", value: manyToManyAndOneToManyOption },
	{ type: "one-to-many", value: manyToManyAndOneToManyOption },
	{ type: "json-many-to-one", value: customRelationOption },
	{ type: "json-many-to-many", value: customRelationOption },
	{ type: "json-one-to-many", value: customRelationOption },
	{ type: "include", value: formOption },
	{ type: "panel-tabs", value: panelTabOption, showInCustomField: false },
	{ type: "panel-dashlet", value: panelDashletOption },
	{ type: "panel-related", value: panelRelatedOption },
	{ type: "panel-include", value: panelIncludeOption },
	{ type: "text", value: commonOption },
	{ type: "long", value: decimalOption },
	{ type: "panel-dashlet", value: commonOption },
	{ type: "dashlet", value: commonOption },
	{ type: "static", value: commonOption },
	{ type: "one-to-one", value: manyToOneOption },
	{ type: "binary", value: commonOption },
	{ type: "field", value: commonOption },
	{ type: "dummy", value: dummyOption },
	{ type: "viewer", value: viewerOption },
	{ type: "editor", value: labelOption },
	{ type: "menu", value: menuOption },
	{ type: "item", value: menuItemOption },
	{ type: "divider", value: dividerOption },
	{ type: "hilite", value: hiliteOption },
]

export default options
