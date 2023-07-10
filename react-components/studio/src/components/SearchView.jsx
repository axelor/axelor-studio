import React from "react"
import { styled } from "@mui/material/styles"
import Button from "@mui/material/Button"
import Grid from "@mui/material/Grid"
import Stack from "@mui/material/Stack"
import ChevronLeft from "@mui/icons-material/ChevronLeft"
import ChevronRight from "@mui/icons-material/ChevronRight"
import Typography from "@mui/material/Typography"
import Dialog from "@mui/material/Dialog"
import DialogActions from "@mui/material/DialogActions"
import DialogContent from "@mui/material/DialogContent"
import DialogTitle from "@mui/material/DialogTitle"
import useMediaQuery from "@mui/material/useMediaQuery"
import List from "@mui/material/List"
import ListItem from "@mui/material/ListItem"
import ListItemText from "@mui/material/ListItemText"
import { useTheme } from "@mui/material/styles"
import IconButton from "@mui/material/IconButton"
import { Search } from "@mui/icons-material"
import {
	Tabs,
	Tab,
	CircularProgress,
	Box,
	InputAdornment,
	TextField,
} from "@mui/material"

import { translate } from "../utils"

const StyledListItem = styled(ListItem)({
	borderBottom: "1px solid #ddd",
	paddingTop: 10,
	paddingBottom: 10,
})

const tabsLabel = ["Model actions", "Global actions", "Other actions"]

function TabPanel(props) {
	const { children, value, index, ...other } = props

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
	)
}

export default function ResponsiveDialog(props) {
	const {
		list = [],
		onChange,
		handleClose,
		offset,
		total,
		limit,
		displayField,
		getOptionLabel,
		isTypeOnClick = false,
		isDataLoading,
	} = props
	const theme = useTheme()
	const fullScreen = useMediaQuery(theme.breakpoints.down("md"))

	const handleItemClick = React.useCallback(
		(item) => {
			onChange(item)
			handleClose()
		},
		[onChange, handleClose]
	)
	const page = Math.ceil((offset + 1) / limit)
	const totalPages = Math.ceil(total / limit) || 1
	const canNext = list.length > 0 && offset + list.length < total
	const canPrev = offset > 0

	const getLabel = (item) => {
		return getOptionLabel ? getOptionLabel(item) : item[displayField || "name"]
	}

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
					sx={{ borderBottom: "0.5px solid #ddd" }}
				>{`${translate("Search")} ${
					props.title || translate("item")
				}`}</DialogTitle>
				<DialogContent sx={{ pt: "8px !important" }}>
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
									sx={{
										"& .MuiOutlinedInput-root": {
											borderRadius: 20,
											"& fieldset": {
												borderColor: "#bdbdbd !important",
											},
											"&:hover fieldset": {
												borderColor: "#bdbdbd",
											},
											"&.Mui-focused fieldset": {
												borderColor: "#bdbdbd",
											},
										},
									}}
									value={props.searchText}
									variant="outlined"
									onChange={(e) => props.setSearchText(e.target.value)}
									InputProps={{
										startAdornment: (
											<InputAdornment position="start">
												<Search sx={{ fill: "#bdbdbd " }} />
											</InputAdornment>
										),
									}}
									placeholder={translate("Search")}
								/>
							</Grid>
							<Stack direction="row" alignItems="center">
								<IconButton
									onClick={props.onPrevious}
									disabled={!canPrev || isDataLoading}
									size="small"
								>
									<ChevronLeft />
								</IconButton>
								<span>{`${page}/${totalPages}`}</span>
								<IconButton
									onClick={props.onNext}
									disabled={!canNext || isDataLoading}
									size="small"
								>
									<ChevronRight />
								</IconButton>
							</Stack>
						</Grid>
						{isTypeOnClick && (
							<Grid item xs={12}>
								<Tabs
									orientation="horizontal"
									variant="fullWidth"
									value={props.currentTab}
									onChange={props.onTabChange}
									sx={{
										"& .MuiTabs-indicator": {
											backgroundColor: "#3f51b5",
										},
									}}
								>
									{tabsLabel.map((label, i) => (
										<Tab
											key={`${i}-${label}`}
											label={translate(label)}
											sx={{ textTransform: "none" }}
										/>
									))}
								</Tabs>
							</Grid>
						)}
					</Grid>
					{isDataLoading ? (
						<Box
							sx={{
								minHeight: 300,
								padding: "8px",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							<CircularProgress size={40} />
						</Box>
					) : list.length !== 0 ? (
						!isTypeOnClick ? (
							<List
								sx={{
									width: "100%",
									backgroundColor: theme.palette.background.paper,
									minHeight: 300,
									overflow: "auto",
								}}
							>
								{list
									.filter((item) => item.id !== "studio_show_More_View")
									.map((item, i) => (
										<StyledListItem
											key={`${i}-${getLabel(item)}`}
											role={undefined}
											dense
											button
											onClick={() => handleItemClick(item)}
										>
											<ListItemText id={i} primary={getLabel(item)} />
										</StyledListItem>
									))}
							</List>
						) : (
							tabsLabel.map(
								(_, index) =>
									props.currentTab === index && (
										<Grid item>
											<TabPanel value={index} index={index}>
												<Grid item>
													<List
														sx={{
															width: "100%",
															backgroundColor: theme.palette.background.paper,
															minHeight: 300,
															overflow: "auto",
														}}
													>
														{list
															.filter(
																(item) => item.id !== "studio_show_More_View"
															)
															.map((item, i) => (
																<StyledListItem
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
																</StyledListItem>
															))}
													</List>
												</Grid>
											</TabPanel>
										</Grid>
									)
							)
						)
					) : (
						<Box
							sx={{
								minHeight: 300,
								padding: "8px",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							<Typography variant="body2">
								{translate("No data found")}
							</Typography>
						</Box>
					)}
				</DialogContent>
				<DialogActions>
					<Button autoFocus onClick={props.handleClose} color="primary">
						<Typography sx={{ textTransform: "capitalize" }}>
							{translate("Close")}
						</Typography>
					</Button>
				</DialogActions>
			</Dialog>
		</div>
	)
}
