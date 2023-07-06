import React, { useState, useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";
import SelectComponent from "../../components/SelectComponent";

import { IconButton } from "@material-ui/core";
import clsx from "clsx";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContentText from "@material-ui/core/DialogContentText";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import _ from "lodash";
import CardContent from "@material-ui/core/CardContent";
import { useStore } from "../../store/context";
import { getSelectionText } from "../../Toolbar/api";
import { translate } from "../../utils";
import Content from "./Content";
import CheckboxField from "./CheckboxField";
import { MODEL_TYPE } from "../../constants";

export const WKF_COLORS = [
	{ name: "red", title: "Red", color: "#f44336", border: "#fff" },
	{ name: "pink", title: "Pink", color: "#e91e63", border: "#fff" },
	{ name: "purple", title: "Purple", color: "#9c27b0", border: "#fff" },
	{
		name: "deeppurple",
		title: "Deep Purple",
		color: "#673ab7",
		border: "#fff",
	},
	{ name: "indigo", title: "Indigo", color: "#3f51b5", border: "#fff" },
	{ name: "blue", title: "Blue", color: "#2196f3", border: "#fff" },
	{ name: "lightblue", title: "Light Blue", color: "#03a9f4", border: "#fff" },
	{ name: "cyan", title: "Cyan", color: "#00bcd4", border: "#fff" },
	{ name: "teal", title: "Teal", color: "#009688", border: "#fff" },
	{ name: "green", title: "Green", color: "#4caf50", border: "#fff" },
	{
		name: "lightgreen",
		title: "Light Green",
		color: "#8bc34a",
		border: "black",
	},
	{ name: "lime", title: "Lime", color: "#cddc39", border: "black" },
	{ name: "yellow", title: "Yellow", color: "#ffeb3b", border: "black" },
	{ name: "amber", title: "Amber", color: "#ffc107", border: "black" },
	{ name: "orange", title: "Orange", color: "#ff9800", border: "black" },
	{
		name: "deeporange",
		title: "Deep Orange",
		color: "#ff5722",
		border: "#fff",
	},
	{ name: "brown", title: "Brown", color: "#795548", border: "#fff" },
	{ name: "grey", title: "Grey", color: "#9e9e9e", border: "black" },
	{ name: "bluegrey", title: "Blue Grey", color: "#607d8b", border: "#fff" },
	{ name: "black", title: "Black", color: "black", border: "#fff" },
	{ name: "white", title: "White", color: "whitesmoke", border: "black" },
];

const useStyles = makeStyles(() => ({
	paper: {
		minWidth: "50%",
		width: "50%",
		maxWidth: "100%",
		resize: "auto",
	},
	alertPaper: {
		minWidth: 300,
	},
	checkbox: {
		color: "#0275d8 !important",
		"&$checked": {
			color: "#0275d8 !important",
		},
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
	crudIcon: {
		height: "1.5em",
		width: "1.5em",
		fontSize: 16,
		cursor: "pointer",
		color: "#fff",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
	},
	content: {
		overflow: "auto",
		padding: "0px 8px 16px 8px",
	},
	dialogContent: {
		display: "flex",
		flexDirection: "column",
	},
	ok: {
		backgroundColor: "#0275d8",
		borderColor: "#0275d8",
		color: "#fff",
		"&:hover": {
			backgroundColor: "#0275d8",
			borderColor: "#0275d8",
			color: "#fff",
		},
	},
	btn: {
		textTransform: "none",
	},
	dialogActions: {
		paddingBottom: 16,
	},
	root: {
		display: "flex",
		justifyContent: "space-between",
		alignItems: "flex-start",
	},
	iconButton: {
		marginTop: 25,
		paddingLeft: 10,
	},
	icon: {
		color: "white",
	},
	label: {
		fontSize: 13,
	},
}));

export default function SelectionWidget(_props) {
	const { field, index, props, error } = _props;
	const [rows, setRows] = useState([]);
	const [openGrid, setOpenGrid] = useState(false);
	const [openAlert, setAlertOpen] = useState(false);
	const [isHistoryGenerated, setIsHistoryGenerated] = useState(false);
	const classes = useStyles();
	const { propertyList, setPropertyList, onChange } = props;
	const { state, update } = useStore();
	const { editWidget } = state;
	const { selection, selectionText, updateSelection, isSelectionField } =
		propertyList;

	const handleChange = (id, name, value) => {
		setRows((rows) =>
			rows.map((row) => (row.id === id ? { ...row, [name]: value } : row))
		);
	};

	const markHistoryGenerated = () => {
		setIsHistoryGenerated(true);
	};

	const updateWidget = (rows) => {
		let selectionText = "";
		if (rows?.length <= 0) {
			selectionText = null;
		} else {
			rows.forEach((row, i) => {
				if (row.title) {
					selectionText += `${i > 0 ? "\n" : ""}${row.title}:${row.value}`;
				}
				if (row.color && row.color.name) {
					selectionText += "\ncolor:" + row.color?.name;
				}
				if (row.icon) {
					selectionText += "\nicon:" + row.icon;
				}
			});
		}
		setPropertyList((propertyList) => ({
			...propertyList,
			selectionText,
		}));
		onChange(
			{
				...propertyList,
				selectionText,
			},
			"selectionText",
			isHistoryGenerated
		);
	};

	const addRow = () => {
		setRows((rows) => {
			return [
				...rows?.map((row) => {
					return {
						...row,
						editable: false,
					};
				}),
				{
					title: "",
					value: "",
					color: null,
					icon: null,
					id: _.uniqueId(),
					editable: true,
				},
			];
		});
	};

	const deleteRow = (id) => {
		setRows((rows) => rows.filter((row) => row?.id !== id));
	};

	const moveCard = React.useCallback(
		(dragIndex, hoverIndex) => {
			if (!updateSelection) return;
			if (dragIndex <= -1 || hoverIndex <= -1) {
				return;
			}
			const cloneRows = [...(rows || [])];
			let dragCard = cloneRows[dragIndex];
			cloneRows[dragIndex] = cloneRows[hoverIndex];
			cloneRows[hoverIndex] = dragCard;
			setRows(cloneRows);
		},
		[rows, updateSelection]
	);

	const handleRow = (id) => {
		setRows((rows) =>
			rows.map((row) =>
				row.id === id
					? { ...row, editable: !row.editable || false }
					: { ...row, editable: false }
			)
		);
	};

	const saveRow = () => {
		setRows((rows) =>
			rows.map((row) => (row.editable ? { ...row, editable: false } : row))
		);
	};

	const handleOk = () => {
		if (updateSelection && !rows.length) {
			setAlertOpen(true);
			return;
		}
		const isError = rows.findIndex((r) => !r.title);
		if (isError > -1) {
			setAlertOpen(true);
			return;
		}
		setIsHistoryGenerated(false);
		updateWidget(rows);
		setOpenGrid(false);
		validateErrors();
	};

	const handleDialogOk = () => {
		if (!selection && !updateSelection) {
			setRows([]);
		}
	};

	const createRows = React.useCallback((selectionText) => {
		const selection = selectionText?.trim().split("\n");
		let rows = [];
		for (let i = 0; i < selection?.length; i++) {
			const option = selection[i];
			const optionKeyValue = option.split(":");
			const title = optionKeyValue[0];
			const titleLower = title?.toLowerCase();
			let value = optionKeyValue[1];
			if (titleLower && titleLower !== "color" && titleLower !== "icon") {
				rows.push({
					id: _.uniqueId(),
					title: title,
					value: value || title,
				});
			} else if (titleLower === "color" || titleLower === "icon") {
				let row = rows.pop();
				value =
					title === "color" ? WKF_COLORS.find((f) => f.name === value) : value;
				row = { ...row, [title]: value };
				rows.push(row);
			}
		}
		setRows(rows);
	}, []);

	const addOptions = async () => {
		setOpenGrid(true);
		if (!updateSelection && selection) {
			const res = await getSelectionText({ name: selection });
			createRows(res);
		} else if (selectionText) {
			createRows(selectionText);
		} else {
			setRows([]);
		}
	};

	const validateErrors = React.useCallback(() => {
		if (!selectionText && !selection && editWidget && isSelectionField) {
			update((draft) => {
				draft.errorList[editWidget] = {
					selection: "Selection or selection options are required",
				};
			});
		} else {
			update((draft) => {
				delete draft.errorList[editWidget];
			});
		}
	}, [selection, editWidget, selectionText, isSelectionField, update]);

	useEffect(() => {
		validateErrors();
	}, [validateErrors]);

	useEffect(() => {
		if (!selectionText) {
			setRows([]);
			return;
		}
		createRows(selectionText);
	}, [selectionText, createRows]);

	return (
		<div className={classes.root}>
			<SelectComponent
				field={field}
				key={index}
				index={index}
				props={props}
				error={error}
			/>
			<IconButton
				onClick={addOptions}
				aria-label="add"
				size="small"
				className={classes.iconButton}
			>
				<i
					className={clsx(
						propertyList[field.name] || selectionText
							? "fa fa-pencil"
							: "fa fa-plus",
						classes.icon
					)}
				/>
			</IconButton>
			{openGrid && (
				<Dialog
					open={openGrid}
					onClose={(_, reason) => {
						if (reason !== "backdropClick") {
							setOpenGrid(false);
						}
					}}
					classes={{
						paper: classes.paper,
					}}
				>
					<DialogTitle>{translate("Selection")}</DialogTitle>
					<DialogContent className={classes.dialogContent}>
						<CardContent className={classes.content}>
							<div>
								<FormControlLabel
									classes={{
										label: classes.label,
									}}
									control={
										<CheckboxField
											field={{
												name: "updateSelection",
												dependModelType: MODEL_TYPE.CUSTOM,
												title: "New selection",
												uncheckDialog: true,
												alertMessage:
													"All options and selection will be lost. Are you sure ?",
											}}
											handleDialogOk={handleDialogOk}
											isHistoryGenerated={isHistoryGenerated}
											markHistoryGenerated={markHistoryGenerated}
											props={props}
										/>
									}
									label={translate("New selection")}
								/>
								<div className="one-to-many-header">
									<span>{translate("Selection items")}</span>
									<Button
										onClick={addRow}
										aria-label="add"
										size="small"
										className={classes.btn}
										disabled={!updateSelection}
										startIcon={
											<i
												className={clsx("fa fa-plus", classes.crudIcon)}
												style={{
													color: updateSelection
														? "black"
														: "rgba(0, 0, 0, 0.26)",
												}}
											/>
										}
									>
										{translate("New")}
									</Button>
								</div>
								<table>
									<tbody
										className="one-to-many-row"
										style={{ textAlign: "left" }}
									>
										<tr style={{ display: "flex", alignItems: "center" }}>
											{[
												"\u00A0",
												"Title",
												"Value",
												"Color",
												"Icon",
												"\u00A0",
												"\u00A0",
											].map((item, i) => (
												<td
													className="one-to-many-col one-to-many-col-border"
													key={`td_${i}`}
													style={{
														borderBottom: "1px solid #ddd",
														maxWidth: item === "\u00A0" ? "4%" : "22%",
													}}
												>
													{item}
												</td>
											))}
										</tr>
										{rows?.map((row, i) => (
											<Content
												key={row.id}
												index={i}
												id={row.id}
												handleRow={handleRow}
												deleteRow={deleteRow}
												saveRow={saveRow}
												row={row}
												moveCard={moveCard}
												handleChange={handleChange}
												updateSelection={updateSelection}
												addRow={addRow}
												rowsCount={rows?.length}
											/>
										))}
									</tbody>
								</table>
							</div>
						</CardContent>
					</DialogContent>
					<DialogActions className={classes.dialogActions}>
						<Button
							onClick={() => {
								setRows([]);
								setOpenGrid(false);
								validateErrors();
								setIsHistoryGenerated(false);
							}}
							className={classes.btn}
							variant="outlined"
						>
							{translate("Close")}
						</Button>
						<Button
							onClick={handleOk}
							autoFocus
							className={clsx(classes.btn, classes.ok)}
						>
							{translate("OK")}
						</Button>
					</DialogActions>
				</Dialog>
			)}
			{openAlert && (
				<Dialog
					open={openAlert}
					onClose={() => setAlertOpen(false)}
					aria-labelledby="alert-dialog-title"
					aria-describedby="alert-dialog-description"
					classes={{
						paper: classes.alertPaper,
					}}
				>
					<DialogTitle id="alert-dialog-title">
						{translate("Alert")}
					</DialogTitle>
					<DialogContent>
						<DialogContentText id="alert-dialog-description">
							{translate("Value is required")}
						</DialogContentText>
					</DialogContent>
					<DialogActions>
						<Button
							onClick={() => setAlertOpen(false)}
							color="primary"
							className={classes.button}
						>
							{translate("OK")}
						</Button>
					</DialogActions>
				</Dialog>
			)}
		</div>
	);
}
