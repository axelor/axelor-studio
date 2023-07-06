import React from "react";
import { Grid, Tooltip } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";

import { translate } from "../utils";

const useStyles = makeStyles({
	fieldImage: {
		display: "flex",
		justifyContent: "center",
		alignItems: "center",
		padding: 15,
	},
	icon: {
		width: 25,
		height: 25,
		backgroundRepeat: "no-repeat",
		backgroundSize: "contain",
		backgroundPosition: "center",
		position: "absolute",
	},
});

const getImageURL = (widget) => {
	const type = widget.serverType || widget.type;
	if (type && type.indexOf("datetime") !== -1) {
		return "datetime.png";
	}
	if (type && type.indexOf("date") !== -1) {
		return "date.png";
	}
	if (type && type.indexOf("time") !== -1) {
		return "time.png";
	}
	if (type && type.indexOf("decimal") !== -1) {
		return "decimal.png";
	}
	if (widget.image) {
		return widget.image;
	}
	return `${type}.png`;
};

export function FieldComponent(props) {
	const classes = useStyles();
	const { attrs, targetName } = props;
	return (
		<div>
			<Tooltip
				arrow
				title={translate(attrs.title || attrs[targetName] || attrs["name"])}
				placement="right"
			>
				<Grid className={classes.fieldImage}>
					<div
						className={classes.icon}
						style={{
							backgroundImage: `url(./images/${getImageURL(attrs)})`,
						}}
					/>
				</Grid>
			</Tooltip>
		</div>
	);
}

export default FieldComponent;
