import React from "react"
import classNames from "classnames"
import { Box } from "@axelor/ui"

export default function Field(props) {
	return (
		<Box
			w={{ base: "auto", md: 100 }}
			{...props}
			className={classNames(props.className)}
		/>
	)
}
