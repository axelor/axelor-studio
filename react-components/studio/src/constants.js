// TYPE define all elements
export const TYPE = {
	panel: "panel",
	tabs: "panel-tabs",
	field: "field",
	dumpField: "dump_field",
	form: "form",
	panelStack: "panel-stack",
	panelDashlet: "panel-dashlet",
	panelRelated: "panel-related",
	panelInclude: "panel-include",
	menu: "menu",
	menuItem: "item",
	divider: "divider",
	menubar: "menubar",
	toolbar: "toolbar",
};

export const ItemTypes = {
	CONTAINER: "panel",
	ROOTCONTAINER: "root-container",
	ITEM: "item",
	DUMMY: "dummy",
};

// FIELD_TYPE define all field types(manage on server end)
export const FIELD_TYPE = {
	string: "string",
	number: "number",
	button: "button",
	spacer: "spacer",
	boolean: "boolean",
	separator: "separator",
	hilite: "hilite",
};

// Panel Container Types
export const PANEL_TYPE = {
	stack: "stack",
	flow: "flow",
	grid: "grid",
	custom: "custom",
};

// define Grid Size constants
export const GRID_SIZE = {
	max: 12,
};

// contains all unique ids for special widgets
export const IDS = {
	createWidgets: {
		tabs: Symbol(),
		panel: Symbol(),
		field: Symbol(),
	},
	form: -1,
	customForm: -2,
	dumpField: 0,
};

export const PANEL_PROPS = {
	colSpan: 12,
	cols: 12,
	id: IDS.createWidgets.panel,
	image: "panel.png",
	items: [],
	layout: "grid",
	mappedBy: undefined,
	model: "com.axelor.meta.db.MetaJsonRecord",
	modelField: "attrs",
	relationship: undefined,
	title: undefined,
	type: ItemTypes.CONTAINER,
	widgetAttrs: JSON.stringify({
		showTitle: "false",
	}),
};

export const relationalFields = {
	OneToMany: "one-to-many",
	ManyToMany: "many-to-many",
	ManyToOne: "many-to-one",
	OneToOne: "one-to-one",
};

export const typeReplacer = {
	include: TYPE.panelInclude,
	MANY_TO_MANY: "many-to-many",
	MANY_TO_ONE: "many-to-one",
	ONE_TO_ONE: "one-to-one",
	ONE_TO_MANY: "one-to-many",
};

export const MODEL_TYPE = {
	BASE: "BASE",
	CUSTOM: "CUSTOM",
};

export const ENTITY_TYPE = {
	META: "META",
};

export const DEFAULT_VALUE = {
	showTitle: true,
	readonly: false,
	required: false,
	hidden: false,
	sidebar: false,
	canCollapse: false,
	stacked: false,
	canMove: false,
	canSearch: false,
	multiline: false,
};

export const DataTypes = [
	"string",
	"integer",
	"decimal",
	"boolean",
	"datetime",
	"date",
	"time",
	"many-to-one",
	"one-to-many",
	"many-to-many",
];

export const conditionProperties = {
	readonlyIf: "readonly",
	requiredIf: "required",
	hideIf: "hidden",
	collapseIf: "canCollapse",
};

export const otherNoQuoteProps = [
	"value:add",
	"value:del",
	"refresh",
	"active",
];

export const ACTIONS = {
	MODEL: 0,
	GLOBAL: 1,
	OTHER: 2,
};

export const SHOW_MORE = "Show more...";
