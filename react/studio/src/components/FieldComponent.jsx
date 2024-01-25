import React from "react"
import { translate } from "../utils"
import { Box } from "@axelor/ui"
import Tooltip from "./tooltip/tooltip"
import { iconMap } from "../icons"

const iconName = (widget) => iconMap[widget.image?.split(".")[0]]()

export function FieldComponent(props) {
	const { attrs, targetName } = props
	const icon = iconName(attrs)
	return (
		<div>
			<Tooltip
				title={translate(attrs.title || attrs[targetName] || attrs["name"])}
				placement="end"
			>
				<Box d="flex" justifyContent="center" alignItems="center" py={1}>
					<Box
						d="flex"
						justifyContent="center"
						alignItems="center"
						style={{
							width: "45px",
							maxHeight: "20px",
						}}
					>
						{icon}
					</Box>
				</Box>
			</Tooltip>
		</div>
	)
}

export default FieldComponent
