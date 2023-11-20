import React, { useState } from "react"
import {
	TextField,
	Grid,
	Typography,
	FormControlLabel,
	Switch,
	IconButton,
} from "@mui/material"
import { options } from "./list"
import {
	camleCaseString,
	translate,
	getProperty,
	getPropertyValue,
	capitalizeFirst,
} from "../utils"
import SelectComponent from "../components/SelectComponent"
import { MODEL_TYPE, TYPE, ENTITY_TYPE } from "../constants"
import { useStore } from "../store/context"
import {
	FormView,
	GridView,
	JsonRelationalField,
	SelectableType,
	TargetJsonModel,
	TargetModel,
} from "./propertyFields"
import ClearIcon from "@mui/icons-material/Close"
import { getSelectionText } from "../Toolbar/api"
import StaticSelection from "./widgets/StaticSelection"
import SelectionWidget from "./widgets/SelectionWidget"
import DialogConfirmation from "../Toolbar/DeleteConfirmation"
import OnlyIfComponent from "./widgets/OnlyIf"

const PropertiesContext = React.createContext()

function Label(text, field) {
	return (
		<span>
			<span>{text}</span>
			{field.unique && (
				<span style={{ WebkitTextFillColor: "#0275d8" }}>
					{` (${translate("unique")}) `}
				</span>
			)}
			{field.required && (
				<span style={{ WebkitTextFillColor: "red" }}> * </span>
			)}
		</span>
	)
}

const hasPropertyToShow = (list, type, editWidgetType) => {
	return (
		list.filter(
			(item) =>
				!item.dependModelType ||
				editWidgetType === "customField" ||
				item.dependModelType === type
		).length > 0
	)
}

function StringInput(_props) {
	const {
		index,
		multiline = false,
		error,
		parentPanel,
		clearable = false,
		isStudioLite,
	} = _props
	const {
		title,
		name,
		type,
		required,
		readOnly,
		max,
		min,
		parentField,
		...rest
	} = _props.field
	const props = React.useContext(PropertiesContext)
	const {
		propertyList,
		setPropertyList,
		onChange,
		modelType,
		metaFieldStore = [],
		editWidgetType,
	} = props
	let label = Label(translate(camleCaseString(title || name)), _props.field)
	let placeholder = translate(camleCaseString(title || name))
	if (name === "showIf" || name === "requiredIf") {
		placeholder = "id == 1"
	} else if (name === "hideIf") {
		placeholder = "id == null"
	} else if (name === "readOnlyIf") {
		placeholder = "id != null"
	}
	let value = propertyList[name] || ""
	if (
		(modelType === rest.modelType || props.editWidgetType === "customField") &&
		parentField
	) {
		const field = propertyList[parentField] || {}
		value = field[name] || ""
	}
	if (rest.formatter) {
		value = rest.formatter(value, propertyList)
	}
	let disabled = Boolean(readOnly)

	if (rest.isDisabled) {
		disabled = rest.isDisabled({
			properties: propertyList,
			metaFieldStore,
			editWidgetType,
			modelType,
			parentPanel,
			isStudioLite,
		})
	}

	const savedValue = React.useRef(value)
	return (
		<React.Fragment>
			<TextField
				sx={{
					marginTop: "15px",
					backgroundColor: "#293846",
					...(disabled
						? {}
						: {
								color: "#ffffff",
								"&:hover .MuiInputBase-root .MuiOutlinedInput-notchedOutline": {
									borderColor: "#ffffff",
								},
								"&:focus-within .MuiInputBase-root .MuiOutlinedInput-notchedOutline":
									{
										borderColor: "white",
										borderWidth: 1,
									},
						  }),

					"& .MuiInputBase-inputMultiline": {
						height: "auto !important",
					},
					"& .MuiFormLabel-root": {
						color: "#f7f7f7 !important",
						fontSize: 12,
						"&.MuiInputLabel-shrink": {
							top: "1px !important",
						},
					},
					"& .MuiInputBase-input": {
						color: "#f7f7f7 !important",
						fontSize: 13,
					},
					"& .Mui-disabled": {
						WebkitTextFillColor: "#a3a3a3 !important",
					},
				}}
				error={(required && !value) || Boolean(error)}
				helperText={error}
				size="small"
				InputLabelProps={{
					sx: {
						...(disabled
							? {}
							: {
									"& .MuiFormLabel-root": {
										color: "#f7f7f7 !important",
										fontSize: 12,
										"&.MuiInputLabel-shrink": {
											top: "1px !important",
										},
									},
							  }),
					},
				}}
				InputProps={{
					endAdornment: clearable ? (
						<IconButton
							sx={{
								color: "#ffffff",
								padding: "10px 12px",
								"& > span > svg": {
									fontSize: "1.1rem",
								},
							}}
							onClick={() => {
								let value = ""
								let flag = true
								if (
									rest.modelType === MODEL_TYPE.BASE &&
									props.editWidgetType !== "customField"
								) {
									flag =
										value === ""
											? propertyList[name] !== undefined
												? true
												: false
											: true
								}
								if (
									rest.modelType === MODEL_TYPE.CUSTOM &&
									props.editWidgetType === "customField"
								) {
									// set null value when value is negative for custom view & custom fields
									value = value || null
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
									)
								}
							}}
							size="large"
						>
							<ClearIcon sx={{ fontSize: "1.1rem" }} />
						</IconButton>
					) : null,
				}}
				inputProps={{ min: min, max: max }}
				key={index}
				id="outlined-basic"
				multiline={multiline}
				type={type === "integer" ? "number" : type}
				label={translate(label)}
				placeholder={translate(placeholder)}
				variant="outlined"
				disabled={disabled}
				value={value}
				minRows={3}
				onFocus={() => {
					savedValue.current = value
				}}
				autoComplete="off"
				onChange={(e) => {
					if (type === "integer" && isNaN(Number(e.target.value))) {
						return
					}
					if (min && max) {
						const value = Number(e.target.value)
						if (value < min || value > max) {
							return
						}
					}
					let value = e.target.value
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
					})
				}}
				onBlur={(e) => {
					if (savedValue.current === value) return
					if (type === "integer" && isNaN(Number(e.target.value))) {
						return
					}
					if (min && max) {
						const value = Number(e.target.value)
						if (value < min || value > max) {
							return
						}
					}
					let _value = e.target.value
					let flag = true
					if (
						rest.modelType === MODEL_TYPE.BASE &&
						props.editWidgetType !== "customField"
					) {
						flag =
							_value === ""
								? propertyList[name] !== undefined
									? true
									: false
								: true
					}
					if (
						rest.modelType === MODEL_TYPE.CUSTOM &&
						props.editWidgetType === "customField"
					) {
						// set null value when value is negative for custom view & custom fields
						_value = _value || null
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
						)
					}
				}}
			/>
		</React.Fragment>
	)
}

function BooleanField(_props) {
	const [openAlert, setAlertOpen] = useState(false)
	const { index } = _props
	let { name, title, parentField, defaultValue, uncheckDialog, ...rest } =
		_props.field
	const props = React.useContext(PropertiesContext)
	const {
		propertyList,
		setPropertyList,
		onChange,
		modelType,
		editWidgetType,
		metaFieldStore,
		id,
		hasOnlyOneNonSidebarItem,
		parentPanel,
	} = props
	let _value = getPropertyValue(
		propertyList,
		name,
		parentField,
		defaultValue,
		!(modelType !== rest.modelType) || editWidgetType === "customField"
	)
	let fieldValue = Boolean(_value ? !(_value === "false") : _value)
	if (rest.getValue) {
		fieldValue = rest.getValue(propertyList)
	}
	let disabled = false
	let hide = false
	if (rest.isDisabled) {
		disabled = rest.isDisabled({
			properties: propertyList,
			metaFieldStore,
			editWidgetType,
			modelType,
			id,
			hasOnlyOneNonSidebarItem,
			fieldValue,
		})
	}
	if (rest.isHidden) {
		hide = rest.isHidden({ parentPanel })
	}
	title = translate(camleCaseString(title || name))

	const handleOnChange = () => {
		if (uncheckDialog) {
			setAlertOpen(false)
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
		})
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
		)
	}
	return (
		<React.Fragment>
			{!hide && (
				<FormControlLabel
					sx={{
						marginTop: "15px",
						alignSelf: "flex-start",
						"& .MuiSwitch-root": {
							"& .MuiSwitch-thumb": {
								color: "#ffffff",
							},

							"& .Mui-checked + .MuiSwitch-track": {
								backgroundColor: "#ffffff",
							},
						},
						"& .Mui-disabled": {
							color: "#a3a3a3 !important",
						},
						"& .MuiTypography-root": {
							fontSize: 12,
						},
					}}
					key={index}
					control={
						<Switch
							checked={fieldValue}
							disabled={disabled}
							onChange={() => {
								if (
									uncheckDialog &&
									fieldValue &&
									propertyList &&
									propertyList.selectionText
								) {
									setAlertOpen(true)
									return
								}
								handleOnChange()
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
	)
}

function checkDepend(field, propertyList) {
	if (field.depends) {
		const value = propertyList[field.depends]
		if (field.dependValue !== value) {
			return false
		}
		return true
	}
	return
}

function checkModel(field, modelType, editWidgetType, propertyList) {
	if (field.dependModelType && field.dependModelType !== modelType) {
		if (editWidgetType !== "customField") {
			return false
		}
	}
	if (field.showInBaseView === false && editWidgetType !== "customField") {
		return false
	}
	if (editWidgetType === "customField" && field.showInCustomField === false) {
		return false
	}
	if (field.shouldRender && !field.shouldRender(propertyList)) {
		return false
	}
	return true
}

function RenderPropertyField() {
	const props = React.useContext(PropertiesContext)
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
		isStudioLite,
		loader,
	} = props
	return (
		<>
			{elements.map((field, index) => {
				const depend = checkDepend(field, propertyList)
				if (depend === false) {
					return null
				}
				if (!checkModel(field, modelType, editWidgetType, propertyList)) {
					return null
				}
				if (field.name === "studioApp" && !enableStudioApp) {
					return null
				}
				if (
					[actualType, entityType].includes(ENTITY_TYPE.META) &&
					field.name === "packageName"
				) {
					return null
				}
				const key = `${index}_${id}`
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
							/>
						)
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
						)
					case "boolean":
						return (
							<BooleanField
								field={field}
								key={key}
								index={key}
								error={errors[field.name]}
							/>
						)
					case "selection":
						return (
							<SelectionWidget
								field={field}
								key={key}
								index={key}
								props={props}
								error={errors[field.name]}
								loader={loader}
							/>
						)
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
						)
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
						)
					case "text":
						return (
							<StringInput
								field={field}
								key={key}
								index={key}
								multiline={true}
								error={errors[field.name]}
							/>
						)
					case "onlyIf":
						return (
							<OnlyIfComponent
								field={field}
								key={key}
								props={props}
								error={errors[field.name]}
							/>
						)
					default:
						return (
							<StringInput
								field={field}
								key={key}
								index={key}
								error={errors[field.name]}
							/>
						)
				}
			})}
		</>
	)
}

function PropertiesProvider({ children, ...value }) {
	return (
		<PropertiesContext.Provider value={value}>
			{children}
		</PropertiesContext.Provider>
	)
}

export default function Properties(props) {
	const { state, onWidgetChange } = useStore()
	const {
		widgets,
		editWidget,
		editWidgetType,
		customFieldWidgets,
		modelType,
		enableStudioApp,
		metaFieldStore = [],
		widgetErrorList = {},
		customErrorList = {},
		entityType,
		actualType,
		isStudioLite,
		hasOnlyOneNonSidebarItem,
	} = state

	let widget = null
	if (editWidget) {
		if (editWidgetType === "customField" && customFieldWidgets) {
			widget = customFieldWidgets[editWidget]
		} else if (editWidgetType !== "customField" && widgets) {
			widget = widgets[editWidget]
		}
	}
	const { serverType, isSelectionField } = widget || {}
	let { type } = widget || {}
	let selectedType =
		serverType === "field" ? type || "string" : serverType || type
	selectedType = selectedType && selectedType.toLowerCase().replace(/_/g, "-")
	if (selectedType === "datetime") {
		const field = metaFieldStore?.find((f) => f.name === widget.name)
		if (field && `${field.tz}` === "true") {
			selectedType = "zoneddatetime"
		}
	}
	const [propertyList, setPropertyList] = useState({})
	let property = options.find((option) => option.type === selectedType)
	if (selectedType === "form") {
		if (state.modelType === MODEL_TYPE.CUSTOM) {
			property = options.find((option) => option.type === "modelForm")
		}
	}
	if (isSelectionField) {
		selectedType = ["string", "integer"].includes(widget && widget.type)
			? widget.type
			: selectedType
		if (property && property.value) {
			const { fieldOptions, widgetAttributes, overview } =
				(property && property.value) || {}
			// INFO: If property is manipulated here, how validation works?
			// validation also imports property and it has no idea about this
			property = {
				...(property || {}),
				value: {
					...(property.value || {}),
					overview: ([...overview] || []).map((item) =>
						item.name === "type" ? SelectableType : item
					),
					fieldOptions: (fieldOptions || []).filter(
						(f) => !["minSize", "maxSize", "regex"].includes(f.name)
					),
					widgetAttributes: (widgetAttributes || []).filter(
						(f) => !["multiline"].includes(f.name)
					),
				},
			}
		}
	}

	const [loader, setLoader] = React.useState(false)

	React.useEffect(() => {
		setPropertyList({
			...(widget || {}),
			type: selectedType,
		})
	}, [widget, selectedType])

	async function onChange(
		props,
		changedPropertyName,
		skipGenerateHistory = false
	) {
		const newProperties = { ...props }

		if (["collapseIf", "canCollapse"].includes(changedPropertyName)) {
			newProperties.widgetAttrs = {
				...props.widgetAttrs,
				showTitle: "true",
			}
		}
		if (changedPropertyName === JsonRelationalField.name) {
			// when isJsonRelationalField changes
			newProperties[TargetJsonModel.name] = null
			newProperties[TargetModel.name] = null
			newProperties[GridView.name] = null
			newProperties[FormView.name] = null
		}
		if (
			changedPropertyName !== JsonRelationalField.name &&
			changedPropertyName !== "type"
		) {
			newProperties.type = widget.type
		}
		/* selectionText implementation starts here */
		if (
			changedPropertyName === "updateSelection" &&
			!newProperties.updateSelection
		) {
			newProperties.selection = null
			newProperties.selectionText = null
		}
		if (!newProperties.updateSelection) {
			newProperties.selectionText = null
		}

		if (
			newProperties.selection &&
			newProperties.updateSelection &&
			!changedPropertyName
		) {
			const obj = { name: newProperties.selection }
			setLoader(true)
			const text = await getSelectionText(obj)
			setLoader(false)
			newProperties.selectionText = text
		}
		if (!newProperties.selection && !changedPropertyName) {
			newProperties.selectionText = ""
		}
		if (
			newProperties.selection &&
			typeof newProperties.selection === "object"
		) {
			newProperties.selection = newProperties.selection.name
		}
		if (newProperties.widgetAttrs) {
			const obj = {}
			const { widgetAttrs = {} } = newProperties
			Object.keys(widgetAttrs).forEach((widget) => {
				obj[widget] =
					typeof widgetAttrs[widget] === "string"
						? widgetAttrs[widget]?.trim() === ""
							? null
							: widgetAttrs[widget]?.trim()
						: widgetAttrs[widget]
			})
			newProperties.widgetAttrs = obj
		}
		setPropertyList({
			...newProperties,
			// FIX: overiding type fixes flicker for new widgets , where type is not the same as servertype
			// https://redmine.axelor.com/issues/63206#note-23
			...(changedPropertyName !== "type" ? { type: selectedType } : {}),
		})
		/* selectionText implementation ends here */

		onWidgetChange({
			id: editWidget,
			props: { ...newProperties },
			/**
			 * @todo Efficiency Improvement:
			 * OnWidgetChange cycles through all the properties in newProperties
			 * whenever a single property is changed, causing unnecessary updates even when
			 * there is no actual change.
			 */
			skipGenerateHistory,
			changedPropertyName,
		})
	}

	type = selectedType
	let errors = {}
	if (editWidget) {
		errors = widgetErrorList[editWidget] || customErrorList[editWidget] || {}
	}

	const parentPanel = Object.values(widgets || {}).find(
		(w) => w.items && w.items.indexOf(editWidget) !== -1
	)
	if (widget?.type === "panel-tabs" && editWidgetType === "customField") {
		return null
	}
	if (
		property?.dependModelType &&
		`${widget?.tab}` === "true" &&
		property?.dependModelType !== modelType
	) {
		return null
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
							sx={{
								color: "white",
								fontWeight: "600",
								...(i !== 0 && { margin: "25px 0px 0px 0px" }),
							}}
							variant="body1"
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
								isStudioLite={isStudioLite}
								hasOnlyOneNonSidebarItem={hasOnlyOneNonSidebarItem}
								loader={loader}
							>
								<RenderPropertyField />
							</PropertiesProvider>
						</Grid>
					</Grid>
				))}
		</Grid>
	)
}
