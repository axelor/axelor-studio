import { Badge, Box, Collapse } from "@axelor/ui";
import React, { useState } from "react";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";

import { Title } from "@studio/shared/components";

const FlexBox: any = Box;

const CollapsePanel = ({
  open,
  label,
  children,
  badgeCount = 0,
  badgeIcon,
  hideBadgeOnOpen = false,
}: Record<string, any>) => {
  const [isOpen, setOpen] = useState(open);

  const toggleOpen = () => {
    setOpen((prevOpen: any) => !prevOpen);
  };
  if (!label || !label.length) {
    return children;
  }

  const showBadge = () => {
    if (hideBadgeOnOpen && isOpen) {
      return false;
    }
    return !!(badgeIcon || badgeCount);
  };
  return (
    <div>
      <FlexBox
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
        <FlexBox d="flex" alignItems="center" justifyContent="space-between">
          {!!showBadge() && (
            <Badge variant="secondary" onClick={toggleOpen} style={{ cursor: "pointer" }}>
              <FlexBox d="flex" alignItems="center" justifyContent="space-between">
                {badgeIcon && <MaterialIcon icon={badgeIcon} />}
                {badgeCount > 0 && <span>{badgeCount}</span>}
              </FlexBox>
            </Badge>
          )}
          <MaterialIcon color="body" icon={isOpen ? "keyboard_arrow_up" : "keyboard_arrow_right"} />
        </FlexBox>
      </FlexBox>
      <Collapse in={isOpen} unmountOnExit mountOnEnter={true}>
        <FlexBox p={1} rounded="sm" bg="body-tertiary" borderBottom>
          {children}
        </FlexBox>
      </Collapse>
    </div>
  );
};

export default CollapsePanel;
