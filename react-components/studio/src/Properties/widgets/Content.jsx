import React, { useImperativeHandle, useRef } from "react";
import Chip from "@material-ui/core/Chip";
import IconButton from "@material-ui/core/IconButton";
import clsx from "clsx";
import { DragSource, DropTarget } from "react-dnd";
import { makeStyles } from "@material-ui/core/styles";

import TextField from "@material-ui/core/TextField";
import Select from "./Select";
import fontAwesomeList from "../fa-icons";

const ItemTypes = {
	CARD: "card",
};

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
	crudIcon: {
		height: "1.5em",
		width: "1.5em",
		fontSize: 16,
		cursor: "pointer",
		color: "#000",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
	},
	textField: {
		fontSize: 13,
	},
}));

const Content = React.forwardRef(
	(
		{
			row = {},
			index,
			connectDragSource,
			connectDropTarget,
			handleRow,
			deleteRow,
			handleChange,
			updateSelection,
			addRow,
			rowsCount,
		},
		ref
	) => {
		const elementRef = useRef(null);
		connectDragSource(elementRef);
		connectDropTarget(elementRef);

		useImperativeHandle(ref, () => ({
			getNode: () => elementRef.current,
		}));

		const classes = useStyles();
		return (
			<tr
				style={{ display: "flex", alignItems: "center" }}
				key={row.id || index}
				ref={elementRef}
				onKeyDown={(e) => {
					if (e.key === "Enter" && rowsCount - 1 === index) {
						handleRow(rowsCount - 1);
						addRow();
					}
				}}
			>
				<td
					className="one-to-many-col one-to-many-col-border"
					style={{ maxWidth: "4%", display: "flex", justifyContent: "center" }}
				>
					<IconButton
						onClick={() => handleRow(row.id)}
						aria-label="add"
						size="small"
						className={classes.iconButton}
						disabled={!updateSelection}
					>
						<i
							className={clsx("fa fa-pencil", classes.crudIcon)}
							style={{
								color: updateSelection ? "black" : "rgba(0, 0, 0, 0.26)",
							}}
						/>
					</IconButton>
				</td>
				<td
					className="one-to-many-col one-to-many-col-border"
					style={{
						maxWidth: "22%",
						overflow: "hidden",
						whiteSpace: "nowrap",
						textOverflow: "ellipsis",
					}}
				>
					{row.editable ? (
						<TextField
							value={row?.value || ""}
							name="value"
							onChange={(e) => {
								handleChange(row.id, "value", e.target.value);
							}}
							style={{ width: "100%" }}
							InputProps={{
								classes: { input: classes.textField },
							}}
							autoFocus={true}
						/>
					) : (
						row.value
					)}
				</td>
				<td
					className="one-to-many-col one-to-many-col-border"
					style={{
						maxWidth: "22%",
						overflow: "hidden",
						whiteSpace: "nowrap",
						textOverflow: "ellipsis",
					}}
				>
					{row.editable ? (
						<TextField
							value={row?.title || ""}
							name="title"
							onChange={(e) => {
								handleChange(row.id, "title", e.target.value);
							}}
							style={{ width: "100%" }}
							InputProps={{
								classes: { input: classes.textField },
							}}
						/>
					) : (
						row.title
					)}
				</td>
				<td
					className={"one-to-many-col one-to-many-col-border"}
					style={{ overflow: "hidden", maxWidth: "22%" }}
				>
					{row.editable ? (
						<Select
							name="color"
							onChange={(value) => {
								handleChange(row.id, "color", value);
							}}
							value={row?.color || ""}
							options={WKF_COLORS}
							optionLabel="title"
							optionValue="name"
						/>
					) : (
						row?.color && (
							<Chip
								label={row.color?.title}
								size="small"
								style={{
									background: row.color?.color,
									color: row.color?.border || "white",
									fontWeight: 800,
								}}
							/>
						)
					)}
				</td>
				<td
					className="one-to-many-col one-to-many-col-border"
					style={{
						maxWidth: "22%",
						overflow: "hidden",
						whiteSpace: "nowrap",
						textOverflow: "ellipsis",
					}}
				>
					{row.editable ? (
						<Select
							name="icon"
							onChange={(value) => {
								handleChange(row.id, "icon", value);
							}}
							value={row?.icon || ""}
							options={fontAwesomeList}
						/>
					) : (
						row.icon
					)}
				</td>
				<td
					className="one-to-many-col one-to-many-col-border"
					style={{ maxWidth: "4%" }}
				>
					<IconButton
						onClick={() => deleteRow(row.id)}
						aria-label="add"
						size="small"
						className={classes.iconButton}
						disabled={!updateSelection}
					>
						<i
							className={clsx("fa fa-trash-o", classes.crudIcon)}
							style={{
								color: updateSelection ? "black" : "rgba(0, 0, 0, 0.26)",
							}}
						/>
					</IconButton>
				</td>
				<td
					className="one-to-many-col one-to-many-col-border"
					style={{ maxWidth: "4%" }}
				>
					<IconButton
						onClick={() => handleRow(row.id)}
						aria-label="add"
						size="small"
						className={classes.iconButton}
						disabled={!updateSelection}
					>
						<i
							className={clsx("fa fa-bars", classes.crudIcon)}
							style={{
								color: updateSelection ? "black" : "rgba(0, 0, 0, 0.26)",
							}}
						/>
					</IconButton>
				</td>
			</tr>
		);
	}
);

export default DropTarget(
	ItemTypes.CARD,
	{
		hover(props, monitor, component) {
			if (!component) {
				return null;
			}
			const node = component.getNode();
			if (!node) {
				return null;
			}
			const dragIndex = monitor.getItem().index;
			const hoverIndex = props.index;
			if (dragIndex === hoverIndex) {
				return;
			}
			const hoverBoundingRect = node.getBoundingClientRect();
			const hoverMiddleY =
				(hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
			const clientOffset = monitor.getClientOffset();
			const hoverClientY = clientOffset.y - hoverBoundingRect.top;

			if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
				return;
			}
			if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
				return;
			}
			props.moveCard(dragIndex, hoverIndex);
			monitor.getItem().index = hoverIndex;
		},
	},
	(connect) => ({
		connectDropTarget: connect.dropTarget(),
	})
)(
	DragSource(
		ItemTypes.CARD,
		{
			beginDrag: (props) => ({
				id: props.id,
				index: props.index,
			}),
		},
		(connect, monitor) => ({
			connectDragSource: connect.dragSource(),
			isDragging: monitor.isDragging(),
		})
	)(Content)
);
