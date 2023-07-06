import React from "react";
import classNames from "classnames";
import { IDS, FIELD_TYPE, TYPE } from "../constants";
import RelationalFieldGridView from "./RelationalFieldGridView";
import { translate } from "../utils";

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
	];
	// return valid object with values
	return allowed.reduce((obj, attr) => {
		if (props[attr] !== undefined) obj[attr] = props[attr];
		if (attr === "required") {
			obj[attr] = props[attr] === "true";
		}
		return obj;
	}, {});
};

// Plain Textbox
export const TextInput = (props) => {
	return (
		<input type="text" autoComplete="off" {...props} className="text-input" />
	);
};

// Multiline Textbox i.e. Textarea
export const MultiTextInput = (props) => {
	return <textarea rows={6} {...props} />;
};

// Blank Spacer to fill up space between two cells of Grid
export const Spacer = (props) => <div className="spacer" />;

export const Separator = (props) => (
	<div className="spacer">
		<hr className="separator-field" />
	</div>
);

export const Boolean = ({ inputProps, ...props }) => (
	<div className="boolean-wrapper">
		<input {...inputProps} type="checkbox" />
		<span className="boolean-text" title={translate(props.title || props.name)}>
			{translate(props.title || props.name)}
		</span>
	</div>
);

// Button component
export const Button = ({ title, ...props }) => (
	<div className="button-container">
		<button {...props} className="button-view" title={translate(title)}>
			{translate(title)}
		</button>
	</div>
);

export const MenuItem = ({ title, ...props }) => (
	<div className="menu-item-container">{translate(title)}</div>
);

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
	);
};

/**
 * Form "Field" Component
 * Used For User Inputs
 */
function FieldComponent({ id, attrs }) {
	// check for dump field for empty panels
	if (id === IDS.dumpField) {
		return <div className="dump-field" />;
	}

	const { name, title, serverType, multiline, type, autoTitle, widget } = attrs;
	const inputProps = filterInputProps(attrs);
	let _type =
		serverType && serverType !== "field" ? serverType.toLowerCase() : type;
	const DefaultWidget = () => (
		<React.Fragment>
			{
				<label
					className="widget label"
					title={translate(title || attrs.autoTitle || name)}
				>
					{translate(title || attrs.autoTitle || name)}
				</label>
			}
			{multiline ? (
				<MultiTextInput {...inputProps} />
			) : attrs.widget === "Image" ? (
				<img
					alt={title || attrs.autoTitle || name}
					src="./images/not_found.png"
					className="image-widget"
				/>
			) : (
				<TextInput
					type={serverType === FIELD_TYPE.number ? "number" : "text"}
					{...inputProps}
				/>
			)}
		</React.Fragment>
	);

	switch (_type?.toLowerCase()) {
		case FIELD_TYPE.boolean:
			return (
				<Boolean
					title={title || autoTitle}
					name={name}
					inputProps={inputProps}
				/>
			);
		case FIELD_TYPE.spacer:
			return <Spacer />;
		case FIELD_TYPE.hilite:
			return <Hilite {...attrs} />;
		case FIELD_TYPE.separator:
		case TYPE.divider:
			return <Separator />;
		case TYPE.menuItem:
			return <MenuItem title={title} />;
		case FIELD_TYPE.button:
			return <Button {...inputProps} title={title || name} />;
		case "selection":
		case "label": {
			return <span dangerouslySetInnerHTML={{ __html: title }} />;
		}
		case "panel-dashlet":
		case "panel-related":
		case "one-to-many":
		case "json-one-to-many":
			return <RelationalFieldGridView attrs={attrs} id={id} />;
		case "many-to-many":
		case "json-many-to-many":
			return widget !== "TagSelect" ? (
				<RelationalFieldGridView attrs={attrs} id={id} />
			) : (
				<DefaultWidget />
			);
		default:
			return <DefaultWidget />;
	}
}

export default FieldComponent;
