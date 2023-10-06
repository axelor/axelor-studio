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
} from "./propertyFields"
import {
  StringField,
  IntegerField,
  StaticSelectField,
  SelectField,
  BooleanField,
} from "./fieldTypes"
import { MODEL_TYPE } from "./../constants"

/** Options */
const stringOption = {
  overview: [
    Name({ existsCheck: true }),
    Type,
    Title,
    DefaultValue,
    StudioApp,
    Help,
    Sequence,
  ],
  fieldOptions: [
    Selection,
    SelectionIn,
    Widget,
    OnChange,
    Min,
    Max,
    StringField({ name: "regex", dependModelType: MODEL_TYPE.CUSTOM }),
    Value,
  ],
  uiOptions: [
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
  conditions: [
    OnlyIf,
    ShowIf,
    HideIf,
    RequiredIf,
    ReadOnlyIf,
    IncludeIf,
    ValidIf,
  ],
  valueExpr: [ValueExpression],
  roles: [Roles],
  widgetAttributes: [
    ColSpan,
    ShowTitle,
    BooleanField({
      name: "multiline",
      parentField: "widgetAttrs",
      modelType: MODEL_TYPE.CUSTOM,
      dependModelType: MODEL_TYPE.CUSTOM,
    }),
  ],
}

const integerOption = {
  overview: [
    Name({ existsCheck: true }),
    Type,
    Title,
    DefaultValue,
    StudioApp,
    Help,
    Sequence,
  ],
  fieldOptions: [Selection, SelectionIn, Widget, OnChange, Min, Max, Value],
  uiOptions: [Required, ReadOnly, Hidden, VisibleInGrid, ColumnSequence, Css],
  conditions: [
    OnlyIf,
    ShowIf,
    HideIf,
    RequiredIf,
    ReadOnlyIf,
    IncludeIf,
    ValidIf,
  ],
  valueExpr: [ValueExpression],
  roles: [Roles],
  widgetAttributes: [ColSpan, ShowTitle],
}

const decimalOption = {
  overview: [
    Name({ existsCheck: true }),
    Type,
    Title,
    DefaultValue,
    StudioApp,
    Help,
    Sequence,
  ],
  fieldOptions: [
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
  uiOptions: [Required, ReadOnly, Hidden, VisibleInGrid, ColumnSequence, Css],
  conditions: [
    OnlyIf,
    ShowIf,
    HideIf,
    RequiredIf,
    ReadOnlyIf,
    IncludeIf,
    ValidIf,
  ],
  valueExpr: [ValueExpression],
  roles: [Roles],
  widgetAttributes: [ColSpan, ShowTitle],
}

const booleanOption = {
  overview: [
    Name({ existsCheck: true }),
    Type,
    Title,
    DefaultValue,
    StudioApp,
    Help,
    Sequence,
  ],
  fieldOptions: [Widget, OnChange, Value],
  uiOptions: [Required, ReadOnly, Hidden, VisibleInGrid, ColumnSequence, Css],
  conditions: [
    OnlyIf,
    ShowIf,
    HideIf,
    RequiredIf,
    ReadOnlyIf,
    IncludeIf,
    ValidIf,
  ],
  valueExpr: [ValueExpression],
  roles: [Roles],
  widgetAttributes: [ColSpan, ShowTitle],
}

const datetimeOption = {
  overview: [
    Name({ existsCheck: true }),
    Type,
    Title,
    DefaultValue,
    StudioApp,
    Help,
    Sequence,
  ],
  fieldOptions: [Widget, OnChange, Value],
  uiOptions: [Required, ReadOnly, Hidden, VisibleInGrid, ColumnSequence, Css],
  conditions: [
    OnlyIf,
    ShowIf,
    HideIf,
    RequiredIf,
    ReadOnlyIf,
    IncludeIf,
    ValidIf,
  ],
  valueExpr: [ValueExpression],
  roles: [Roles],
  widgetAttributes: [ColSpan, ShowTitle],
}

const panelOption = {
  overview: [Name({ existsCheck: true }), Type, Title, StudioApp],
  uiOptions: [
    ReadOnly,
    Hidden,
    Sidebar,
    CanCollapse,
    CollapseIf,
    ColumnSequence,
    Css,
    Active,
  ],
  conditions: [OnlyIf, ShowIf, HideIf, ReadOnlyIf],
  roles: [Roles],
  widgetAttributes: [ColSpan, ItemSpan, ShowTitle],
}

const panelStackOption = {
  overview: [Name({ existsCheck: true }), Type, StudioApp],
  uiOptions: [
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
  conditions: [ShowIf, HideIf, ReadOnlyIf],
  roles: [Roles],
  widgetAttributes: [ColSpan],
}

const panelTabOption = {
  overview: [Name({ existsCheck: true }), Type, Title, StudioApp],
  uiOptions: [ReadOnly, Hidden, ColumnSequence, Css],
  conditions: [ShowIf, HideIf, ReadOnlyIf],
  roles: [Roles],
  widgetAttributes: [ShowTitle],
}

const buttonOption = {
  overview: [
    Name({ existsCheck: true }),
    Type,
    Title,
    StudioApp,
    Help,
    Sequence,
    Prompt,
  ],
  fieldOptions: [
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
  uiOptions: [ReadOnly, Hidden, VisibleInGrid, ColumnSequence, Css],
  conditions: [
    OnlyIf,
    ShowIf,
    HideIf,
    RequiredIf,
    ReadOnlyIf,
    IncludeIf,
    ValidIf,
  ],
  roles: [Roles],
  widgetAttributes: [
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
}

const seperatorOption = {
  overview: [
    Name({ existsCheck: true }),
    Type,
    Title,
    DefaultValue,
    StudioApp,
    Help,
    Sequence,
  ],
  uiOptions: [Hidden, ColumnSequence, Css],
  conditions: [
    OnlyIf,
    ShowIf,
    HideIf,
    RequiredIf,
    ReadOnlyIf,
    IncludeIf,
    ValidIf,
  ],
  roles: [Roles],
  widgetAttributes: [ColSpan],
}

const spacerOption = {
  overview: [Name({ existsCheck: true }), Type, StudioApp],
  fieldOptions: [],
  uiOptions: [Hidden, ColumnSequence, Css],
  conditions: [OnlyIf, ShowIf, HideIf, ValidIf],
  roles: [Roles],
  widgetAttributes: [ColSpan],
}

const labelOption = {
  overview: [Name({ existsCheck: true }), Type, Title, StudioApp],
  fieldOptions: [Widget],
  uiOptions: [Required, Hidden, ColumnSequence, Css],
  conditions: [OnlyIf, ShowIf, HideIf, RequiredIf, ReadOnlyIf, ValidIf],
  valueExpr: [ValueExpression],
  roles: [Roles],
  widgetAttributes: [ColSpan, ShowTitle],
}

const viewerOption = {
  overview: [Name({ existsCheck: true }), Type, Title, StudioApp],
  fieldOptions: [Widget],
  uiOptions: [Required, Hidden, ReadOnly, ColumnSequence, Css],
  conditions: [ShowIf, HideIf, RequiredIf, ReadOnlyIf, ValidIf],
  valueExpr: [ValueExpression],
  roles: [Roles],
  widgetAttributes: [ColSpan, ShowTitle],
}

const manyToOneOption = {
  overview: [
    Name({ existsCheck: true }),
    Type,
    Title,
    DefaultValue,
    StudioApp,
    Help,
    Sequence,
  ],
  fieldOptions: [
    Widget,
    OnChange,
    JsonRelationalField,
    Domain,
    TargetModel,
    GridView,
    FormView,
    Value,
  ],
  uiOptions: [Required, ReadOnly, Hidden, VisibleInGrid, ColumnSequence, Css],
  conditions: [
    OnlyIf,
    ShowIf,
    HideIf,
    RequiredIf,
    ReadOnlyIf,
    IncludeIf,
    ValidIf,
  ],
  valueExpr: [ValueExpression],
  roles: [Roles],
  widgetAttributes: [ColSpan, ShowTitle],
}

const manyToManyAndOneToManyOption = {
  overview: [
    Name({ existsCheck: true }),
    Type,
    Title,
    StudioApp,
    Help,
    Sequence,
  ],
  fieldOptions: [
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
  uiOptions: [Required, ReadOnly, Hidden, VisibleInGrid, ColumnSequence, Css],
  conditions: [
    OnlyIf,
    ShowIf,
    HideIf,
    RequiredIf,
    ReadOnlyIf,
    IncludeIf,
    ValidIf,
  ],
  valueExpr: [ValueExpression],
  roles: [Roles],
  widgetAttributes: [ColSpan, ShowTitle],
}

const customRelationOption = {
  overview: [
    Name({ existsCheck: true }),
    Type,
    Title,
    StudioApp,
    Help,
    Sequence,
  ],
  fieldOptions: [
    Widget,
    OnChange,
    JsonRelationalField,
    Domain,
    TargetJsonModel,
    Value,
  ],
  uiOptions: [Required, ReadOnly, Hidden, VisibleInGrid, ColumnSequence, Css],
  conditions: [
    OnlyIf,
    ShowIf,
    HideIf,
    RequiredIf,
    ReadOnlyIf,
    IncludeIf,
    ValidIf,
  ],
  valueExpr: [ValueExpression],
  roles: [Roles],
  widgetAttributes: [ColSpan, ShowTitle],
}

const formOption = {
  overview: [
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
  actions: [
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
}

const commonOption = {
  overview: [Name(), Type, Title, StudioApp],
  uiOptions: [Hidden, VisibleInGrid, ColumnSequence, Css],
  conditions: [ShowIf, HideIf, ReadOnlyIf, IncludeIf, ValidIf],
  widgetAttributes: [ColSpan, ShowTitle],
}

const dummyOption = {
  overview: [Name(), DummyType],
}
const viewOption = {
  overview: [Name({ existsCheck: true }), Type, { ...Title, readOnly: true }],
}

const gridOption = {
  overview: [Name({ existsCheck: true }), Type, Title, Model, Editable],
}

const panelDashletOption = {
  overview: [
    Name({ existsCheck: true }),
    Type,
    Action,
    Title,
    CanSearch,
    IfModule,
  ],
  uiOptions: [ReadOnly, Hidden, Height, Css, Refresh],
  conditions: [ShowIf, HideIf, ReadOnlyIf],
  widgetAttributes: [ColSpan, ShowTitle],
}

const menuItemOption = {
  overview: [Name({ existsCheck: true }), Type, Action],
  widgetAttributes: [ShowTitle],
}

const dividerOption = {
  overview: [Name({ existsCheck: true }), Type],
  conditions: [If, ShowIf, HideIf, IfModule],
}

const menuOption = {
  overview: [Name({ existsCheck: true }), Type],
  widgetAttributes: [ShowTitle],
  conditions: [If, IfModule, IncludeIf],
}

const panelRelatedOption = {
  overview: [Name({ existsCheck: true }), Type, Title, Field, OnNew, OnChange],
  uiOptions: [FormView, GridView, Height, Editable, ReadOnly, Hidden, Css],
  conditions: [ShowIf, HideIf, ReadOnlyIf, ValidIf, CanMove, OrderBy],
  widgetAttributes: [ColSpan, ShowTitle],
}

const panelIncludeOption = {
  overview: [Type, IncludeView, IncludeFrom, IfModule],
  widgetAttributes: [ShowTitle],
}

const hiliteOption = {
  overview: [Name({ existsCheck: true }), If, Color, Background, Strong, Css],
}

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
