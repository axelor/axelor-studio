/** Set field types */
export const StringField = ({ ...props }) => ({
	type: "string",
	...props,
})

export const ObjectSelectionField = ({ ...props }) => ({
	type: "objectSelection",
	...props,
})

export const IntegerField = ({ ...props }) => ({
	type: "integer",
	...props,
})

export const SelectField = ({ ...props }) => ({
	type: "select",
	valueField: "name",
	...props,
})

export const StaticSelectField = ({ ...props }) => ({
	type: "staticSelect",
	...props,
})

export const BooleanField = ({ ...props }) => ({
	type: "boolean",
	...props,
})
