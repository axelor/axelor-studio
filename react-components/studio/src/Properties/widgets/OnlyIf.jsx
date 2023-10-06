import React from "react"
import SelectComponent from "../../components/SelectComponent"

function OnlyIf({ field, error, props }) {
	const { contextFieldTarget, contextFieldTargetName } = props.propertyList
	return (
		<>
			<SelectComponent field={field} props={props} error={error} />
			{contextFieldTarget && contextFieldTargetName && (
				<SelectComponent
					field={{
						name: "contextFieldTitle",
						ref: contextFieldTarget,
						title: "Value",
						valueField: contextFieldTargetName,
						displayField: contextFieldTargetName,
					}}
					props={props}
					error={error}
				/>
			)}
		</>
	)
}

export default OnlyIf
