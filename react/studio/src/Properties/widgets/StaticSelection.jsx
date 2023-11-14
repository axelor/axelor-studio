import React from "react"
import { Box, InputLabel, Select } from "@axelor/ui"
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

	const getLabel = (option) =>
		getOptionLabel
			? getOptionLabel(option)
			: typeof option === "object"
			? option.text
			: option

	return (
		<>
			<InputLabel mt={1} fontSize={7}>
				{translate(camleCaseString(title || name))}
			</InputLabel>
			<Select
				width={100}
				options={data}
				disableClearable={disableClearable}
				size="small"
				autoHighlight
				disabled={disabled}
				onChange={(_value) => {
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
				optionLabel={getLabel}
				optionKey={getLabel}
				optionValue={getLabel}
				optionMatch={(option, text) =>
					getLabel(option)
						?.toString()
						?.toLowerCase()
						?.includes(text?.toLowerCase())
				}
				renderOption={(option) =>
					typeof option === "object" ? (
						<Box>
							<i
								className={`fa ${option.option}`}
								style={{ marginRight: "10px" }}
							/>
							{translate(`${option.option}`)}
						</Box>
					) : (
						<Box>
							{color && <ColorTag color={option} />}
							<i className={`fa ${option}`} style={{ marginRight: "10px" }} />
							<span>{translate(option)}</span>
						</Box>
					)
				}
				value={value}
			/>
		</>
	)
}
