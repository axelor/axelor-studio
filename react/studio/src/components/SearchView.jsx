import React from "react"
import { translate } from "../utils"
import {
	Box,
	Button,
	CircularProgress,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	List,
	ListItem,
	NavTabs,
	Scrollable,
	TextField,
} from "@axelor/ui"
import { MaterialIcon } from "@axelor/ui/icons/material-icon"
import IconButton from "./IconButton"

const tabsLabel = ["Model actions", "Global actions", "Other actions"]
const tabsLabel2 = [
	{ id: 0, title: "Model actions" },
	{ id: 1, title: "Global actions" },
	{ id: 2, title: "Other actions" },
]

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
	const [inputRef, setInputRef] = React.useState()
	React.useEffect(() => {
		if (inputRef) {
			inputRef.focus()
		}
		return () => inputRef && inputRef.blur()
	}, [inputRef])

	return (
		<div>
			<Dialog
				fullScreen={{ base: false, md: true }}
				maxWidth="sm"
				open={props.open}
				aria-labelledby="responsive-dialog-title"
			>
				<DialogHeader onCloseClick={props.handleClose}>
					<DialogTitle id="responsive-dialog-title">{`${translate("Search")} ${
						props.title || translate("item")
					}`}</DialogTitle>
				</DialogHeader>
				<DialogContent>
					<Box w={100}>
						<Box d="flex" flexDirection="row" alignItems="center">
							{/* Add tabbed view for distinguising between different types of models */}
							<Box flex={1}>
								<Input
									ref={setInputRef}
									size="small"
									fullWidth
									flex={1}
									w={100}
									value={props.searchText ?? ""}
									variant="outlined"
									onChange={(e) => props.setSearchText(e.target.value)}
									placeholder={translate("Search")}
								/>
							</Box>
							<Box d="flex" flexDirection="row" alignItems="center" horizontal>
								<IconButton
									onClick={props.onPrevious}
									disabled={!canPrev || isDataLoading}
									size="small"
								>
									<MaterialIcon
										color="primary"
										fontSize={25}
										icon="arrow_left"
									/>
								</IconButton>
								<span>{`${page}/${totalPages}`}</span>
								<IconButton
									onClick={props.onNext}
									disabled={!canNext || isDataLoading}
									size="small"
								>
									{" "}
									<MaterialIcon
										color="primary"
										fontSize={25}
										icon="arrow_right"
									/>
								</IconButton>
							</Box>
						</Box>
						{isTypeOnClick && (
							<Box>
								<NavTabs
									items={tabsLabel2}
									active={props.currentTab}
									onItemClick={(e) => props.onTabChange("", e.id)}
								/>
							</Box>
						)}
					</Box>
					{isDataLoading ? (
						<Box
							d="flex"
							justifyContent="center"
							alignItems="center"
							p={2}
							style={{
								minHeight: "253px",
							}}
						>
							<CircularProgress size={40} indeterminate />
						</Box>
					) : list.length !== 0 ? (
						!isTypeOnClick ? (
							<Scrollable style={{ maxHeight: "253px" }}>
								<List flush w={100} py={1} px={0} overflow="hidden">
									{list
										.filter((item) => item.id !== "studio_show_More_View")
										.map((item, i) => (
											<ListItem
												style={{ cursor: "pointer" }}
												key={`${i}-${getLabel(item)}`}
												onClick={() => handleItemClick(item)}
											>
												<Box id={i}>{getLabel(item)}</Box>
											</ListItem>
										))}
								</List>
							</Scrollable>
						) : (
							tabsLabel.map(
								(_, index) =>
									props.currentTab === index && (
										<Box key={index}>
											<TabPanel value={index} index={index}>
												<Box>
													<Scrollable style={{ height: "253px" }}>
														<List flush w={100} py={1} px={0} overflow="hidden">
															{list
																.filter(
																	(item) => item.id !== "studio_show_More_View"
																)
																.map((item, i) => (
																	<ListItem
																		key={`${i}-${getLabel(item)}`}
																		role={undefined}
																		dense
																		button
																		onClick={() => handleItemClick(item)}
																	>
																		<Box id={i}>{getLabel(item)}</Box>
																	</ListItem>
																))}
														</List>
													</Scrollable>
												</Box>
											</TabPanel>
										</Box>
									)
							)
						)
					) : (
						<Box
							d="flex"
							justifyContent="center"
							alignItems="center"
							p={2}
							style={{
								minHeight: "253px",
							}}
						>
							<Box color="body">{translate("No data found")}</Box>
						</Box>
					)}
				</DialogContent>
				<DialogFooter>
					<Button
						autoFocus
						onClick={props.handleClose}
						size="sm"
						color="primary"
					>
						<Box textTransform="capitalize">{translate("Close")}</Box>
					</Button>
				</DialogFooter>
			</Dialog>
		</div>
	)
}
