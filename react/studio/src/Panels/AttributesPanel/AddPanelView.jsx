import React from "react"
import { Divider, Container, Grid, useMediaQuery } from "@mui/material"
import { styled } from "@mui/material/styles"
import { getFields } from "../../fields"
import FieldComponent from "../../components/FieldComponent"
import Widget from "../../components/Widget"
import Field from "./Field"
import classNames from "classnames"

const WidgetIcon = styled(Widget)({
	"&&&": { border: "none !important", boxShadow: "none", padding: "5px 0" },
})

export default React.memo(function AddPanelView({
	toolbarOffset,
	isStudioLite,
	modelType,
}) {
	const isResponsive = useMediaQuery(`(max-height: ${720 + toolbarOffset}px)`)
	const fields = React.useMemo(() => getFields(modelType), [modelType])

	const showField = (field) =>
		!isStudioLite || (isStudioLite && field.name !== "oneToMany")

	return (
		<Container
			className={classNames("toolbar-pallete")}
			sx={{
				width: "min-content !important",
				height: "fit-content !important",
				backgroundColor: "#fafafa",
				border: "1px solid lightgray",
				padding: "0 !important",
				margin: "1rem 0",
				borderRadius: "5px !important",
				marginTop: "14px !important",
				boxShadow: "1px 2px 8px 0px rgb(1 1 1 / 50%) !important",
			}}
		>
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
											!field.editorType.includes(modelType)
										) {
											return null
										}
										if (!showField(field)) {
											return null
										}
										return (
											<Grid
												item
												xs={isResponsive ? 6 : 12}
												sx={{
													"&:hover": {
														backgroundColor: "rgb(41 56 70 / 35%)",
													},
												}}
												key={i}
											>
												<Field key={i}>
													<WidgetIcon
														id={field.id}
														attrs={field}
														design={true}
														component={FieldComponent}
														isPalleteField={true}
													/>
												</Field>
											</Grid>
										)
									})}
							</Grid>
							{index < fields.length - 1 && (
								<Divider sx={{ margin: "4px", background: "gray" }} />
							)}
						</React.Fragment>
					)
			)}
		</Container>
	)
})
