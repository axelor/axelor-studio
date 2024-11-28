import React from "react"
import Grid from "./Grid"
import { PANEL_TYPE } from "../constants"
import { isSidebarPanel } from "../utils"
/**
 * Form Component
 * Used As Main Container i.e. <form />
 */
function FormComponent({ attrs = {}, items = [], design, widgets, ...rest }) {
	// render top level items as Widgets using Context FormConsumer
	const { mainItems, sideItems } = React.useMemo(() => {
		const sideItems = []
		let mainItems = []
		items.forEach((item) => {
			if (widgets[item]) {
				if (isSidebarPanel(widgets[item])) sideItems.push(item)
				else mainItems.push(item)
			}
		})

		return { sideItems, mainItems }
	}, [items, widgets])

	const rootPanel = React.useMemo(() => {
		const hasSidePanel = sideItems.length > 0
		return hasSidePanel
			? {
					items: [
						{
							layout: PANEL_TYPE.grid,
							items: mainItems,
							colSpan: 9,
							panelType: "mainPanel",
						},
						{
							layout: PANEL_TYPE.grid,
							items: sideItems,
							colSpan: 3,
							panelType: "sidePanel",
						},
					],
			  }
			: {
					items: [
						{
							layout: PANEL_TYPE.grid,
							items: items,
							colSpan: 12,
							panelType: "mainPanel",
							...(rest._type === "customField" ? { cols: 12 } : {}), // this determines whether panel responds to colSpan changes or not.
						},
					],
			  }
	}, [sideItems, mainItems, items, rest._type])

	return (
		<div className="flex-container">
			{rootPanel.items.map(({ items, colSpan, panelType, ...attrs }, i) => (
				<div
					style={{
						maxWidth: "100%",
						...(colSpan === 9
							? {
									overflow: "hidden",
							  }
							: {
									overflow: "clip" /* required */,
									overflowClipMargin: " 20px",
							  }),
					}}
					className={`flex-item span-${colSpan}`}
					key={i}
				>
					<Grid
						key={i}
						design={design}
						className="form-body"
						items={items}
						attrs={attrs}
						_type={rest._type}
						widgets={widgets}
						widgetErrorList={rest.widgetErrorList}
						customErrorList={rest.customErrorList}
						canRemove={rest.canRemove}
						isBase={rest.isBase}
						panelType={panelType}
					/>
				</div>
			))}
		</div>
	)
}

export default FormComponent
