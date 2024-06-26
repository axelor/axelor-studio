import { cloneElement } from "react";
import { Box, ClickAwayListener, Popper, usePopperTrigger } from "@axelor/ui";
import styles from "./tooltip.module.css";
import { translate } from "../..//utils";

export default function Tooltip({ title, children }) {
  const { open, targetEl, setTargetEl, setContentEl, onClickAway } =
    usePopperTrigger({
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
      })}
      <Popper
        id="simple-popover"
        className={styles.tooltip}
        open={open}
        target={targetEl}
        offset={[0, 4]}
        placement="bottom"
        arrow
        shadow
        rounded
      >
        <ClickAwayListener onClickAway={onClickAway}>
          <Box ref={setContentEl} className={styles.container}>
            {title && <Box className={styles.title}>{translate(title)}</Box>}
          </Box>
        </ClickAwayListener>
      </Popper>
    </>
  );
}
