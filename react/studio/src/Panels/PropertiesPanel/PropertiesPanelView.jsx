import React, { useState } from "react"
import { Resizable } from "re-resizable"
import { translate } from "../../utils"
import PropertiesView from "./PropertiesView"
import { useStore } from "../../store/context"
import { Box } from "@axelor/ui"

const drawerWidth = 380
const resizeStyle = {
	borderLeft: "solid 1px var(--bs-secondary-bg)",
	backgroundColor: "var(--bs-tertiary-bg)",
}

export default React.memo(function PropertiesPanel() {
	const { update } = useStore()
	const [drawerOpen, setDrawerOpen] = useState(true)
	const [width, setWidth] = useState(drawerWidth)
	const [height, setHeight] = useState("100%")

	const setCSSWidth = (width) => {
		setDrawerOpen(width === "0px" ? false : true)
	}

	React.useEffect(() => {
		update((draft) => {
			draft.drawerOpen = drawerOpen
			draft.propertiesPanelWidth = width
		})
	}, [drawerOpen, update, width])

	React.useEffect(() => {
		const checkWindowSize = () => {
			if (drawerOpen) {
				setWidth((prev) =>
					window.innerWidth - prev < drawerWidth
						? window.innerWidth - drawerWidth
						: prev < drawerWidth
						? window.innerWidth - prev
						: prev
				)
			}
		}
		window.addEventListener("resize", checkWindowSize)

		return () => {
			window.removeEventListener("resize", checkWindowSize)
		}
	})

	return (
		<div
			style={{ position: "sticky", top: "0px", right: "0px", height: "100vh" }}
		>
			<Resizable
				style={resizeStyle}
				size={{ width, height }}
				onResizeStop={(e, direction, ref, d) => {
					setWidth((width) => width + d.width)
					setHeight(height + d.height)
					setCSSWidth(`${width + d.width}px`)
				}}
				maxWidth={window.innerWidth - drawerWidth}
				minHeight={height}
				enable={{
					left: true,
				}}
			>
				<Box style={{ height: "100vh" }} overflow="auto">
					<PropertiesView />
				</Box>
				<Box
					color="body"
					borderEnd
					borderTop
					borderStart
					fontSize={6}
					pos="absolute"
					bg="body-tertiary"
					userSelect="none"
					roundedTop
					style={{
						left: "-33px",
						top: "calc(50% + 60px)",
						padding: "5px 20px 7px 20px",
						transform: "rotate(-90deg)",
						whiteSpace: "nowrap",
						transformOrigin: "top left",
						zIndex: "10",
						cursor: "pointer",
						userSelect: "none",
					}}
					onClick={() => {
						setWidth((width) => (width === 0 ? drawerWidth : 0))
						setCSSWidth(`${width === 0 ? drawerWidth : 0}px`)
					}}
				>
					{translate("Properties")}
				</Box>
			</Resizable>
		</div>
	)
})
