import React from "react"
import { Box, Button, Popper } from "@axelor/ui"
import { translate } from "../utils"

export default function PopoverAlert({
	targetEl,
	anchorEl,
	handleClose,
	handleYes,
}) {
	const open = Boolean(anchorEl)
	const id = open ? "simple-popover" : undefined

	return (
		<Popper
			id={id}
			open={open}
			onClose={handleClose}
			target={targetEl}
			offset={[0, 4]}
			arrow
		>
			<Box
				d="flex"
				justifyContent="center"
				flexDirection="column"
				p={2}
				style={{ height: "70px" }}
			>
				<Box textAlign="center" mb={1}>
					{translate("Do you really want to delete?")}
				</Box>
				<Box d="flex" justifyContent="flex-end">
					<Button
						color="light"
						fontWeight="bold"
						bg="primary"
						size="sm"
						mx={1}
						px={1}
						py={0}
						onClick={handleYes}
					>
						{translate("Yes")}
					</Button>
					<Button
						color="light"
						fontWeight="bold"
						bg="primary"
						size="sm"
						mx={1}
						px={1}
						py={0}
						onClick={handleClose}
					>
						{translate("No")}
					</Button>
				</Box>
			</Box>
		</Popper>
	)
}
