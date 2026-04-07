import React, { cloneElement } from "react";
import { Box, ClickAwayListener, clsx, Popper, usePopperTrigger } from "@axelor/ui";

import styles from "./tooltip.module.css";

interface TooltipProps {
  title: React.ReactNode;
  children: React.ReactElement;
  className?: string;
  placement?:
    | "top"
    | "top-start"
    | "top-end"
    | "bottom"
    | "bottom-start"
    | "bottom-end"
    | "start"
    | "start-top"
    | "start-bottom"
    | "end"
    | "end-top"
    | "end-bottom";
}

export function Tooltip({ title, children, className, placement = "bottom" }: TooltipProps) {
  const { open, targetEl, setTargetEl, setContentEl, onClickAway } = usePopperTrigger({
    trigger: "hover",
    interactive: true,
    delay: {
      open: 10,
      close: 100,
    },
  });

  return (
    <>
      {cloneElement(children, {
        ref: setTargetEl,
      } as Record<string, unknown>)}
      <Popper
        className={clsx(className, styles.tooltip)}
        open={open}
        target={targetEl}
        offset={[0, 4]}
        placement={placement}
        arrow
        shadow
        rounded
      >
        <ClickAwayListener onClickAway={onClickAway}>
          <Box ref={setContentEl} className={styles.container}>
            {title && <Box className={styles.title}>{title as React.ReactNode}</Box>}
          </Box>
        </ClickAwayListener>
      </Popper>
    </>
  );
}
