import React, { useState, useEffect, useMemo } from "react";
import { Box, NavTabs } from "@axelor/ui";

import styles from "./tabs.module.css";

interface TabItem {
  id: string | number;
  title: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
  [key: string]: unknown;
}

interface TabPanelProps {
  children?: React.ReactNode;
  value: string;
  index: string;
  className?: string;
  [key: string]: unknown;
}

function TabPanel({ children, value, index, className, ...other }: TabPanelProps) {
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

interface TabsProps {
  tabs: (TabItem | null | undefined | false)[];
  className?: string;
}

export function Tabs({ tabs: tabsProps, className }: TabsProps) {
  const [value, setValue] = useState("");
  const handleChange = (newValue: string) => {
    setValue(newValue);
  };
  const tabs = useMemo(() => tabsProps.filter((t): t is TabItem => Boolean(t)), [tabsProps]);
  useEffect(() => {
    if (tabs.length > 0 && !value) {
      setValue(String(tabs[0].id));
    }
  }, [tabs, value]);

  const navItems = useMemo(
    () => tabs.map((t) => ({ ...t, id: String(t.id) })),
    [tabs],
  );

  return (
    <Box>
      <NavTabs
        items={navItems}
        onItemClick={(item) => {
          handleChange(item.id);
        }}
        className={styles.toolTabs}
        active={value}
      />
      {tabs.map((tab) => (
        <TabPanel
          value={value}
          index={String(tab.id)}
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
