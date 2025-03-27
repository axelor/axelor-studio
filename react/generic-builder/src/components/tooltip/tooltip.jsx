import React, { cloneElement } from 'react';
import {
  Box,
  ClickAwayListener,
  clsx,
  Popper,
  usePopperTrigger,
} from '@axelor/ui';
import styles from './tooltip.module.css';

export default function Tooltip({ title, children, className }) {
  const {
    open,
    targetEl,
    setTargetEl,
    setContentEl,
    onClickAway,
  } = usePopperTrigger({
      trigger: 'hover',
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
        className={clsx(className, styles.tooltip)}
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
            {title && <Box className={styles.title}>{title}</Box>}
          </Box>
        </ClickAwayListener>
      </Popper>
    </>
  );
}
