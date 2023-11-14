import React, { useState, useEffect } from "react"
import SelectComponent from "../../components/SelectComponent"
import {
	Box,
	Dialog,
	DialogHeader,
	DialogTitle,
	DialogFooter,
	Button,
	Table,
	TableRow,
	TableHead,
	TableCell,
	TableBody,
	Scrollable,
	DialogContent,
} from "@axelor/ui"
import { MaterialIcon } from "@axelor/ui/icons/material-icon"
import _ from "lodash"
import { getSelectionText } from "../../Toolbar/api"
import { translate } from "../../utils"
import Content from "./Content"
import CheckboxField from "./CheckboxField"
import { MODEL_TYPE, WKF_COLORS } from "../../constants"
import IconButton from "../../components/IconButton"

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
				...(rows ||
					[].map((row) => {
						return {
							...row,
							editable: false,
						}
					})),
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
		<Box d="flex" justifyContent="space-between" alignItems="start">
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
				size="sm"
				disabled={loader}
				ms={2}
				style={{ marginTop: "42px" }}
			>
				<MaterialIcon
					color={loader ? "light-emphasis" : "primary"}
					icon={propertyList[field.name] || selectionText ? "edit" : "add"}
				/>
			</IconButton>
			{openGrid && (
				<Dialog open={openGrid} size="lg">
					<DialogHeader onCloseClick={() => setOpenGrid(false)}>
						<DialogTitle>{translate("Selection")}</DialogTitle>
					</DialogHeader>
					<DialogContent>
						<Scrollable style={{ padding: "0px 8px 16px 8px" }}>
							<div>
								<Box>
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
										title={translate("New selection")}
									/>
									<Box d="inline-block" ps={2}>
										{translate("New selection")}
									</Box>
								</Box>
								<Box
									color="body"
									alignItems="center"
									className="one-to-many-header"
								>
									<span>{translate("Selection items")}</span>
									<Button
										onClick={addRow}
										aria-label="add"
										size="small"
										bg="primary"
										d="flex"
										color="light"
										disabled={!updateSelection}
									>
										<MaterialIcon icon={"add"} />
										{translate("New")}
									</Button>
								</Box>
								<Table>
									<TableHead className="one-to-many-row" textAlign="start">
										<TableRow d="flex" textAlign="center">
											{[
												"\u00A0",
												"Title",
												"Value",
												"Color",
												"Icon",
												"\u00A0",
												"\u00A0",
											].map((item, i) => (
												<TableCell
													className="one-to-many-col one-to-many-col-border"
													key={`td_${i}`}
													style={{
														maxWidth: item === "\u00A0" ? "4%" : "22%",
													}}
												>
													{item}
												</TableCell>
											))}
										</TableRow>
									</TableHead>
									<TableBody
										d="block"
										overflow="auto"
										style={{
											maxHeight: "50vh",
										}}
									>
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
									</TableBody>
								</Table>
							</div>
						</Scrollable>
					</DialogContent>
					<DialogFooter>
						<Button
							size="sm"
							variant="secondary"
							onClick={() => {
								setRows([])
								setOpenGrid(false)
								setIsHistoryGenerated(false)
							}}
						>
							{translate("Close")}
						</Button>
						<Button onClick={handleOk} autoFocus size="sm" variant="primary">
							{translate("OK")}
						</Button>
					</DialogFooter>
				</Dialog>
			)}
			{openAlert && (
				<Dialog
					open={openAlert}
					aria-labelledby="alert-dialog-title"
					aria-describedby="alert-dialog-description"
				>
					<DialogHeader onCloseClick={() => setAlertOpen(false)}>
						<DialogTitle id="alert-dialog-title">
							{translate("Alert")}
						</DialogTitle>
					</DialogHeader>
					<DialogContent>
						<Box id="alert-dialog-description">
							{translate("Value is required")}
						</Box>
					</DialogContent>
					<DialogFooter>
						<Button
							onClick={() => setAlertOpen(false)}
							color="primary"
							size="sm"
						>
							{translate("OK")}
						</Button>
					</DialogFooter>
				</Dialog>
			)}
		</Box>
	)
}
