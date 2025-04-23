import React, { useState, useEffect, useMemo } from "react";
import { Box, NavTabs } from "@axelor/ui";
import styles from "./tabs.module.css";

function TabPanel(props) {
  const { children, value, index, className, ...other } = props;
  return (
    <Box
      mt={0}
      as="div"
      role="tabpanel"
      hidden={value !== index}
      id={`scrollable-auto-tabpanel-${index}`}
      aria-labelledby={`scrollable-auto-tab-${index}`}
      {...other}
    >
      {value === index && <Box className={className}>{children}</Box>}
    </Box>
  );
}

export function Tabs({ tabs: tabsProps, className }) {
  const [value, setValue] = useState("");
  const handleChange = (newValue) => {
    setValue(newValue);
  };
  const tabs = useMemo(() => tabsProps.filter(Boolean), [tabsProps]);
  useEffect(() => {
    if (tabs.length > 0 && !value) {
      setValue(tabs[0].id);
    }
  }, [tabs, value]);

  return (
    <Box>
      <NavTabs
        items={tabs}
        onItemClick={(value) => {
          handleChange(value.id);
        }}
        className={styles.toolTabs}
        active={value}
      />
      {tabs.map((tab) => (
        <TabPanel
          value={value}
          index={tab.id}
          key={tab.id}
          style={{ display: "flex", flexDirection: "column", marginTop: 20 }}
          className={tab.className || className}
        >
          {tab.children}
        </TabPanel>
      ))}
    </Box>
  );
}
