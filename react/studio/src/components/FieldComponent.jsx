import React from "react"
import { Grid, Tooltip } from "@mui/material"

import { translate } from "../utils"

const getImageURL = (widget) => {
	const type = widget.serverType || widget.type
	if (type && type.indexOf("datetime") !== -1) {
		return "datetime.png"
	}
	if (type && type.indexOf("date") !== -1) {
		return "date.png"
	}
	if (type && type.indexOf("time") !== -1) {
		return "time.png"
	}
	if (type && type.indexOf("decimal") !== -1) {
		return "decimal.png"
	}
	if (widget.image) {
		return widget.image
	}
	return `${type}.png`
}

export function FieldComponent(props) {
	const { attrs, targetName } = props
	return (
		<div>
			<Tooltip
				arrow
				title={translate(attrs.title || attrs[targetName] || attrs["name"])}
				placement="right"
			>
				<Grid
					sx={{
						display: "flex !important",
						justifyContent: "center !important",
						alignItems: "center !important",
						padding: "15px !important",
					}}
				>
					<div
						style={{
							width: 25,
							height: 25,
							backgroundRepeat: "no-repeat",
							backgroundSize: "contain",
							backgroundPosition: "center",
							position: "absolute",
							backgroundImage: `url(./images/${getImageURL(attrs)})`,
						}}
					/>
				</Grid>
			</Tooltip>
		</div>
	)
}

export default FieldComponent
