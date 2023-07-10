import React, { useState, useEffect } from "react"
import { styled } from "@mui/material/styles"
import SelectComponent from "../../components/SelectComponent"

import { IconButton, Typography } from "@mui/material"
import clsx from "clsx"
import Button from "@mui/material/Button"
import Dialog from "@mui/material/Dialog"
import DialogTitle from "@mui/material/DialogTitle"
import DialogContent from "@mui/material/DialogContent"
import DialogActions from "@mui/material/DialogActions"
import DialogContentText from "@mui/material/DialogContentText"
import FormControlLabel from "@mui/material/FormControlLabel"
import _ from "lodash"
import CardContent from "@mui/material/CardContent"
import { getSelectionText } from "../../Toolbar/api"
import { translate } from "../../utils"
import Content from "./Content"
import CheckboxField from "./CheckboxField"
import { MODEL_TYPE, WKF_COLORS } from "../../constants"

const Root = styled("div")(() => ({
	display: "flex",
	justifyContent: "space-between",
	alignItems: "flex-start",
}))

const StyledButton = styled(Button)(() => ({
	"& .MuiButton-root": {
		backgroundColor: "#0275d8",
		borderColor: "#0275d8",
		color: "#fff !important",
		"&:hover": {
			backgroundColor: "#0275d8",
			borderColor: "#0275d8",
			color: "#fff",
		},
	},
	"& .MuiButtonBase-root": {
		textTransform: "none",
		color: "#333",
	},
}))

export default function SelectionWidget(_props) {
	const { field, index, props, error, loader } = _props
	const [rows, setRows] = useState([])
	const [openGrid, setOpenGrid] = useState(false)
	const [openAlert, setAlertOpen] = useState(false)
	const [isHistoryGenerated, setIsHistoryGenerated] = useState(false)
	const { propertyList, setPropertyList, onChange } = props
	const { selection, selectionText, updateSelection } = propertyList

	const handleChange = (id, name, value) => {
		setRows((rows) =>
			rows.map((row) => (row.id === id ? { ...row, [name]: value } : row))
		)
	}

	const markHistoryGenerated = () => {
		setIsHistoryGenerated(true)
	}

	const updateWidget = (rows) => {
		let selectionText = ""
		if (rows?.length <= 0) {
			selectionText = null
		} else {
			rows.forEach((row, i) => {
				if (row.title) {
					selectionText += `${i > 0 ? "\n" : ""}${row.title}:${row.value}`
				}
				if (row.color && row.color.name) {
					selectionText += "\ncolor:" + row.color?.name
				}
				if (row.icon) {
					selectionText += "\nicon:" + row.icon
				}
			})
		}
		setPropertyList((propertyList) => ({
			...propertyList,
			selectionText,
		}))
		onChange(
			{
				...propertyList,
				selectionText,
			},
			"selectionText",
			isHistoryGenerated
		)
	}

	const addRow = () => {
		setRows((rows) => {
			return [
				...rows?.map((row) => {
					return {
						...row,
						editable: false,
					}
				}),
				{
					title: "",
					value: "",
					color: null,
					icon: null,
					id: _.uniqueId(),
					editable: true,
				},
			]
		})
	}

	const deleteRow = (id) => {
		setRows((rows) => rows.filter((row) => row?.id !== id))
	}

	const moveCard = React.useCallback(
		(dragIndex, hoverIndex) => {
			if (!updateSelection) return
			if (dragIndex <= -1 || hoverIndex <= -1) {
				return
			}
			const cloneRows = [...(rows || [])]
			let dragCard = cloneRows[dragIndex]
			cloneRows[dragIndex] = cloneRows[hoverIndex]
			cloneRows[hoverIndex] = dragCard
			setRows(cloneRows)
		},
		[rows, updateSelection]
	)

	const handleRow = (id) => {
		setRows((rows) =>
			rows.map((row) =>
				row.id === id
					? { ...row, editable: !row.editable || false }
					: { ...row, editable: false }
			)
		)
	}

	const saveRow = () => {
		setRows((rows) =>
			rows.map((row) => (row.editable ? { ...row, editable: false } : row))
		)
	}

	const handleOk = () => {
		if (updateSelection && !rows.length) {
			setAlertOpen(true)
			return
		}
		const isError = rows.findIndex((r) => !r.title)
		if (isError > -1) {
			setAlertOpen(true)
			return
		}
		setIsHistoryGenerated(false)
		updateWidget(rows)
		setOpenGrid(false)
	}

	const handleDialogOk = () => {
		if (!selection && !updateSelection) {
			setRows([])
		}
	}

	const createRows = React.useCallback((selectionText) => {
		const selection = selectionText?.trim().split("\n")
		let rows = []
		for (let i = 0; i < selection?.length; i++) {
			const option = selection[i]
			const optionKeyValue = option.split(":")
			const title = optionKeyValue[0]
			const titleLower = title?.toLowerCase()
			let value = optionKeyValue[1]
			if (titleLower && titleLower !== "color" && titleLower !== "icon") {
				rows.push({
					id: _.uniqueId(),
					title: title,
					value: value || title,
				})
			} else if (titleLower === "color" || titleLower === "icon") {
				let row = rows.pop()
				value =
					title === "color" ? WKF_COLORS.find((f) => f.name === value) : value
				row = { ...row, [title]: value }
				rows.push(row)
			}
		}
		setRows(rows)
	}, [])

	const addOptions = async () => {
		setOpenGrid(true)
		if (!updateSelection && selection) {
			const res = await getSelectionText({ name: selection })
			createRows(res)
		} else if (selectionText) {
			createRows(selectionText)
		} else {
			setRows([])
		}
	}

	useEffect(() => {
		if (!selectionText) {
			setRows([])
			return
		}
		createRows(selectionText)
	}, [selectionText, createRows])

	return (
		<Root>
			<SelectComponent
				field={field}
				key={index}
				index={index}
				props={props}
				error={error}
				loader={loader}
				filled={selectionText && !selection}
			/>
			<IconButton
				onClick={addOptions}
				aria-label="add"
				size="small"
				disabled={loader}
				sx={{ marginTop: "20px", paddingLeft: "10px" }}
			>
				<i
					style={{
						color: "white",
						...(loader && {
							color: "#959697 ",
						}),
					}}
					className={clsx(
						propertyList[field.name] || selectionText
							? "fa fa-pencil"
							: "fa fa-plus"
					)}
				/>
			</IconButton>
			{openGrid && (
				<Dialog
					open={openGrid}
					fullWidth
					maxWidth="md"
					onClose={(_, reason) => {
						if (reason !== "backdropClick") {
							setOpenGrid(false)
						}
					}}
				>
					<DialogTitle>{translate("Selection")}</DialogTitle>
					<DialogContent sx={{ display: "flex", flexDirection: "column" }}>
						<CardContent sx={{ overflow: "auto", padding: "0px 8px 16px 8px" }}>
							<div>
								<FormControlLabel
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
									label={
										<Typography sx={{ fontSize: 13 }}>
											{translate("New selection")}
										</Typography>
									}
								/>
								<div className="one-to-many-header">
									<span>{translate("Selection items")}</span>
									<Button
										onClick={addRow}
										aria-label="add"
										size="small"
										sx={{ textTransform: "none", color: "#333" }}
										disabled={!updateSelection}
										startIcon={
											<i
												className={clsx("fa fa-plus")}
												style={{
													height: "1.5em",
													width: "1.5em",
													display: "flex",
													alignItems: "center",
													justifyContent: "center",
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
					<DialogActions sx={{ paddingBottom: "16px" }}>
						<Button
							onClick={() => {
								setRows([])
								setOpenGrid(false)
								setIsHistoryGenerated(false)
							}}
							sx={{ textTransform: "none", color: "#333" }}
							variant="outlined"
						>
							{translate("Close")}
						</Button>
						<StyledButton>
							<Button onClick={handleOk} autoFocus>
								{translate("OK")}
							</Button>
						</StyledButton>
					</DialogActions>
				</Dialog>
			)}
			{openAlert && (
				<Dialog
					open={openAlert}
					onClose={() => setAlertOpen(false)}
					aria-labelledby="alert-dialog-title"
					aria-describedby="alert-dialog-description"
				>
					<DialogTitle id="alert-dialog-title">
						{translate("Alert")}
					</DialogTitle>
					<DialogContent sx={{ minWidth: 300 }}>
						<DialogContentText id="alert-dialog-description">
							{translate("Value is required")}
						</DialogContentText>
					</DialogContent>
					<DialogActions>
						<Button
							onClick={() => setAlertOpen(false)}
							color="primary"
							sx={{
								textTransform: "none",
								backgroundColor: "#0275d8",
								borderColor: "#0275d8",
								color: "#fff",
								"&:hover": {
									backgroundColor: "#0275d8",
									borderColor: "#0275d8",
									color: "#fff",
								},
							}}
						>
							{translate("OK")}
						</Button>
					</DialogActions>
				</Dialog>
			)}
		</Root>
	)
}
