import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import classNames from "classnames";

const useStyles = makeStyles((theme) => ({
	field: {
		[theme.breakpoints.down("sm")]: {
			width: "100%",
		},
	},
}));

export default function Field(props) {
	const classes = useStyles();
	return (
		<div {...props} className={classNames(classes.field, props.className)} />
	);
}
