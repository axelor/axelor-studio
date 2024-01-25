import React, { useEffect, useState } from "react";
import { makeStyles } from "@material-ui/styles";
import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import { translate } from "../../../utils";
import { Box, Input, InputLabel } from "@axelor/ui";

import "../css/colorpicker.css";

const useStyles = makeStyles({
  root: {
    marginTop: 8,
  },
  label: {
    display: "flex",
    marginBottom: 3,
    color: "rgba(var(--bs-body-color-rgb),.65) !important",
    fontSize: "var(----ax-theme-panel-header-font-size, 1rem)",
  },
  colorPicker: {
    width: 25,
  },
});

export default function ColorPickerComponent({ changeColor, entry, element }) {
  const [color, setColor] = useState("#fff");
  const { label = "" } = entry || {};
  const classes = useStyles();

  const handleChange = (e) => {
    const newValue = e.target.value;
    setColor(newValue);
    if (newValue) {
      changeColor(newValue);
    }
  };

  useEffect(() => {
    const bo = getBusinessObject(element);
    const color = bo?.di?.stroke;
    if (!color) return;
    setColor(color);
  }, [element]);

  return (
    <Box color="body" className={classes.root}>
      <InputLabel className={classes.label}>{translate(label)}</InputLabel>
      <Input
        type="color"
        value={color}
        onChange={handleChange}
        className={classes.colorPicker}
      />
    </Box>
  );
}
