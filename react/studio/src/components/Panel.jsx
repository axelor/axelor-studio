import React from "react"
import classNames from "classnames"
import Grid from "./Grid"
import { TYPE } from "../constants"
import { translate } from "../utils"

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
				<div
					className={classNames("panel-header", {
						inline: isTab,
					})}
				>
					{translate(
						attrs.title || attrs.autoTitle || (isTab ? attrs.field : "")
					)}
					{attrs.serverType === TYPE.toolbar && (
						<i className="fa fa-wrench" title={translate("Toolbar")} />
					)}
					{attrs.serverType === TYPE.menubar && (
						<i className="fa fa-bars" title={translate("Menubar")} />
					)}
				</div>
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
