import React, { useEffect, useState } from "react";
import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import { translate } from "../../../utils";
import { Box, Input, InputLabel } from "@axelor/ui";

import "../css/colorpicker.css";
import styles from "./colorpicker.module.css";

export default function ColorPickerComponent({
  changeColor,
  entry,
  element,
  setDummyProperty = () => {},
}) {
  const [color, setColor] = useState("#fff");
  const { label = "" } = entry || {};
  const handleChange = (e) => {
    const newValue = e.target.value;
    setDummyProperty();
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
      <Input
        type="color"
        value={color}
        onChange={handleChange}
        className={styles.colorPicker}
      />
    </Box>
  );
}
