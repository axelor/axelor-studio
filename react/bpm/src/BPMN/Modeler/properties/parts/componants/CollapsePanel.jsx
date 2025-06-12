import { Badge, Box, Collapse } from "@axelor/ui";
import React, { useState } from "react";
import Title from "../../../Title";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";

const CollapsePanel = ({
  open,
  label,
  children,
  badgeCount = 0,
  badgeIcon,
  hideBadgeOnOpen = false,
}) => {
  const [isOpen, setOpen] = useState(open);

  const toggleOpen = () => {
    setOpen((prevOpen) => !prevOpen);
  };
  if (!label || !label.length) {
    return children;
  }

  const showBadge = () => {
    if (hideBadgeOnOpen && isOpen) {
      return false;
    }
    return !!(badgeIcon || badgeCount);
  }
  return (
    <div>
      <Box
        d="flex"
        alignItems="center"
        px={1}
        bg="body-secondary"
        borderTop
        borderLeft
        borderRight
        roundedTop="sm"
        roundedBottom={isOpen ? "none" : "sm"}
        justifyContent="space-between"
        onClick={toggleOpen}
        style={{ cursor: "pointer" }}
      >
        <Title label={label} />
        <Box d="flex" alignItems="center" justifyContent="space-between">
          {!!showBadge() && <Badge
            variant="secondary"
            onClick={toggleOpen}
            style={{ cursor: "pointer" }}
          >
            <Box d="flex" alignItems="center" justifyContent="space-between">
              {badgeIcon && <MaterialIcon icon={badgeIcon} />}
              {badgeCount > 0 && <span>{badgeCount}</span>}
            </Box>
          </Badge>}
          <MaterialIcon
            color="body"
            icon={isOpen ? "keyboard_arrow_up" : "keyboard_arrow_right"}
          />
        </Box>
      </Box>
      <Collapse in={isOpen} unmountOnExit mountOnEnter={true}>
        <Box p={1} rounded="sm" bg="body-tertiary" borderBottom>
          {children}
        </Box>
      </Collapse>
    </div>
  );
};

export default CollapsePanel;