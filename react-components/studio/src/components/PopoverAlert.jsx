import React from "react"
import { styled } from "@mui/material/styles"
import Popover from "@mui/material/Popover"
import Typography from "@mui/material/Typography"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"

import { translate } from "../utils"

const Text = styled(Typography)({
	textAlign: "center",
	fontSize: 14,
})

const DialogContainer = styled("div")({
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	flexDirection: "column",
	width: 160,
	height: 70,
})

const StyledButton = styled(Button)({
	width: "min-content",
	fontWeight: 600,
	color: "#fff",
	borderRadius: 25,
	backgroundColor: "#0275d8",
	padding: 0,
	overflow: "hidden",
	textOverflow: "ellipsis",
	textTransform: "capitalize",
	"&:hover": {
		backgroundColor: "#0275d8",
	},
})

const StyledPopover = styled(Popover)({
	borderRadius: 5,
	padding: 15,
	boxShadow: "rgb(0 0 0 / 16%) 0px 3px 6px, rgb(0 0 0 / 23%) 0px 3px 6px",
})

export default function PopoverAlert({ anchorEl, handleClose, handleYes }) {
	const open = Boolean(anchorEl)
	const id = open ? "simple-popover" : undefined

	return (
		<StyledPopover
			id={id}
			open={open}
			anchorEl={anchorEl}
			onClose={handleClose}
			anchorOrigin={{
				vertical: "bottom",
				horizontal: "right",
			}}
			transformOrigin={{
				vertical: "top",
				horizontal: "right",
			}}
		>
			<DialogContainer>
				<Text>{translate("Sure want to delete?")}</Text>
				<Box>
					<StyledButton
						size="small"
						style={{
							marginRight: 4,
						}}
						onClick={handleYes}
					>
						{translate("Yes")}
					</StyledButton>
					<StyledButton
						size="small"
						style={{
							marginRight: 4,
						}}
						onClick={handleClose}
					>
						{translate("No")}
					</StyledButton>
				</Box>
			</DialogContainer>
		</StyledPopover>
	)
}
