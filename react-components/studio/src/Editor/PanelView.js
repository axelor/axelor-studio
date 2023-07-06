import React from "react";
import { Grid, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import classNames from "classnames";
import { translate } from "../utils";

const useStyles = makeStyles({
	container: {
		border: "1px solid #afafaf",
		margin: 5,
		width: "calc(100% - 6px)",
	},
	header: {
		padding: "5px 10px",
		borderBottom: "1px solid #eee",
	},
	content: {
		padding: 5,
	},
	active: {
		backgroundColor: "rgba(255,255,102, 0.5)",
	},
	hide: {
		visibility: "hidden",
	},
});

const PanelView = React.forwardRef((props, ref) => {
	const classes = useStyles();
	const title = props.title;
	return (
		<Grid ref={ref} container item xs={props.colSpan || 12}>
			<Grid
				className={classNames(
					classes.container,
					{ [classes.active]: props.isOverCurrent },
					{ [classes.hide]: props.isDragging }
				)}
			>
				{title && (
					<Grid className={classes.header}>
						<Typography variant="subtitle1">{translate(title)}</Typography>
					</Grid>
				)}
				<Grid container className={classes.content}>
					{props.children}
				</Grid>
			</Grid>
		</Grid>
	);
});

export default PanelView;
