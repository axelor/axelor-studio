import React, { useEffect, useRef } from "react";
import { NavTabs } from "@axelor/ui";
import { makeStyles } from "@material-ui/core";
import { Box } from "@axelor/ui";

const useStyles = makeStyles({
  navDisable: {
    cursor: "default",
    pointerEvents: "none",
    opacity: 0.6,
  },
});

const Tab = ({
  onItemClick,
  items = [],
  active,
  isMenuActionDisable = false,
}) => {
  const tabRef = useRef(null);
  const classes = useStyles();

  useEffect(() => {
    const value = "menu-action-tab";
    const childElement = tabRef.current?.querySelector(
      `div[data-tab-id='${value}']`
    );

    if (childElement) {
      childElement.classList.toggle(classes.navDisable, isMenuActionDisable);
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
