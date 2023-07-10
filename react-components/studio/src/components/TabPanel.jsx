import React from "react"
import classNames from "classnames"
import Tooltip from "@mui/material/Tooltip"
import AddIcon from "@mui/icons-material/Add"

import { GridContainer, useGridWidget } from "./Grid"
import { translate } from "../utils"
import { useStoreState } from "../store/context"
import { MODEL_TYPE } from "../constants"

const panelAttrs = { cols: 1 }

/**
 * Panel Component
 * Used As Container to group Field Component like form group
 */
function TabPanelComponent(props) {
	const WidgetComponent = useGridWidget()
	const { modelType, highlightedOption } = useStoreState()
	const { id, attrs, isTab = false, addTabPanel, ...rest } = props
	const { title, items = [] } = attrs
	let { current } = attrs
	const tabs = [...items.slice()].reduce(
		(all, tab) => all.concat([tab, 0]),
		[0]
	)

	// reuse common tab attributes
	const getTabAttributes = (id, index) => ({
		key: !id ? `${id}${index}` : id,
		id,
		meta: {
			horizontal: true,
		},
		index,
		panelId: props.id,
		panelColumns: attrs.cols,
		tabId: props.id,
	})
	let activeTabIndex = items.indexOf(current)
	// if active tab index not found, take first element as active one
	if (activeTabIndex === -1) {
		activeTabIndex = 0
		current = items.length ? items[0] : 0
	}

	return (
		<React.Fragment>
			{title && (
				<div
					className={classNames("panel-header panel-tab-header", {
						inline: isTab,
					})}
				>
					{title}
				</div>
			)}
			{!isTab && (
				<GridContainer className={"tabs-panel panel-body"} attrs={panelAttrs}>
					<div className={classNames("tabs")}>
						{tabs.map(
							(tab, i) =>
								WidgetComponent && (
									<WidgetComponent
										{...rest}
										{...getTabAttributes(tab, i)}
										isTab={true}
										className={
											current === tab && current === highlightedOption?.id
												? "search-overlay"
												: current === tab
												? "active-tab"
												: ""
										}
									/>
								)
						)}
						{!(
							modelType === MODEL_TYPE.BASE && props._type !== "customField"
						) && (
							<div style={{ display: "flex", alignItems: "center" }}>
								<Tooltip title={translate("Add tab")} arrow>
									<AddIcon onClick={() => addTabPanel({ id })} />
								</Tooltip>
							</div>
						)}
					</div>
					{items.length > 0 && WidgetComponent && (
						<WidgetComponent
							className={highlightedOption?.id === current && "search-overlay"}
							{...rest}
							{...getTabAttributes(current, activeTabIndex)}
						/>
					)}
				</GridContainer>
			)}
		</React.Fragment>
	)
}

//panel tabs-panel
export default TabPanelComponent
