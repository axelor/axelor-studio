import React from "react"
import classNames from "classnames"
import Editor from "../Editor"
import { Box, Scrollable } from "@axelor/ui"

export default React.memo(function MainPanel({ toolbarOffset, className }) {
	const [design] = React.useState(true)

	return (
		<Box
			className={classNames(className, "form-layout-container", {
				"form-layout-design": design,
			})}
			d="flex"
			justifyContent="center"
			overflow="auto"
			pos="relative"
			w={100}
			style={{
				height: `calc(100vh - ${toolbarOffset}px)`,
			}}
		>
			<Scrollable w={100} h={100}>
				<Editor design={design} />
			</Scrollable>
		</Box>
	)
})
