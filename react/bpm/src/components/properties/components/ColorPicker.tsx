import React, { useEffect, useState } from "react";
import { translate } from "@studio/shared/i18n";
import { Box, Input, InputLabel } from "@axelor/ui";

import "../css/colorpicker.css";
import styles from "./colorpicker.module.css";

interface ColorPickerEntry {
  label?: string;
}

interface ColorPickerElement {
  di?: { stroke?: string };
  [key: string]: unknown;
}

interface ColorPickerProps {
  changeColor: (color: string) => void;
  entry: ColorPickerEntry;
  element: ColorPickerElement;
}

export default function ColorPickerComponent({ changeColor, entry, element }: ColorPickerProps) {
  const [color, setColor] = useState("#fff");
  const { label = "" } = entry || {};
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setColor(newValue);
    if (newValue) {
      changeColor(newValue);
    }
  };

  useEffect(() => {
    const color = element?.di?.stroke;
    if (!color) return;
    setColor(color);
  }, [element]);

  return (
    <Box color="body" className={styles.root}>
      <InputLabel className={styles.label}>{translate(label)}</InputLabel>
      <Input type="color" value={color} onChange={handleChange} className={styles.colorPicker} />
    </Box>
  );
}
