import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import Grid from "@material-ui/core/Grid";
import ChevronLeft from "@material-ui/icons/ChevronLeft";
import ChevronRight from "@material-ui/icons/ChevronRight";
import Typography from "@material-ui/core/Typography";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import { useTheme } from "@material-ui/core/styles";
import IconButton from "@material-ui/core/IconButton";
import { Search } from "@material-ui/icons";
import {
	Tabs,
	Tab,
	CircularProgress,
	Box,
	InputAdornment,
	TextField,
} from "@material-ui/core";

import { translate } from "../utils";

const useStyles = makeStyles((theme) => ({
	root: {
		width: "100%",
		backgroundColor: theme.palette.background.paper,
		height: 300,
		overflow: "auto",
	},
	input: {
		"& .MuiOutlinedInput-root": {
			borderRadius: 20,
			"& fieldset": {
				borderColor: "#bdbdbd",
			},
			"&:hover fieldset": {
				borderColor: "#bdbdbd",
			},
			"&.Mui-focused fieldset": {
				borderColor: "#bdbdbd",
			},
		},
	},
	titleHeader: {
		borderBottom: "0.5px solid #ddd",
	},
	listItem: {
		borderBottom: "1px solid #ddd",
		paddingTop: 10,
		paddingBottom: 10,
	},
	closeText: {
		textTransform: "capitalize",
	},
	tabContainer: {
		"& .MuiTabs-indicator": {
			backgroundColor: "#3f51b5",
		},
	},
	labelStyle: {
		textTransform: "none",
	},
	centerElement: {
		height: 300,
		padding: "8px",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
	},
}));

const tabsLabel = ["Model actions", "Global actions", "Other actions"];

function TabPanel(props) {
	const { children, value, index, ...other } = props;

	return (
		<div
			role="tabpanel"
			hidden={value !== index}
			id={`horizontal-tabpanel-${index}`}
			aria-labelledby={`horizontal-tab-${index}`}
			{...other}
		>
			{value === index && <>{children}</>}
		</div>
	);
}

export default function ResponsiveDialog(props) {
	const {
		list = [],
		onChange,
		handleClose,
		offset,
		total,
		displayField,
		getOptionLabel,
		isTypeOnClick = false,
		isDataLoading,
	} = props;
	const theme = useTheme();
	const classes = useStyles();
	const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

	const handleItemClick = React.useCallback(
		(item) => {
			onChange(item);
			handleClose();
		},
		[onChange, handleClose]
	);

	const canNext = list.length > 0 && offset + list.length < total;
	const canPrev = offset > 0;

	const getLabel = (item) => {
		return getOptionLabel ? getOptionLabel(item) : item[displayField || "name"];
	};

	return (
		<div>
			<Dialog
				fullScreen={fullScreen}
				maxWidth="sm"
				fullWidth={true}
				open={props.open}
				onClose={props.handleClose}
				aria-labelledby="responsive-dialog-title"
			>
				<DialogTitle
					id="responsive-dialog-title"
					className={classes.titleHeader}
				>{`${translate("Search")} ${
					props.title || translate("item")
				}`}</DialogTitle>
				<DialogContent>
					<Grid container>
						<Grid container item alignItems="center">
							{/* Add tabbed view for distinguising between different types of models */}
							<Grid
								item
								xs={10}
								style={{
									flex: 1,
								}}
							>
								<TextField
									size="small"
									fullWidth
									className={classes.input}
									value={props.searchText}
									variant="outlined"
									onChange={(e) => props.setSearchText(e.target.value)}
									InputProps={{
										startAdornment: (
											<InputAdornment position="start">
												<Search style={{ fill: "#bdbdbd" }} />
											</InputAdornment>
										),
									}}
									placeholder={translate("Search")}
								/>
							</Grid>
							<Grid item>
								<IconButton onClick={props.onPrevious} disabled={!canPrev}>
									<ChevronLeft />
								</IconButton>
								<IconButton onClick={props.onNext} disabled={!canNext}>
									<ChevronRight />
								</IconButton>
							</Grid>
						</Grid>
						{isTypeOnClick && (
							<Grid item xs={12}>
								<Tabs
									orientation="horizontal"
									variant="fullWidth"
									value={props.currentTab}
									onChange={props.onTabChange}
									className={classes.tabContainer}
								>
									{tabsLabel.map((label, i) => (
										<Tab
											key={`${i}-${label}`}
											label={translate(label)}
											className={classes.labelStyle}
										/>
									))}
								</Tabs>
							</Grid>
						)}
					</Grid>
					{isDataLoading ? (
						<Box className={classes.centerElement}>
							<CircularProgress size={20} />
						</Box>
					) : list.length !== 0 ? (
						!isTypeOnClick ? (
							<List className={classes.root}>
								{list
									.filter((item) => item.id !== "studio_show_More_View")
									.map((item, i) => (
										<ListItem
											className={classes.listItem}
											key={`${i}-${getLabel(item)}`}
											role={undefined}
											dense
											button
											onClick={() => handleItemClick(item)}
										>
											<ListItemText id={i} primary={getLabel(item)} />
										</ListItem>
									))}
							</List>
						) : (
							tabsLabel.map(
								(_, index) =>
									props.currentTab === index && (
										<Grid item>
											<TabPanel value={index} index={index}>
												<Grid item>
													<List className={classes.root}>
														{list
															.filter(
																(item) => item.id !== "studio_show_More_View"
															)
															.map((item, i) => (
																<ListItem
																	className={classes.listItem}
																	key={`${i}-${getLabel(item)}`}
																	role={undefined}
																	dense
																	button
																	onClick={() => handleItemClick(item)}
																>
																	<ListItemText
																		id={i}
																		primary={getLabel(item)}
																	/>
																</ListItem>
															))}
													</List>
												</Grid>
											</TabPanel>
										</Grid>
									)
							)
						)
					) : (
						<Box className={classes.centerElement}>
							<Typography variant="body2">
								{translate("No data found")}
							</Typography>
						</Box>
					)}
				</DialogContent>
				<DialogActions>
					<Button autoFocus onClick={props.handleClose} color="primary">
						<Typography className={classes.closeText}>
							{translate("Close")}
						</Typography>
					</Button>
				</DialogActions>
			</Dialog>
		</div>
	);
}
