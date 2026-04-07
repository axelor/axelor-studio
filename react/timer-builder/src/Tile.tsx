import React, { useState } from "react";
import { Box, Input, InputLabel } from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";

import { IconButton } from "@studio/shared/components";
import styles from "./Tile.module.css";
import type { DurationValue } from "./utils";

interface TileProps {
  label: string;
  onChange: (value: DurationValue | ((prev: DurationValue) => DurationValue)) => void;
  value: DurationValue;
  name: string;
  integer?: boolean;
  allowNegetiveOne?: boolean;
}

const roundToTwoDecimalPlace = (value: number): number => {
  const n = 2;
  return Math.round(value * 10 ** n) / 10 ** n;
};

const restrictToTwoDecimalPlace = (value: number): number => {
  const n = 2;
  return Math.trunc(value * 10 ** n) / 10 ** n;
};

function isLeftClick(event: React.MouseEvent): boolean {
  if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) {
    return false;
  }
  return event.buttons === 1 || event.type === "click";
}

function Tile({ label, onChange, value, name, integer, allowNegetiveOne }: TileProps) {
  const [timerId, setTimerId] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const increment = () => {
    onChange((prev: DurationValue) => ({ ...prev, [name]: ((prev[name] as number) || 0) + 1 }));
  };

  const decrement = () => {
    onChange((prev: DurationValue) => {
      const current = (prev[name] as number) || 0;
      return current > 0
        ? current > 1
          ? {
              ...prev,
              [name]: roundToTwoDecimalPlace(current - 1),
            }
          : {
              ...prev,
              [name]: 0,
            }
        : allowNegetiveOne
          ? {
              ...prev,
              [name]: -1,
            }
          : prev;
    });
  };

  const handleMouseDown = (event: React.MouseEvent) => {
    event.preventDefault(); // To prevent input from losing focus
  };

  const startTimer = (delay: number, interval: number, fn: () => void) => {
    setTimerId(
      setTimeout(() => {
        setTimerId(
          setInterval(() => {
            fn();
          }, interval),
        );
        fn();
      }, delay),
    );
  };

  const clearTimer = () => {
    if (timerId != null) {
      clearInterval(timerId); //clearInterval/clearTimeout can be used interchangeably
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...value,
      [name]:
        Number(e.target.value) >= 0
          ? integer
            ? parseInt(e.target.value || "0")
            : restrictToTwoDecimalPlace(parseFloat(e.target.value))
          : allowNegetiveOne
            ? -1
            : 0,
    });
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.deltaY > 0) { decrement(); } else { increment(); }
  };

  return (
    <Box d="flex" flexDirection="column" alignItems="center" gap="0.5rem">
      {/* <OutlinedInput
        className={classes.root}
        type="number"
        id={label}
        value={isFocused ? value[name] || "" : value[name] || 0}
        onChange={handleChange}
        onWheel={handleWheel}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        endAdornment={
          <InputAdornment position="end">
            <Box d="flex" flexDirection="column" onMouseDown={handleMouseDown}>
              <IconButton
                tabIndex={-1}
                onClick={increment}
                onMouseDown={e =>
                  isLeftClick(e) && startTimer(500, 75, increment)
                }
                onMouseUp={clearTimer}
                size="small"
              >
                <MaterialIcon
                  icon="keyboard_arrow_up"
                  fontSize="small"
                  color="body"
                />
              </IconButton>
              <IconButton
                tabIndex={-1}
                onClick={decrement}
                size="small"
                onMouseDown={e =>
                  isLeftClick(e) && startTimer(500, 75, decrement)
                }
                onMouseUp={clearTimer}
              >
                <MaterialIcon
                  icon="keyboard_arrow_down"
                  fontSize="small"
                  color="body"
                />
              </IconButton>
            </Box>
          </InputAdornment>
        }
      /> */}
      <Box className={styles.root}>
        <Input
          className={styles.inputContainer}
          type="number"
          id={label}
          value={isFocused ? (value[name] as number) || "" : (value[name] as number) || 0}
          onChange={handleChange}
          onWheel={handleWheel}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        <Box className={styles.buttonContainer} onMouseDown={handleMouseDown}>
          <IconButton
            style={{ padding: 0 }}
            tabIndex={-1}
            onClick={increment}
            onMouseDown={
              (e: React.MouseEvent<HTMLButtonElement>) =>
                isLeftClick(e) && startTimer(500, 75, increment) /*
                    start timer only on left mousedown,
                    on rightClick, mousedown event fires but not mouseup
                     */
            }
            onMouseUp={clearTimer}
          >
            <MaterialIcon icon="keyboard_arrow_up" fontSize="1rem" color="body" />
          </IconButton>
          <IconButton
            style={{ padding: 0 }}
            tabIndex={-1}
            onClick={decrement}
            onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) =>
              isLeftClick(e) && startTimer(500, 75, decrement)
            } /*
                    start timer only on left mousedown,
                    on rightClick, mousedown event fires but not mouseup
                     */
            onMouseUp={clearTimer}
          >
            <MaterialIcon icon="keyboard_arrow_down" fontSize="1rem" color="body" />
          </IconButton>
        </Box>
      </Box>
      <InputLabel htmlFor={label}>{label}</InputLabel>
    </Box>
  );
}

export default Tile;
