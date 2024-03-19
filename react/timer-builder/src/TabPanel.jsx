import React from "react"
import { Box } from "@axelor/ui"

function TabPanel(props) {
  const { children, value, index, ...other } = props

  return (
    <div
      style={{ padding: "1rem" }}
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box p={3}>{children}</Box>}
    </div>
  )
}

export default TabPanel
