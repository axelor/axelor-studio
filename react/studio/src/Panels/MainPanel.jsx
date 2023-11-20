import React from "react"
import classNames from "classnames"
import Editor from "../Editor"

export default React.memo(function MainPanel({ toolbarOffset, className }) {
	const [design] = React.useState(true)

	return (
		<div
			className={classNames(className, "form-layout-container", {
				"form-layout-design": design,
			})}
			style={{
				display: "flex",
				width: "100%",
				height: `calc(100vh - ${toolbarOffset}px)`,
				justifyContent: "center",
				overflow: "auto",
				position: "relative",
				paddingRight: "1em",
			}}
		>
			<Editor design={design} />
		</div>
	)
})
