import React from "react";
import { Box } from "@axelor/ui";

interface TabPanelProps {
  children: React.ReactNode;
  value: number;
  index: number;
  [key: string]: unknown;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
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
  );
}

export default TabPanel;
