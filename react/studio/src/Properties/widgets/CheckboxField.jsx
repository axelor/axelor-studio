import React, { useState } from "react"
import { Input } from "@axelor/ui"
import {
	camleCaseString,
	translate,
	getProperty,
	getPropertyValue,
} from "../../utils"
import DialogConfirmation from "../../Toolbar/DeleteConfirmation"

export default function CheckboxField(_props) {
	const [openAlert, setAlertOpen] = useState(false)
	let {
		name,
		title,
		parentField,
		defaultValue,
		uncheckDialog,
		alertMessage,
		...rest
	} = _props.field
	const {
		props,
		classNames,
		handleDialogOk,
		isHistoryGenerated,
		markHistoryGenerated,
	} = _props
	const {
		propertyList,
		setPropertyList,
		onChange,
		modelType,
		editWidgetType,
		metaFieldStore,
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
	if (rest.isDisabled) {
		disabled = rest.isDisabled({
			properties: propertyList,
			metaFieldStore,
			editWidgetType,
			modelType,
		})
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
			name,
			isHistoryGenerated
		)
		markHistoryGenerated()
		handleDialogOk()
	}

	return (
		<React.Fragment>
			<Input
				type="checkbox"
				className={classNames}
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
			{openAlert && (
				<DialogConfirmation
					open={openAlert}
					message={alertMessage}
					onClose={() => setAlertOpen(false)}
					onOk={handleOnChange}
					title="Confirm"
				/>
			)}
		</React.Fragment>
	)
}
