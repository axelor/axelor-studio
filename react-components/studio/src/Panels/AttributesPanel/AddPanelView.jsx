import React from "react";
import { Divider, Container, Grid, useMediaQuery } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";

import { fieldTypes, modelFields } from "../../fields";
import FieldComponent from "../../components/FieldComponent";
import Widget from "../../components/Widget";
import Field from "./Field";
import { useStore } from "../../store/context";
import { MODEL_TYPE, TYPE } from "../../constants";
import classNames from "classnames";

const useStyles = makeStyles((theme) => ({
	container: {
		width: "min-content",
		height: "fit-content",
		backgroundColor: "#fafafa",
		border: "1px solid lightgray",
		padding: "0",
		margin: "1rem 0",
		borderRadius: 5,
		marginTop: 14,
		boxShadow: "1px 2px 8px 0px rgb(1 1 1 / 50%) !important",
	},
	attributeItem: {
		"&:hover": {
			backgroundColor: "rgb(41 56 70 / 35%)",
		},
	},
	divider: {
		margin: "4px",
		background: "gray",
	},
	widget: {
		border: "none !important",
		boxShadow: "none",
		padding: "5px 0",
	},
}));

export default React.memo(function AddPanelView({ toolbarOffset }) {
	const classes = useStyles();
	const { state } = useStore();
	const { isStudioLite } = state;

	const isResponsive = useMediaQuery(`(max-height: ${720 + toolbarOffset}px)`);
	const fields = [...fieldTypes, ...modelFields].filter((e) => {
		if (e.name === "Menu" && state.modelType === MODEL_TYPE.CUSTOM) {
			return false;
		}
		return true;
	});

	const showField = (field) => {
		if ([TYPE.menubar, TYPE.toolbar].includes(field.type) && state.widgets) {
			const index = Object.values(state.widgets).findIndex(
				(w) => w.type === field.type
			);
			return index === -1;
		} else if (isStudioLite && field.name === "oneToMany") {
			return false;
		}
		return true;
	};

	return (
		<Container className={classNames(classes.container, "toolbar-pallete")}>
			{fields.map(
				(fieldType, index) =>
					(!isStudioLite ||
						(isStudioLite &&
							["Fields", "Relational fields"].includes(fieldType.name))) && (
						<React.Fragment key={index}>
							<Grid container style={{ width: isResponsive ? "80px" : "40px" }}>
								{fieldType.value &&
									fieldType.value.map((field, i) => {
										if (
											field.editorType &&
											!field.editorType.includes(state.modelType)
										) {
											return null;
										}
										if (!showField(field)) {
											return null;
										}
										return (
											<Grid
												item
												xs={isResponsive ? 6 : 12}
												className={classes.attributeItem}
												key={i}
											>
												<Field key={i}>
													<Widget
														id={field.id}
														attrs={field}
														design={true}
														component={FieldComponent}
														isCoreField={true}
														isPalleteField={true}
														className={classes.widget}
													/>
												</Field>
											</Grid>
										);
									})}
							</Grid>
							{index < fields.length - 1 && (
								<Divider className={classes.divider} />
							)}
						</React.Fragment>
					)
			)}
		</Container>
	);
});
