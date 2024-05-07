import React from "react"
import classNames from "classnames"
import Grid from "./Grid"
import { translate } from "../utils"
import { useStore } from "../store/context"
import { BootstrapIcon } from "@axelor/ui/icons/bootstrap-icon"

/**
 * Menu Component
 * Used As Container to group Field Component like form group
 */
function MenuComponent({ id, attrs, design, isTab = true, ...rest }) {
	const errors = rest.customErrorList[id] || rest.widgetErrorList[id] || {}
	const [openMenu, setOpenMenu] = React.useState(false)

	const { state } = useStore()

	const handleToggleMenu = React.useCallback((e) => {
		e.stopPropagation()
		setOpenMenu((m) => !m)
	}, [])

	React.useEffect(() => {
		const { highlightedOption } = state
		if (["menu", "item"].includes(highlightedOption?.type)) {
			setOpenMenu(true)
		}
	}, [state])

	const arrow = openMenu ? "down" : "up"
	return (
		<React.Fragment>
			<div
				className={classNames("menu-header", {
					inline: isTab,
				})}
			>
				<div className="menu-toggle-button" onClick={handleToggleMenu}>
					<BootstrapIcon icon={`chevron-compact-${arrow}`} />
				</div>
				<span>{translate(attrs.title || attrs.autoTitle)}</span>
				<div className="menu-toggle-button" onClick={handleToggleMenu}>
					<BootstrapIcon icon={`chevron-compact-${arrow}`} />
				</div>
			</div>
			{errors.items && !isTab && (
				<div className={classNames("panel-children-error")}>{errors.items}</div>
			)}
			{openMenu && (
				<Grid
					design={design}
					className="panel-body"
					items={attrs.items || []}
					attrs={attrs}
					panelId={id}
					_type={rest._type}
					customErrorList={rest.customErrorList}
					widgetErrorList={rest.widgetErrorList}
					canRemove={rest.canRemove}
				/>
			)}
		</React.Fragment>
	)
}

export default React.memo(MenuComponent)
