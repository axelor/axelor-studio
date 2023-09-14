import React from "react";
import classNames from "classnames";
import Grid from "./Grid";
import { TYPE } from "../constants";
import { translate } from "../utils";

/**
 * Panel Component
 * Used As Container to group Field Component like form group
 */
function PanelComponent({ id, attrs, design, isTab = false, ...rest }) {
	const errors = rest.errorList[id] || {};
	return (
		<React.Fragment>
			{(attrs.title ||
				[TYPE.toolbar, TYPE.menubar].includes(attrs.serverType)) && (
				<div
					className={classNames("panel-header", {
						inline: isTab,
					})}
				>
					{translate(attrs.title || attrs.autoTitle)}
					{attrs.serverType === TYPE.toolbar && (
						<i className="fa fa-wrench" title={translate("Toolbar")} />
					)}
					{attrs.serverType === TYPE.menubar && (
						<i className="fa fa-bars" title={translate("Menubar")} />
					)}
				</div>
			)}
			{errors.items && !isTab && (
				<div className={classNames("panel-children-error")}>{errors.items}</div>
			)}
			{!isTab && (
				<Grid
					design={design}
					className="panel-body"
					items={attrs.items || []}
					attrs={attrs}
					panelId={id}
					_type={rest._type}
					errorList={rest.errorList}
					canRemove={rest.canRemove}
				/>
			)}
		</React.Fragment>
	);
}

export default React.memo(PanelComponent);
