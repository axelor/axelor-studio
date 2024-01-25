import React from "react"
import {
	Box,
	Button,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@axelor/ui"
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
			aria-labelledby="alert-dialog-title"
			aria-describedby="alert-dialog-description"
		>
			<DialogHeader>
				<DialogTitle id="alert-dialog-title">{translate(title)}</DialogTitle>
			</DialogHeader>
			<DialogContent>
				<Box id="alert-dialog-description">{translate(message)}</Box>
			</DialogContent>
			<DialogFooter>
				<Button onClick={onOk} variant="primary" size="sm">
					{translate("Yes")}
				</Button>
				<Button onClick={onClose} variant="primary" autoFocus size="sm">
					{translate("No")}
				</Button>
			</DialogFooter>
		</Dialog>
	)
}
