import React from "react"
import TextField from "@mui/material/TextField"
import Autocomplete from "@mui/material/Autocomplete"
import { camleCaseString, translate, getProperty } from "../../utils"
import { typeReplacer } from "../../constants"
import { TYPE } from "../../constants"
import { MODEL_TYPE } from "../../constants"

export default function StaticSelection(_props) {
	let {
		name,
		required,
		data,
		helper,
		title,
		color,
		disableClearable = false,
		parentField,
		parentPanel,
		getOptionLabel,
		...rest
	} = _props.field
	const { props } = _props
	const {
		propertyList,
		setPropertyList,
		type,
		onChange,
		modelType,
		metaFieldStore,
		editWidgetType,
	} = props || {}

	if (typeof data === "object" && !Array.isArray(data)) {
		data = data[(typeReplacer[type] || type).toLowerCase()] || []
	}
	title = translate(camleCaseString(title || name))

	const ColorTag = ({ color }) => (
		<div style={{ width: 15, height: 15, backgroundColor: color }}></div>
	)
	let value = propertyList[name] || ""
	if (
		(modelType === rest.modelType || props.editWidgetType === "customField") &&
		parentField
	) {
		const field = propertyList[parentField] ? propertyList[parentField] : {}
		value = field[name] || ""
	}
	let disabled = false
	if (rest.isDisabled) {
		disabled = rest.isDisabled({
			properties: propertyList,
			metaFieldStore,
			editWidgetType,
			modelType,
		})
	}

	if (
		type === TYPE.panel &&
		modelType === MODEL_TYPE.CUSTOM &&
		name === "colSpan"
	) {
		return null
	}
	return (
		<Autocomplete
			sx={{
				width: "100%",
				marginTop: "15px",
				backgroundColor: "#293846",
				"& > .MuiFormControl-root > .MuiFormLabel-root": {
					color: "#ffffff !important",
					fontSize: 13,
				},
				...(disabled
					? {}
					: {
							"&:hover .MuiInputBase-root .MuiOutlinedInput-notchedOutline": {
								borderColor: "white",
							},
					  }),
				"& .MuiInputBase-input": {
					color: "#ffffff",
					fontSize: 13,
				},
				"& .MuiSvgIcon-root": {
					color: "#ffffff",
				},
				"& .Mui-disabled": {
					WebkitTextFillColor: "#a3a3a3 !important",
					fontSize: 12,
				},
				"& .Mui-disabled .MuiSvgIcon-root": {
					color: "#a3a3a3",
				},
			}}
			componentsProps={{
				paper: {
					sx: {
						fontSize: 13,
						backgroundColor: "rgb(41, 56, 70)",
						WebkitTextFillColor: "#e7eaec !important",
						"& ul, .MuiAutocomplete-Options": {
							backgroundColor: "rgb(41, 56, 70) !important",
							".modern-dark &": {
								backgroundColor: "#1b1b1b !important",
							},
						},
						"& li, .MuiAutocomplete-Options": {
							color: "#ffffff !important",
							backgroundColor: "rgb(41, 56, 70) !important",
							".modern-dark &": {
								backgroundColor: "#1b1b1b !important",
							},
						},
						"& li:hover, .MuiAutocomplete-Options": {
							color: "#ffffff !important",
							backgroundColor: "#2f4050 !important",
							".modern-dark &": {
								backgroundColor: "#323232 !important",
							},
						},
						"& .Mui-focused": {
							backgroundColor: "#2f4050 !important",
							".modern-dark &": {
								backgroundColor: "#323232 !important",
							},
						},
					},
				},
			}}
			options={data}
			disableClearable={disableClearable}
			size="small"
			autoHighlight
			disabled={disabled}
			onChange={(e, _value) => {
				const value = {
					...propertyList,
					...getProperty(
						name,
						_value,
						parentField,
						propertyList[parentField],
						modelType === rest.modelType ||
							props.editWidgetType === "customField"
					),
				}
				if (name === "colSpan") {
					value.colSpan = _value
				}
				setPropertyList(value)
				onChange(value, name)
			}}
			getOptionLabel={(option) =>
				getOptionLabel
					? getOptionLabel(option)
					: typeof option === "object"
					? option.text
					: option
			}
			renderOption={(props, option) =>
				typeof option === "object" ? (
					<li {...props} value={option.value}>
						<i className={`fa ${option}`} style={{ marginRight: 4 }} />
						{translate(option.text)}
					</li>
				) : (
					<li {...props} value={option}>
						{color && <ColorTag color={option} />}
						<i className={`fa ${option}`} style={{ marginRight: 4 }} />
						<span>{translate(option)}</span>
					</li>
				)
			}
			value={value}
			renderInput={(params) => (
				<TextField
					{...params}
					label={translate(camleCaseString(title || name))}
					variant="outlined"
					autoComplete="off"
					inputProps={{
						...params.inputProps,
						autoComplete: "new-password", // disable autocomplete and autofill
					}}
				/>
			)}
		/>
	)
}
