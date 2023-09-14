import React from "react";
import Popover from "@material-ui/core/Popover";
import Typography from "@material-ui/core/Typography";
import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";
import { makeStyles } from "@material-ui/core/styles";

import { translate } from "../utils";

const useStyles = makeStyles(() => ({
	text: {
		textAlign: "center",
		fontSize: 14,
	},
	dialogContainer: {
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		flexDirection: "column",
	},
	button: {
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
	},
	paper: {
		borderRadius: 5,
		padding: 15,
		boxShadow: "rgb(0 0 0 / 16%) 0px 3px 6px, rgb(0 0 0 / 23%) 0px 3px 6px",
	},
}));

export default function PopoverAlert({ anchorEl, handleClose, handleYes }) {
	const classes = useStyles();

	const open = Boolean(anchorEl);
	const id = open ? "simple-popover" : undefined;

	return (
		<Popover
			id={id}
			open={open}
			anchorEl={anchorEl}
			onClose={handleClose}
			classes={{ paper: classes.paper }}
			anchorOrigin={{
				vertical: "bottom",
				horizontal: "right",
			}}
			transformOrigin={{
				vertical: "top",
				horizontal: "right",
			}}
		>
			<Box className={classes.dialogContainer}>
				<Typography className={classes.text}>
					{translate("Sure want to delete?")}
				</Typography>
				<Box>
					<Button
						size="small"
						className={classes.button}
						style={{
							marginRight: 4,
						}}
						onClick={handleYes}
					>
						{translate("Yes")}
					</Button>
					<Button size="small" className={classes.button} onClick={handleClose}>
						{translate("No")}
					</Button>
				</Box>
			</Box>
		</Popover>
	);
}
