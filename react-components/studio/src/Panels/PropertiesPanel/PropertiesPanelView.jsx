import { Drawer } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import React, { useState } from "react";
import { Resizable } from "re-resizable";

import { translate } from "../../utils";
import PropertiesView from "./PropertiesView";
import { useStore } from "../../store/context";

const drawerWidth = 380;
const resizeStyle = {
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	borderLeft: "solid 1px #ddd",
	background: "#f0f0f0",
};

const useStyles = makeStyles({
	drawerPaper: {
		background: "#2f4050",
		width: "100%",
		height: "100%",
		position: "absolute",
		borderLeft: "1px solid #2f4050",
		overflow: "auto",
	},
	propertyToggle: {
		position: "absolute",
		left: "-30px",
		top: "calc(50% + 60px)",
		background: "#293846",
		color: "white",
		padding: "5px 20px 7px 20px",
		transform: "rotate(-90deg)",
		whiteSpace: "nowrap",
		fontSize: "13px",
		border: "solid 1px #293846",
		borderBottom: "none",
		borderRadius: "5px 5px 0 0",
		transformOrigin: "top left",
		zIndex: "10",
		cursor: "default",
		userSelect: "none",
		boxShadow: "1px 2px 8px 0px rgb(1 1 1 / 75%) !important",
	},
	container: {
		position: "sticky",
		top: "0px",
		height: "100vh",
	},
});
export default React.memo(function PropertiesPanel() {
	const { update } = useStore();
	const classes = useStyles();
	const [drawerOpen, setDrawerOpen] = useState(true);
	const [width, setWidth] = useState(drawerWidth);
	const [height, setHeight] = useState("100%");

	const setCSSWidth = (width) => {
		setDrawerOpen(width === "0px" ? false : true);
	};

	React.useEffect(() => {
		update((draft) => {
			draft.drawerOpen = drawerOpen;
			draft.propertiesPanelWidth = width;
		});
	}, [drawerOpen, update, width]);

	React.useEffect(() => {
		const checkWindowSize = () => {
			if (drawerOpen) {
				setWidth((prev) =>
					window.innerWidth - prev < drawerWidth
						? window.innerWidth - drawerWidth
						: prev < drawerWidth
						? window.innerWidth - prev
						: prev
				);
			}
		};
		window.addEventListener("resize", checkWindowSize);

		return () => {
			window.removeEventListener("resize", checkWindowSize);
		};
	});

	return (
		<div className={classes.container}>
			<Resizable
				style={resizeStyle}
				size={{ width, height }}
				onResizeStop={(e, direction, ref, d) => {
					setWidth((width) => width + d.width);
					setHeight(height + d.height);
					setCSSWidth(`${width + d.width}px`);
				}}
				maxWidth={window.innerWidth - drawerWidth}
				minHeight={height}
				enable={{
					left: true,
				}}
			>
				<Drawer
					variant="persistent"
					anchor="right"
					open={drawerOpen}
					style={{
						width: drawerWidth,
					}}
					classes={{
						paper: classes.drawerPaper,
					}}
					transitionDuration={0}
				>
					<PropertiesView />
				</Drawer>
				<div
					className={classes.propertyToggle}
					onClick={() => {
						setWidth((width) => (width === 0 ? drawerWidth : 0));
						setCSSWidth(`${width === 0 ? drawerWidth : 0}px`);
					}}
				>
					{translate("Properties")}
				</div>
			</Resizable>
		</div>
	);
});
