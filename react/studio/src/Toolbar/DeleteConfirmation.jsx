import React from "react"
import Button from "@mui/material/Button"
import Dialog from "@mui/material/Dialog"
import DialogActions from "@mui/material/DialogActions"
import DialogContent from "@mui/material/DialogContent"
import DialogContentText from "@mui/material/DialogContentText"
import DialogTitle from "@mui/material/DialogTitle"
import { translate } from "../utils"

export default function DeleteConfirmation({
	onOk,
	onClose,
	open,
	message,
	title = "Delete Confirmation",
}) {
	return (
		<Dialog
			open={open}
			onClose={onClose}
			aria-labelledby="alert-dialog-title"
			aria-describedby="alert-dialog-description"
			sx={{
				"& .MuiDialog-paper": {
					minWidth: 300,
				},
			}}
		>
			<DialogTitle id="alert-dialog-title">{translate(title)}</DialogTitle>
			<DialogContent>
				<DialogContentText id="alert-dialog-description">
					{translate(message)}
				</DialogContentText>
			</DialogContent>
			<DialogActions>
				<Button
					onClick={onOk}
					color="primary"
					sx={{
						textTransform: "none",
						bgcolor: "#0275d8",
						borderColor: "#0275d8",
						color: "#fff",
						"&:hover": {
							bgcolor: "#0275d8",
							borderColor: "#0275d8",
							color: "#fff",
						},
					}}
				>
					{translate("Yes")}
				</Button>
				<Button
					onClick={onClose}
					color="primary"
					autoFocus
					sx={{
						textTransform: "none",
						bgcolor: "#0275d8",
						borderColor: "#0275d8",
						color: "#fff",
						"&:hover": {
							bgcolor: "#0275d8",
							borderColor: "#0275d8",
							color: "#fff",
						},
					}}
				>
					{translate("No")}
				</Button>
			</DialogActions>
		</Dialog>
	)
}
