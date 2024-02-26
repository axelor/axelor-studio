import React, { cloneElement } from "react"
import { Box, ClickAwayListener, Popper, usePopperTrigger } from "@axelor/ui"
import styles from "./tooltip.module.css"

export default function Tooltip({ children, title, placement = "bottom" }) {
	const { open, targetEl, setTargetEl, setContentEl, onClickAway } =
		usePopperTrigger({
			trigger: "hover",
			interactive: true,
			delay: {
				open: 10,
				close: 100,
			},
		})

	return (
		<>
			{cloneElement(children, {
				ref: (el) => {
					setTargetEl(el)
					if (children.ref) {
						if (typeof children.ref === "function") {
							children.ref(el)
						} else {
							children.ref.current = el
						}
					}
				},
			})}
			{title && (
				<Popper
					id="simple-popover"
					className={styles.tooltip}
					open={open}
					target={targetEl}
					offset={[0, 4]}
					placement={placement}
					arrow
					shadow
				>
					<ClickAwayListener onClickAway={onClickAway}>
						<Box ref={setContentEl}>
							{title && <Box className={styles.title}>{title}</Box>}
						</Box>
					</ClickAwayListener>
				</Popper>
			)}
		</>
	)
}
