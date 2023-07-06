import React from "react";
import { Grid, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";

import FieldComponent from "../../components/FieldComponent";
import Widget from "../../components/Widget";
import Field from "./Field";
import { IDS } from "../../constants";
import { useStore } from "../../store/context";
import { translate } from "../../utils";

const useStyles = makeStyles({
	container: {
		padding: "0 10px",
		display: "flex",
		flexWrap: "wrap",
		alignItems: "center",
		justifyContent: "space-between",
	},
	message: {
		color: "#fff",
	},
});

export default React.memo(function ExistingFieldsView(props) {
	const classes = useStyles();
	const { state } = useStore();
	const fields = state.metaFields || [];
	return (
		<Grid className={classes.container}>
			{fields ? (
				fields.map((field, i) => (
					<Field key={i}>
						<Widget
							attrs={{ ...field, isCoreField: false }}
							design={true}
							component={FieldComponent}
							id={IDS.createWidgets.field}
							targetImageName={`${field && field.type.toLowerCase()}.png`}
						/>
					</Field>
				))
			) : (
				<Typography className={classes.message}>
					{translate("No fields available")}
				</Typography>
			)}
		</Grid>
	);
});
