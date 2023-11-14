import React from "react"
import classNames from "classnames"
import { Box } from "@axelor/ui"
import { MaterialIcon } from "@axelor/ui/icons/material-icon"
import { GridContainer, useGridWidget } from "./Grid"
import { translate } from "../utils"
import { useStoreState } from "../store/context"
import { MODEL_TYPE } from "../constants"
import Tooltip from "./tooltip/tooltip"

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
				<Box
					color="body"
					className={classNames("panel-header panel-tab-header", {
						inline: isTab,
					})}
				>
					{title}
				</Box>
			)}
			{!isTab && (
				<GridContainer className={"tabs-panel panel-body"} attrs={panelAttrs}>
					<Box className={classNames("tabs")}>
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
							<Box d="flex" alignItems="center">
								<Tooltip title={translate("Add tab")} arrow>
									<MaterialIcon
										color="primary"
										icon="add"
										fontSize={20}
										onClick={() => addTabPanel({ id })}
									/>
								</Tooltip>
							</Box>
						)}
					</Box>
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
