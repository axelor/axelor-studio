import React from "react"
import classNames from "classnames"
import { Button, Input, Box } from "@axelor/ui"
import { IDS, FIELD_TYPE, TYPE } from "../constants"
import RelationalFieldGridView from "./RelationalFieldGridView"
import { ReactComponent as NotFoundImage } from "../images/not_found.svg"
import { translate } from "../utils"

// filter html(tags) compatible attributes
const filterInputProps = (props) => {
	const allowed = [
		"name",
		"title",
		"defaultValue",
		"placeholder",
		"readOnly",
		"checked",
		"disabled",
		"rows",
		"required",
	]
	// return valid object with values
	return allowed.reduce((obj, attr) => {
		if (props[attr] !== undefined) obj[attr] = props[attr]
		if (attr === "required") {
			obj[attr] = props[attr] === "false"
		}
		return obj
	}, {})
}

// Plain Textbox
export const TextInput = (props) => {
	return <Input autoComplete="off" {...props} />
}

// Multiline Textbox i.e. Textarea
export const MultiTextInput = (props) => {
	return <Input as="textarea" rows={6} {...props} />
}

// Blank Spacer to fill up space between two cells of Grid
export const Spacer = () => <div className="spacer" />

export const Separator = () => (
	<div className="separator-container">
		<hr className="separator-field" />
	</div>
)

export const Boolean = ({ inputProps, ...props }) => (
	<Box flexDirection="column" d="flex" py={2}>
		<Box
			overflow="hidden"
			style={{ textOverflow: "ellipsis" }}
			title={translate(props.title || props.name)}
		>
			{translate(props.title || props.name)}
		</Box>
		<Input mt={0} {...inputProps} type="checkbox" />
	</Box>
)

// Button component
export const ButtonWidget = ({ title, ...props }) => (
	<Button
		{...props}
		color="light"
		bgColor="primary"
		overflow="hidden"
		style={{ textOverflow: "ellipsis" }}
		title={translate(title)}
	>
		{translate(title)}
	</Button>
)

export const MenuItem = ({ title, ...props }) => (
	<div className="menu-item-container">{translate(title)}</div>
)

export const Hilite = ({ color, background, strong }) => {
	return (
		<div
			className={classNames(
				`hilite hilite hilite-background-${background} hilite-text-${color}`,
				{ "hilite-strong": strong }
			)}
		>
			{translate("hilite")}
		</div>
	)
}

/**
 * Form "Field" Component
 * Used For User Inputs
 */
function FieldComponent({ id, attrs }) {
	// check for dump field for empty panels
	if (id === IDS.dumpField) {
		return <div className="dump-field" />
	}

	const { name, title, serverType, multiline, type, autoTitle, widget } = attrs
	const inputProps = filterInputProps(attrs)

	let _type =
		serverType && serverType !== "field" ? serverType.toLowerCase() : type
	const DefaultWidget = () => (
		<React.Fragment>
			{
				<Box
					color="body"
					className="widget label"
					title={translate(title || attrs.autoTitle || name)}
				>
					{translate(title || attrs.autoTitle || name)}
				</Box>
			}
			{multiline ? (
				<MultiTextInput {...inputProps} />
			) : attrs.widget === "Image" ? (
				<NotFoundImage style={{ height: "120px" }} />
			) : (
				<TextInput
					type={serverType === FIELD_TYPE.number ? "number" : "text"}
					{...inputProps}
				/>
			)}
		</React.Fragment>
	)

	switch (_type?.toLowerCase()) {
		case FIELD_TYPE.boolean:
			return (
				<Boolean
					title={title || autoTitle}
					name={name}
					inputProps={inputProps}
				/>
			)
		case FIELD_TYPE.spacer:
			return <Spacer />
		case FIELD_TYPE.hilite:
			return <Hilite {...attrs} />
		case FIELD_TYPE.separator:
		case TYPE.divider:
			return <Separator />
		case TYPE.menuItem:
			return <MenuItem title={title} />
		case FIELD_TYPE.button:
			return <ButtonWidget {...inputProps} title={title || name} />
		case "selection":
		case "label": {
			return (
				<Box
					d="inline"
					color="body"
					dangerouslySetInnerHTML={{ __html: title }}
				/>
			)
		}
		case "panel-dashlet":
		case "panel-related":
		case "one-to-many":
		case "json-one-to-many":
			return <RelationalFieldGridView attrs={attrs} id={id} />
		case "many-to-many":
		case "json-many-to-many":
			return widget !== "TagSelect" ? (
				<RelationalFieldGridView attrs={attrs} id={id} />
			) : (
				<DefaultWidget />
			)
		default:
			return <DefaultWidget />
	}
}

export default FieldComponent
