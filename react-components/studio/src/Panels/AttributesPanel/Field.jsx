import React from "react"
import { styled } from "@mui/material/styles"
import classNames from "classnames"

const StyledField = styled("div")(({ theme }) => ({
	[theme.breakpoints.down("md")]: {
		width: "100%",
	},
}))

export default function Field(props) {
	return <StyledField {...props} className={classNames(props.className)} />
}
