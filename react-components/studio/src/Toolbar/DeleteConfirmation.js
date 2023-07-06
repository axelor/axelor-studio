import React from "react";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import { makeStyles } from "@material-ui/core/styles";

import { translate } from "../utils";

const useStyles = makeStyles({
	paper: {
		minWidth: 300,
	},
	button: {
		textTransform: "none",
		backgroundColor: "#0275d8",
		borderColor: "#0275d8",
		color: "#fff",
		"&:hover": {
			backgroundColor: "#0275d8",
			borderColor: "#0275d8",
			color: "#fff",
		},
	},
});

export default function DeleteConfirmation({
	onOk,
	onClose,
	open,
	message,
	title = "Delete Confirmation",
}) {
	const classes = useStyles();
	return (
		<Dialog
			open={open}
			onClose={onClose}
			aria-labelledby="alert-dialog-title"
			aria-describedby="alert-dialog-description"
			classes={{
				paper: classes.paper,
			}}
		>
			<DialogTitle id="alert-dialog-title">{translate(title)}</DialogTitle>
			<DialogContent>
				<DialogContentText id="alert-dialog-description">
					{translate(message)}
				</DialogContentText>
			</DialogContent>
			<DialogActions>
				<Button onClick={onOk} color="primary" className={classes.button}>
					{translate("Yes")}
				</Button>
				<Button onClick={onClose} color="primary" autoFocus className={classes.button}>
					{translate("No")}
				</Button>
			</DialogActions>
		</Dialog>
	);
}
