import React from "react";
import { Grid, Typography, TextField } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import classNames from "classnames";
import { translate } from "../utils";

const useStyles = makeStyles({
	container: {
		border: "1px dotted #afafaf",
		margin: 5,
		width: "calc(100% - 6px)",
	},
	header: {
		padding: 3,
	},
	content: {
		padding: 5,
	},
	active: {
		backgroundColor: "rgba(255,255,102, 0.5)",
	},
	hide: {
		display: "none",
	},
});

const FieldView = React.forwardRef((props, ref) => {
	const classes = useStyles();
	const title = props.placeholder || props.autoTitle;
	return (
		<Grid ref={ref} item xs={props.colSpan || 6}>
			<Grid
				className={classNames(
					classes.container,
					{ [classes.active]: props.isOverCurrent },
					{ [classes.hide]: props.isDragging }
				)}
			>
				{title && (
					<Grid className={classes.header}>
						{props.children ? (
							props.showTitle && (
								<Typography variant="h3">{translate(title)}</Typography>
							)
						) : (
							<TextField placeholder={translate(title)} />
						)}
					</Grid>
				)}
				<Grid container className={classes.content}>
					{props.children}
				</Grid>
			</Grid>
		</Grid>
	);
});

export default FieldView;
