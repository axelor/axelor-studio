import React, { useEffect, useRef } from "react";
import { NavTabs } from "@axelor/ui";
import { Box } from "@axelor/ui";
import styles from "./Tab.module.css";

const Tab = ({
  onItemClick,
  items = [],
  active,
  isMenuActionDisable = false,
}) => {
  const tabRef = useRef(null);

  useEffect(() => {
    const value = "menu-action-tab";
    const childElement = tabRef.current?.querySelector(
      `div[data-tab-id='${value}']`
    );

    if (childElement) {
      childElement.classList.toggle(styles.navDisable, isMenuActionDisable);
    }
  }, [isMenuActionDisable]);

  return (
    <Box color="body">
      <NavTabs
        onItemClick={onItemClick}
        items={items}
        active={active}
        ref={tabRef}
      />
    </Box>
  );
};

export default Tab;
