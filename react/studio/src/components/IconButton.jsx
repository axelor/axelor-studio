import { Box, Button } from "@axelor/ui"
import React from "react"

const IconButton = ({ children, disabled = false, ...props }) => {
	return (
		<Button
			id="icon-button"
			rounded="circle"
			d="flex"
			p={0}
			justifyContent="center"
			alignItems="center"
			disabled={disabled}
			onClick={disabled ? null : props.onClick}
			{...props}
		>
			{children}
		</Button>
	)
}

export default IconButton
