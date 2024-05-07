import React from "react"
import classNames from "classnames"
import { Box } from "@axelor/ui"
import { BootstrapIcon } from "@axelor/ui/icons/bootstrap-icon"

import Grid from "./Grid"
import { TYPE } from "../constants"
import { translate } from "../utils"
import Tooltip from "./tooltip/tooltip"
/**
 * Panel Component
 * Used As Container to group Field Component like form group
 */
function PanelComponent({ id, attrs, design, isTab = false, ...rest }) {
	return (
		<React.Fragment>
			{(attrs.title ||
				isTab ||
				[TYPE.toolbar, TYPE.menubar].includes(attrs.serverType)) && (
				<Box
					color="body"
					className={classNames("panel-header", {
						inline: isTab,
					})}
				>
					{translate(
						attrs.title || attrs.autoTitle || (isTab ? attrs.field : "")
					)}
					{attrs.serverType === TYPE.toolbar && (
						<Tooltip title={translate("Toolbar")}>
							<BootstrapIcon icon="wrench" fontSize={14} />
						</Tooltip>
					)}
					{attrs.serverType === TYPE.menubar && (
						<Tooltip title={translate("Menubar")}>
							<BootstrapIcon icon="list" fontSize={14} />
						</Tooltip>
					)}
				</Box>
			)}
			{!isTab && (
				<Grid
					design={design}
					className="panel-body"
					items={attrs.items || []}
					attrs={attrs}
					panelId={id}
					_type={rest._type}
					isBase={rest.isBase}
					customErrorList={rest.customErrorList}
					widgetErrorList={rest.widgetErrorList}
					canRemove={rest.canRemove}
				/>
			)}
		</React.Fragment>
	)
}

export default React.memo(PanelComponent)
