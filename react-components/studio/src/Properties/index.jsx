import React, { useState } from "react";
import {
	TextField,
	Grid,
	Typography,
	FormControlLabel,
	Switch,
	IconButton,
} from "@material-ui/core";
import classNames from "classnames";
import { makeStyles } from "@material-ui/core/styles";
import { options } from "./list";
import {
	camleCaseString,
	translate,
	getProperty,
	getPropertyValue,
	generateFieldUniqueTitle,
	capitalizeFirst,
} from "../utils";
import SelectComponent from "../components/SelectComponent";
import { MODEL_TYPE, TYPE, ENTITY_TYPE } from "../constants";
import { useStore } from "../store/context";
import {
	FormView,
	GridView,
	JsonRelationalField,
	SelectableType,
	TargetJsonModel,
	TargetModel,
} from "./propertyFields";
import TranslationGrid from "../components/TranslationGrid";
import TranslateIcon from "@material-ui/icons/Translate";
import CloseIcon from "@material-ui/icons/Delete";
import ClearIcon from "@material-ui/icons/Close";
import { getSelectionText } from "../Toolbar/api";
import StaticSelection from "./widgets/StaticSelection";
import SelectionWidget from "./widgets/SelectionWidget";
import DialogConfirmation from "../Toolbar/DeleteConfirmation";
import OnlyIfComponent from "./widgets/OnlyIf";

const useStyles = makeStyles({
	input: {
		backgroundColor: "#293846",
		marginTop: 15,
		".modern-dark &": {
			backgroundColor: "#323232",
		},
		"& .MuiInputBase-inputMultiline": {
			height: "auto !important",
		},
	},
	translationInput: {
		paddingTop: 10,
		paddingBottom: 10,
	},
	translationInputView: {
		backgroundColor: "#293846",
		marginBottom: 5,
		".modern-dark &": {
			backgroundColor: "#323232",
		},
	},
	label: {
		color: "#f7f7f7",
		fontSize: 12,
		"&#outlined-basic-label": {
			color: "#f7f7f7",
		},
		"&.MuiInputLabel-shrink": {
			top: "1px !important",
		},
	},
	outlinedRoot: {
		color: "#ffffff",
		"&:hover $notchedOutline": {
			borderColor: "#ffffff",
		},
		"&$focused $notchedOutline": {
			borderColor: "white",
			borderWidth: 1,
		},
	},
	notchedOutline: {},
	focused: {
		color: "#ffffff",
	},
	switchBase: {
		"&$checked": {
			color: "#ffffff",
		},
		"&$checked + $track": {
			backgroundColor: "#ffffff",
		},
	},
	checked: {},
	track: {},
	selection: {
		color: "#ffffff",
		backgroundColor: "#293846",
		".modern-dark &": {
			backgroundColor: "#323232",
		},
	},
	iconOutlined: {
		color: "#ffffff",
	},
	panelTitle: {
		color: "white",
		fontWeight: "600",
	},
	panelMargin: {
		margin: "25px 0px 0px 0px",
	},
	disableInput: {
		color: "#a3a3a3 !important",
	},
	unique: {
		color: "#0275d8",
	},
	required: {
		color: "red",
	},
	translateButton: {
		color: "#ffffff",
		padding: "10px 12px",
		"& > span > svg": {
			fontSize: "1.1rem",
		},
	},
	staticSelectMenuItem: {
		color: "#ffffff",
		backgroundColor: "rgb(41, 56, 70) !important",
		"&:hover": {
			backgroundColor: "#293846 !important",
		},
	},
	autoComplete: {
		width: "100%",
		marginTop: 15,
		backgroundColor: "#293846",
		"& > div > label": {
			color: "#ffffff !important",
			fontSize: 13,
		},
		".modern-dark &": {
			backgroundColor: "#323232",
		},
	},
	autoCompleteInput: {
		color: "#ffffff",
		fontSize: 13,
	},
	autoCompleteOption: {
		fontSize: 13,
		"& ul, .MuiAutocomplete-noOptions": {
			backgroundColor: "rgb(41, 56, 70) !important",
			".modern-dark &": {
				backgroundColor: "#1b1b1b !important",
			},
		},
		"& li, .MuiAutocomplete-noOptions": {
			color: "#ffffff !important",
			backgroundColor: "rgb(41, 56, 70) !important",
			".modern-dark &": {
				backgroundColor: "#1b1b1b !important",
			},
		},
		"& li:hover, .MuiAutocomplete-noOptions": {
			color: "#ffffff !important",
			backgroundColor: "#2f4050 !important",
			".modern-dark &": {
				backgroundColor: "#323232 !important",
			},
		},
	},
	textFieldInput: {
		fontSize: 13,
	},
	booleanInputLabel: {
		fontSize: 12,
	},
	disabled: {
		color: "#a3a3a3 !important",
		fontSize: 12,
	},
});

const PropertiesContext = React.createContext();

function Label(text, field) {
	const classes = useStyles();
	return (
		<span>
			<span>{text}</span>
			{field.unique && (
				<span className={classes.unique}> ({translate("unique")}) </span>
			)}
			{field.required && <span className={classes.required}> * </span>}
		</span>
	);
}

const isValueGenerated = (value) => {
	return value.includes("studio:");
};

const hasPropertyToShow = (list, type, editWidgetType) => {
	return (
		list.filter(
			(item) =>
				!item.dependModelType ||
				editWidgetType === "customField" ||
				item.dependModelType === type
		).length > 0
	);
};

function StringInput(_props) {
	const {
		index,
		multiline = false,
		error,
		parentPanel,
		onTranslationRemove,
		clearable = false,
		isStudioLite,
	} = _props;
	const classes = useStyles();
	const [confirm, setConfirm] = React.useState(false);
	const {
		title,
		name,
		type,
		required,
		readOnly,
		max,
		min,
		parentField,
		translationView,
		...rest
	} = _props.field;
	const props = React.useContext(PropertiesContext);
	const {
		propertyList,
		setPropertyList,
		onChange,
		modelType,
		metaFieldStore = [],
		editWidgetType,
	} = props;
	let label = Label(translate(camleCaseString(title || name)), _props.field);
	let placeholder = translate(camleCaseString(title || name));
	if (name === "showIf" || name === "requiredIf") {
		placeholder = "id == 1";
	} else if (name === "hideIf") {
		placeholder = "id == null";
	} else if (name === "readOnlyIf") {
		placeholder = "id != null";
	}
	let value = propertyList[name] || "";
	if (
		(modelType === rest.modelType || props.editWidgetType === "customField") &&
		parentField
	) {
		const field = propertyList[parentField]
			? JSON.parse(propertyList[parentField])
			: {};
		value = field[name] || "";
	}
	if (rest.formatter) {
		value = rest.formatter(value, propertyList);
	}
	let disabled = Boolean(readOnly);

	if (rest.isDisabled) {
		disabled = rest.isDisabled({
			properties: propertyList,
			metaFieldStore,
			editWidgetType,
			modelType,
			parentPanel,
			isStudioLite,
		});
	}

	const handleTranslationClick = React.useCallback(() => {
		if (isValueGenerated(value)) {
			return;
		}
		const newValue = generateFieldUniqueTitle({
			name,
			fieldName: propertyList[name] || type,
		});
		onChange(
			{
				...(propertyList || {}),
				...getProperty(
					name,
					newValue,
					parentField,
					propertyList[parentField],
					!(modelType === rest.modelType) || editWidgetType === "customField"
				),
			},
			name
		);
	}, [
		propertyList,
		name,
		type,
		value,
		onChange,
		rest.modelType,
		modelType,
		parentField,
		editWidgetType,
	]);

	const handleTranslationRemove = React.useCallback(() => {
		setConfirm(false);
		onChange(
			{
				...(propertyList || {}),
				...getProperty(
					name,
					"",
					parentField,
					propertyList[parentField],
					!(modelType === rest.modelType)
				),
			},
			name
		);
		onTranslationRemove(value);
	}, [
		onTranslationRemove,
		value,
		name,
		parentField,
		modelType,
		onChange,
		propertyList,
		rest.modelType,
	]);

	const removeTranslation = React.useCallback(() => {
		setConfirm(true);
	}, []);

	const onClose = React.useCallback(() => {
		setConfirm(false);
	}, []);

	const savedValue = React.useRef(value);
	return (
		<React.Fragment>
			<TextField
				error={(required && !value) || Boolean(error)}
				helperText={error}
				InputLabelProps={{
					className: disabled ? classes.disabled : classes.label,
				}}
				size="small"
				InputProps={{
					classes: {
						root: classes && disabled ? "" : classes.outlinedRoot,
						notchedOutline: classes && classes.notchedOutline,
						focused: classes && classes.focused,
						disabled: classes && classes.disableInput,
						input: classes && classes.textFieldInput,
					},
					endAdornment: translationView ? (
						isValueGenerated(value) ? (
							<IconButton
								className={classes.translateButton}
								onClick={removeTranslation}
							>
								<CloseIcon />
							</IconButton>
						) : (
							<IconButton
								className={classes.translateButton}
								onClick={handleTranslationClick}
							>
								<TranslateIcon />
							</IconButton>
						)
					) : clearable ? (
						<IconButton
							className={classes.translateButton}
							onClick={() => {
								let value = "";
								let flag = true;
								if (
									rest.modelType === MODEL_TYPE.BASE &&
									props.editWidgetType !== "customField"
								) {
									flag =
										value === ""
											? propertyList[name] !== undefined
												? true
												: false
											: true;
								}
								if (
									rest.modelType === MODEL_TYPE.CUSTOM &&
									props.editWidgetType === "customField"
								) {
									// set null value when value is negative for custom view & custom fields
									value = value || null;
								}
								if (flag) {
									onChange(
										{
											...(propertyList || {}),
											...getProperty(
												name,
												value,
												parentField,
												propertyList[parentField],
												!(modelType === rest.modelType) ||
													editWidgetType === "customField"
											),
										},
										name
									);
								}
							}}
						>
							<ClearIcon />
						</IconButton>
					) : null,
				}}
				inputProps={{ min: min, max: max }}
				key={index}
				className={classes && classes.input}
				id="outlined-basic"
				multiline={multiline}
				type={type === "integer" ? "number" : type}
				label={translate(label)}
				placeholder={translate(placeholder)}
				variant="outlined"
				disabled={disabled || (translationView && isValueGenerated(value))}
				value={value}
				minRows={3}
				onFocus={() => {
					savedValue.current = value;
				}}
				autoComplete="off"
				onChange={(e) => {
					if (type === "integer" && isNaN(Number(e.target.value))) {
						return;
					}
					if (min && max) {
						const value = Number(e.target.value);
						if (value < min || value > max) {
							return;
						}
					}
					let value = e.target.value;
					setPropertyList({
						...(propertyList || {}),
						...getProperty(
							name,
							value,
							parentField,
							propertyList[parentField],
							!(modelType !== rest.modelType) ||
								editWidgetType === "customField"
						),
					});
				}}
				onBlur={(e) => {
					if (savedValue.current === value) return;
					if (type === "integer" && isNaN(Number(e.target.value))) {
						return;
					}
					if (min && max) {
						const value = Number(e.target.value);
						if (value < min || value > max) {
							return;
						}
					}
					let _value = e.target.value;
					let flag = true;
					if (
						rest.modelType === MODEL_TYPE.BASE &&
						props.editWidgetType !== "customField"
					) {
						flag =
							_value === ""
								? propertyList[name] !== undefined
									? true
									: false
								: true;
					}
					if (
						rest.modelType === MODEL_TYPE.CUSTOM &&
						props.editWidgetType === "customField"
					) {
						// set null value when value is negative for custom view & custom fields
						_value = _value || null;
					}
					if (flag) {
						onChange(
							{
								...(propertyList || {}),
								...getProperty(
									name,
									_value?.trim(),
									parentField,
									propertyList[parentField],
									!(modelType === rest.modelType) ||
										editWidgetType === "customField"
								),
							},
							name
						);
					}
				}}
			/>
			{translationView && isValueGenerated(value) && (
				<TranslationGrid
					InputProps={{
						classes: {
							root: classes && classes.outlinedRoot,
							notchedOutline: classes && classes.notchedOutline,
							focused: classes && classes.focused,
							disabled: classes && classes.disableInput,
							input: classes && classes.translationInput,
						},
					}}
					InputLabelProps={{
						className: disabled ? classes.disabled : classes.label,
					}}
					className={classes && classes.translationInputView}
					keyValue={value}
				/>
			)}
			{confirm && (
				<DialogConfirmation
					open={confirm}
					message="Are you sure, do you want to delete translations?"
					onClose={onClose}
					onOk={handleTranslationRemove}
				/>
			)}
		</React.Fragment>
	);
}

function BooleanField(_props) {
	const [openAlert, setAlertOpen] = useState(false);
	const { index } = _props;
	let { name, title, parentField, defaultValue, uncheckDialog, ...rest } =
		_props.field;
	const props = React.useContext(PropertiesContext);
	const {
		propertyList,
		setPropertyList,
		onChange,
		modelType,
		editWidgetType,
		metaFieldStore,
		id,
		mainItems,
		parentPanel,
	} = props;
	let _value = getPropertyValue(
		propertyList,
		name,
		parentField,
		defaultValue,
		!(modelType !== rest.modelType) || editWidgetType === "customField"
	);
	let fieldValue = Boolean(_value ? !(_value === "false") : _value);
	const classes = useStyles();
	if (rest.getValue) {
		fieldValue = rest.getValue(propertyList);
	}
	let disabled = false;
	let hide = false;
	if (rest.isDisabled) {
		disabled = rest.isDisabled({
			properties: propertyList,
			metaFieldStore,
			editWidgetType,
			modelType,
			id,
			mainItems,
		});
	}
	if (rest.isHidden) {
		hide = rest.isHidden({ parentPanel });
	}
	title = translate(camleCaseString(title || name));

	const handleOnChange = () => {
		if (uncheckDialog) {
			setAlertOpen(false);
		}
		setPropertyList({
			...propertyList,
			...(rest.change ? rest.change(!fieldValue, propertyList) : {}),
			...getProperty(
				name,
				!fieldValue,
				parentField,
				propertyList[parentField],
				!(modelType !== rest.modelType) || editWidgetType === "customField"
			),
		});
		onChange(
			{
				...propertyList,
				...(rest.change ? rest.change(!fieldValue, propertyList) : {}),
				...getProperty(
					name,
					!fieldValue,
					parentField,
					propertyList[parentField],
					!(modelType !== rest.modelType) || editWidgetType === "customField"
				),
			},
			name
		);
	};
	return (
		<React.Fragment>
			{!hide && (
				<FormControlLabel
					style={{ marginTop: 15, alignSelf: "flex-start" }}
					key={index}
					classes={{
						label: classes && classes.booleanInputLabel,
						disabled: classes.disabled,
					}}
					control={
						<Switch
							classes={{
								switchBase: classes && classes.switchBase,
								track: classes && classes.track,
								checked: classes && classes.checked,
							}}
							checked={fieldValue}
							disabled={disabled}
							onChange={() => {
								if (
									uncheckDialog &&
									fieldValue &&
									propertyList &&
									propertyList.selectionText
								) {
									setAlertOpen(true);
									return;
								}
								handleOnChange();
							}}
							value={propertyList[name]}
						/>
					}
					label={translate(camleCaseString(title || name))}
				/>
			)}
			{openAlert && (
				<DialogConfirmation
					open={openAlert}
					message="Are you sure?"
					onClose={() => setAlertOpen(false)}
					onOk={handleOnChange}
					title="Confirm"
				/>
			)}
		</React.Fragment>
	);
}

function checkDepend(field, propertyList) {
	if (field.depends) {
		const value = propertyList[field.depends];
		if (field.dependValue !== value) {
			return false;
		}
		return true;
	}
	return;
}

function checkModel(field, modelType, editWidgetType, propertyList) {
	if (field.dependModelType && field.dependModelType !== modelType) {
		if (editWidgetType !== "customField") {
			return false;
		}
	}
	if (field.showInBaseView === false && editWidgetType !== "customField") {
		return false;
	}
	if (editWidgetType === "customField" && field.showInCustomField === false) {
		return false;
	}
	if (field.shouldRender && !field.shouldRender(propertyList)) {
		return false;
	}
	return true;
}

function RenderPropertyField() {
	const props = React.useContext(PropertiesContext);
	const {
		elements,
		id,
		propertyList,
		enableStudioApp,
		modelType,
		editWidgetType,
		errors,
		entityType,
		actualType,
		parentPanel,
		onTranslationRemove,
		isStudioLite,
	} = props;
	return (
		<>
			{elements.map((field, index) => {
				const depend = checkDepend(field, propertyList);
				if (depend === false) {
					return null;
				}
				if (!checkModel(field, modelType, editWidgetType, propertyList)) {
					return null;
				}
				if (field.name === "studioApp" && !enableStudioApp) {
					return null;
				}
				if (
					[actualType, entityType].includes(ENTITY_TYPE.META) &&
					field.name === "packageName"
				) {
					return null;
				}
				const key = `${index}_${id}`;
				switch (field.type) {
					case "string":
						return (
							<StringInput
								field={field}
								key={key}
								index={key}
								multiline={false}
								error={errors[field.name]}
								isStudioLite={isStudioLite}
								onTranslationRemove={onTranslationRemove}
							/>
						);
					case "integer":
						return (
							<StringInput
								field={field}
								key={key}
								index={key}
								multiline={false}
								error={errors[field.name]}
								parentPanel={parentPanel}
								clearable={true}
							/>
						);
					case "boolean":
						return (
							<BooleanField
								field={field}
								key={key}
								index={key}
								error={errors[field.name]}
							/>
						);
					case "selection":
						return (
							<SelectionWidget
								field={field}
								key={key}
								index={key}
								props={props}
								error={errors[field.name]}
							/>
						);
					case "select":
					case "objectSelection":
						return (
							<SelectComponent
								field={field}
								key={key}
								index={key}
								props={props}
								error={errors[field.name]}
							/>
						);
					case "staticSelect":
						return (
							<StaticSelection
								field={field}
								key={key}
								index={key}
								error={errors[field.name]}
								parentPanel={parentPanel}
								props={props}
							/>
						);
					case "text":
						return (
							<StringInput
								field={field}
								key={key}
								index={key}
								multiline={true}
								error={errors[field.name]}
							/>
						);
					case "onlyIf":
						return (
							<OnlyIfComponent
								field={field}
								key={key}
								props={props}
								error={errors[field.name]}
							/>
						);
					default:
						return (
							<StringInput
								field={field}
								key={key}
								index={key}
								error={errors[field.name]}
							/>
						);
				}
			})}
		</>
	);
}

function PropertiesProvider({ children, ...value }) {
	return (
		<PropertiesContext.Provider value={value}>
			{children}
		</PropertiesContext.Provider>
	);
}

export default function Properties(props) {
	const { state, onWidgetChange, onTranslationRemove } = useStore();
	const {
		widgets,
		editWidget,
		editWidgetType,
		customFieldWidgets,
		modelType,
		enableStudioApp,
		metaFieldStore = [],
		errorList = {},
		entityType,
		actualType,
		isStudioLite,
		mainItems,
	} = state;
	let widget = null;
	if (editWidget) {
		if (editWidgetType === "customField" && customFieldWidgets) {
			widget = customFieldWidgets[editWidget];
		} else if (editWidgetType !== "customField" && widgets) {
			widget = widgets[editWidget];
		}
	}
	const { serverType, isSelectionField } = widget || {};
	let { type } = widget || {};
	let selectedType =
		serverType === "field" ? type || "string" : serverType || type;
	selectedType = selectedType && selectedType.toLowerCase().replace(/_/g, "-");
	if (selectedType === "datetime") {
		const field = metaFieldStore?.find((f) => f.name === widget.name);
		if (field && `${field.tz}` === "true") {
			selectedType = "zoneddatetime";
		}
	}
	const [propertyList, setPropertyList] = useState({});
	let property = options.find((option) => option.type === selectedType);
	if (selectedType === "form") {
		if (state.modelType === MODEL_TYPE.CUSTOM) {
			property = options.find((option) => option.type === "modelForm");
		}
	}
	if (isSelectionField) {
		selectedType = ["string", "integer"].includes(widget && widget.type)
			? widget.type
			: selectedType;
		if (property && property.value) {
			const typeFieldIndex = property.value.overview.findIndex(
				(item) => item.name === "type"
			);
			property.value.overview.splice(typeFieldIndex, 1, SelectableType);
			const { fieldOptions, widgetAttributes } =
				(property && property.value) || {};
			property = {
				...(property || {}),
				value: {
					...(property.value || {}),
					fieldOptions: (fieldOptions || []).filter(
						(f) => !["minSize", "maxSize", "regex"].includes(f.name)
					),
					widgetAttributes: (widgetAttributes || []).filter(
						(f) => !["multiline"].includes(f.name)
					),
				},
			};
		}
	}
	const classes = useStyles();
	const inputLabel = React.useRef(null);
	const [labelWidth, setLabelWidth] = React.useState(0);
	React.useEffect(() => {
		setPropertyList({
			...(widget || {}),
			type: selectedType,
		});
		setLabelWidth(
			inputLabel && inputLabel.current && inputLabel.current.offsetWidth
		);
	}, [widget, selectedType]);

	async function onChange(
		props,
		changedPropertyName,
		skipGenerateHistory = false
	) {
		const newProperties = { ...props };
		if (changedPropertyName === JsonRelationalField.name) {
			// when isJsonRelationalField changes
			newProperties[TargetJsonModel.name] = null;
			newProperties[TargetModel.name] = null;
			newProperties[GridView.name] = null;
			newProperties[FormView.name] = null;
		}
		if (
			changedPropertyName !== JsonRelationalField.name &&
			changedPropertyName !== "type"
		) {
			newProperties.type = widget.type;
		}
		/* selectionText implementation starts here */
		if (
			changedPropertyName === "updateSelection" &&
			!newProperties.updateSelection
		) {
			newProperties.selection = null;
			newProperties.selectionText = null;
		}
		if (!newProperties.updateSelection) {
			newProperties.selectionText = null;
		} else {
			const obj = { name: newProperties.selection };
			const text = await getSelectionText(obj);
			newProperties.selectionText = newProperties.selectionText || text;
		}
		if (
			newProperties.selection &&
			newProperties.updateSelection &&
			!changedPropertyName
		) {
			const obj = { name: newProperties.selection };
			const text = await getSelectionText(obj);
			newProperties.selectionText = newProperties.selectionText || text;
		}
		if (!newProperties.selection && !changedPropertyName) {
			newProperties.selectionText = "";
		}
		if (
			newProperties.selection &&
			typeof newProperties.selection === "object"
		) {
			newProperties.selection = newProperties.selection.name;
		}
		if (newProperties.widgetAttrs) {
			const obj = {};
			const widgetAttrs = JSON.parse(newProperties.widgetAttrs || "{}");
			Object.keys(widgetAttrs).forEach((widget) => {
				obj[widget] =
					typeof widgetAttrs[widget] === "string"
						? widgetAttrs[widget]?.trim() === ""
							? null
							: widgetAttrs[widget]?.trim()
						: widgetAttrs[widget];
			});
			newProperties.widgetAttrs = JSON.stringify(obj);
		}
		setPropertyList({
			...newProperties,
		});
		/* selectionText implementation ends here */
		onWidgetChange({
			id: editWidget,
			props: { ...newProperties },
			skipGenerateHistory,
		});
	}

	type = selectedType;
	let errors = {};
	if (editWidget && errorList) {
		errors = errorList[editWidget] || {};
	}
	const parentPanel = Object.values(widgets || {}).find(
		(w) => w.items && w.items.indexOf(editWidget) !== -1
	);
	if (widget?.type === "panel-tabs" && editWidgetType === "customField") {
		return null;
	}
	if (
		property?.dependModelType &&
		`${widget?.tab}` === "true" &&
		property?.dependModelType !== modelType
	) {
		return null;
	}

	return (
		<Grid style={{ padding: 20 }}>
			{type &&
				property &&
				!(
					state.modelType === MODEL_TYPE.CUSTOM && property.type === TYPE.tabs
				) &&
				Object.keys(property.value).map((panel, i) => (
					<Grid key={i}>
						<Typography
							variant="body1"
							className={classNames(
								classes.panelTitle,
								i !== 0 && classes.panelMargin
							)}
						>
							{hasPropertyToShow(
								property.value[panel],
								modelType,
								editWidgetType
							) && translate(capitalizeFirst(panel))}
						</Typography>
						<Grid style={{ display: "flex", flexDirection: "column" }}>
							<PropertiesProvider
								key={editWidget}
								elements={property.value[panel]}
								propertyList={propertyList}
								setPropertyList={setPropertyList}
								labelWidth={labelWidth}
								inputLabel={inputLabel}
								type={type}
								onWidgetChange={onWidgetChange}
								id={editWidget}
								onChange={onChange}
								modelType={modelType}
								enableStudioApp={enableStudioApp}
								editWidgetType={editWidgetType}
								metaFieldStore={metaFieldStore}
								errors={errors}
								entityType={entityType}
								actualType={actualType}
								parentPanel={parentPanel}
								onTranslationRemove={onTranslationRemove}
								isStudioLite={isStudioLite}
								mainItems={mainItems}
							>
								<RenderPropertyField />
							</PropertiesProvider>
						</Grid>
					</Grid>
				))}
		</Grid>
	);
}
