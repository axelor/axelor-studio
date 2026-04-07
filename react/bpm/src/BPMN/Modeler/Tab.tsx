import React, { useEffect, useRef } from "react";
import { NavTabs, Box  } from "@axelor/ui";

import styles from "./tab.module.css";

interface TabProps {
  onItemClick: (item: { id: string } | null) => void;
  items?: unknown[];
  active?: string;
  isMenuActionDisable?: boolean;
}

const Tab = ({ onItemClick, items = [], active, isMenuActionDisable = false }: TabProps) => {
  const tabRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const value = "menu-action-tab";
    const childElement = tabRef.current?.querySelector(`div[data-tab-id='${value}']`);
    if (childElement) {
      childElement.classList.toggle(styles.navDisable, isMenuActionDisable);
    }
  }, [isMenuActionDisable]);

  return (
    <Box color="body">
      <NavTabs
        onItemClick={onItemClick}
        items={items as Parameters<typeof NavTabs>[0]["items"]}
        active={active}
        ref={tabRef}
      />
    </Box>
  );
};

export default Tab;
