import React, { useRef, useEffect } from "react";
import CircularProgress from "@material-ui/core/CircularProgress";
import { makeStyles } from "@material-ui/core/styles";
import classNames from "classnames";

import { Widget, Form } from "../components";
import { IDS, MODEL_TYPE } from "../constants";
import { useStore } from "../store/context";
import { customScrollTo } from "./utils";

const useStyles = makeStyles({
	uiContainer: {
		display: "flex",
		flexDirection: "column",
		alignSelf: "baseline",
	},
	container: {
		display: "flex",
		flexDirection: "column",
		height: "fit-content",
		position: "relative",
	},
	loaderContainer: {
		display: "flex",
		flexDirection: "column",
		justifyContent: "center",
		height: "100%",
		position: "absolute",
		zIndex: 1000,
		border: "0px",
		backgroundColor: "rgba(0,0,0,0.05)",
		bottom: 0,
		top: 0,
		left: 0,
		right: 0,
		alignItems: "center",
	},
	emptyFormInfo: {
		minHeight: "24vh !important",
	},
});
// Render Main Form UI View
function FormViewUI({ design }) {
	const store = useStore();
	const classes = useStyles();
	const customPanelRef = useRef(null);
	const {
		widgets,
		customFieldWidgets,
		loader,
		errorList,
		modelField,
		modelType,
	} = store.state;
	const formInfo = (store.state.widgets || [])[-1];

	const customFieldWidgetsExists = !!customFieldWidgets;
	useEffect(() => {
		const grid = customPanelRef.current;
		if (grid && customFieldWidgetsExists) {
			customScrollTo(grid);
			grid && grid.focus();
		}
	}, [customFieldWidgetsExists]);

	return (
		<div className={classNames(classes.uiContainer)}>
			<div
				id="form-view"
				className={classNames(classes.container, {
					[classes.emptyFormInfo]: !formInfo && !customFieldWidgets,
				})}
			>
				{loader && (
					<div className={classNames(classes.loaderContainer)}>
						<CircularProgress />
					</div>
				)}
				{widgets && (
					<Widget
						index={0}
						id={IDS.form}
						attrs={store.state.widgets[IDS.form]}
						onSelect={store.onSelect}
						{...{
							items: store.state.items,
							dragWidget: store.state.dragWidget,
							hoverWidget: store.state.hoverWidget,
							editWidget: store.state.editWidget,
							widgets: store.state.widgets,
							onSelect: store.onSelect,
							onMove: store.onMove,
							onDrag: store.onDrag,
							onHover: store.onHover,
							onWidgetChange: store.onWidgetChange,
							setHoverAttr: store.setHoverAttr,
							addTabPanel: store.addTabPanel,
							canRemove: modelType === MODEL_TYPE.BASE ? false : true,
							//TODO: for attrs widgets , canRemove is undefined. It should have beeen true.
							isBase: modelType === MODEL_TYPE.BASE,
							errorList,
						}}
						design={design}
						component={Form}
					/>
				)}
				{customFieldWidgets && (
					<div
						className="custom-field-pallett-view"
						ref={customPanelRef}
						tabIndex={1}
					>
						<div className="custom-field-view-header">
							{modelField?.name || "attrs"}
						</div>
						<Widget
							_type="customField"
							index={0}
							id={IDS.customForm}
							attrs={store.state.customFieldWidgets[IDS.customForm]}
							onSelect={store.onSelect}
							{...{
								items: store.state.customFieldItems,
								dragWidget: store.state.dragWidget,
								hoverWidget: store.state.hoverWidget,
								editWidget: store.state.editWidget,
								widgets: store.state.customFieldWidgets,
								onSelect: store.onSelect,
								onMove: store.onMove,
								onDrag: store.onDrag,
								addTabPanel: store.addTabPanel,
								onHover: store.onHover,
								onWidgetChange: store.onWidgetChange,
								setHoverAttr: store.setHoverAttr,
								errorList,
							}}
							design={design}
							component={Form}
						/>
					</div>
				)}
			</div>
		</div>
	);
}

export default FormViewUI;
