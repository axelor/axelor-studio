import React, { useRef, useEffect } from "react"
import { Box, CircularProgress } from "@axelor/ui"
import { Widget, Form } from "../components"
import { IDS, MODEL_TYPE } from "../constants"
import { useStore } from "../store/context"
import { customScrollTo } from "./utils"

// Render Main Form UI View
function FormViewUI({ design }) {
	const store = useStore()

	const customPanelRef = useRef(null)
	const {
		widgets,
		customFieldWidgets,
		loader,
		customErrorList,
		widgetErrorList,
		modelField,
		modelType,
	} = store.state
	const formInfo = (store.state.widgets || [])[-1]

	const customFieldWidgetsExists = !!customFieldWidgets
	useEffect(() => {
		const grid = customPanelRef.current
		if (grid && customFieldWidgetsExists) {
			customScrollTo(grid)
			grid && grid.focus()
		}
	}, [customFieldWidgetsExists])

	return (
		<Box alignSelf="baseline" d="flex" flexDirection="column">
			<Box
				d="flex"
				flexDirection="column"
				pos="relative"
				style={{
					height: "fit-content",
					...(!formInfo && !customFieldWidgets ? { minHeight: "24vh" } : {}),
				}}
				id="form-view"
			>
				{loader && (
					<Box
						d="flex"
						flexDirection="column"
						justifyContent="center"
						alignItems="center"
						border={0}
						bg="body-tertiary"
						style={{
							height: "100%",
							position: "absolute",
							zIndex: 1000,
							bottom: 0,
							top: 0,
							left: 0,
							right: 0,
						}}
					>
						<CircularProgress size={40} indeterminate />
					</Box>
				)}
				{widgets && (
					<Widget
						index={0}
						id={IDS.form}
						attrs={store.state.widgets[IDS.form]}
						onSelect={store.onSelect}
						{...{
							items: store.state.items,
							editWidget: store.state.editWidget,
							widgets: store.state.widgets,
							onSelect: store.onSelect,
							onDrop: store.onDrop,
							onWidgetChange: store.onWidgetChange,
							addTabPanel: store.addTabPanel,
							canRemove: modelType === MODEL_TYPE.BASE ? false : true,
							//TODO: for attrs widgets , canRemove is undefined. It should have beeen true.
							isBase: modelType === MODEL_TYPE.BASE,
							widgetErrorList,
						}}
						design={design}
						component={Form}
					/>
				)}
				{customFieldWidgets && (
					<div className="custom-field-pallett-view" ref={customPanelRef}>
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
								editWidget: store.state.editWidget,
								widgets: store.state.customFieldWidgets,
								onSelect: store.onSelect,
								onDrop: store.onDrop,
								addTabPanel: store.addTabPanel,
								onWidgetChange: store.onWidgetChange,
								customErrorList,
							}}
							design={design}
							component={Form}
						/>
					</div>
				)}
			</Box>
		</Box>
	)
}

export default FormViewUI
