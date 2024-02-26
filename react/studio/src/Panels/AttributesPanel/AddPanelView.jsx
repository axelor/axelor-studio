import React from "react"
import { Box, Divider } from "@axelor/ui"
import styled from "@axelor/ui/core/styled"
import { getFields } from "../../fields"
import FieldComponent from "../../components/FieldComponent"
import Widget from "../../components/Widget"
import Field from "./Field"
import classNames from "classnames"

const Container = styled(Box)(({ display = "grid" }) => ({ display }))

const AddPanelView = React.memo((props) => {
	const { toolbarOffset, modelType } = props
	const mediaQueryString = `(max-height: ${720 + toolbarOffset}px)`
	const isResponsive = window.matchMedia(mediaQueryString).matches
	const fields = React.useMemo(() => getFields(modelType), [modelType])

	return (
		<Box
			className={classNames("toolbar-pallete")}
			border
			shadow="lg"
			p={0}
			rounded="2"
			mt="2"
			bg="body-tertiary"
			my={4}
			style={{
				width: "min-content ",
				height: "fit-content ",
			}}
		>
			{fields.map(
				(section, index) =>
					!section.isHidden?.(props) &&
					!section.value?.every((field) => field.isHidden?.(props)) && (
						<React.Fragment key={index}>
							<Container
								gridTemplateColumns={isResponsive ? "50% 50%" : "100%"}
								style={{ width: isResponsive ? "80px" : "40px" }}
							>
								{section.value &&
									section.value.map((field, i) => {
										if (field.isHidden?.(props)) return null
										return (
											<Container
												placeContent="center"
												className="addPanelIcon"
												key={i}
											>
												<Field key={i}>
													<Widget
														id={field.attrs.id}
														attrs={field.attrs}
														design={true}
														component={FieldComponent}
														isPalleteField={true}
													/>
												</Field>
											</Container>
										)
									})}
							</Container>
							{index < fields.length - 1 && <Divider mt={1} />}
						</React.Fragment>
					)
			)}
		</Box>
	)
})

AddPanelView.displayName = "AddPanelView"
export default AddPanelView
