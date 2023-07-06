import React, { useEffect, useState } from "react";
import { ColorPicker } from "material-ui-color";
import { makeStyles } from "@material-ui/styles";
import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import { translate } from "../../../utils";

import "../css/colorpicker.css";

const useStyles = makeStyles({
  root: {
    marginTop: 8,
  },
  label: {
    fontWeight: "bolder",
    display: "inline-block",
    verticalAlign: "middle",
    color: "#666",
    marginBottom: 3,
  },
});

const palette = {
  "5eaeda": "#5eaeda",
  "3fbdd6": "#3fbdd6",
  f79000: "#f79000",
  f8b200: "#f8b200",
  "3f97f6": "#3f97f6",
  e76092: "#e76092",
  "3ebfa5": "#3ebfa5",
  ff9e0f: "#ff9e0f",
  fba729: "#fba729",
  "6097fc": "#6097fc",
  "55c041": "#55c041",
  ff7043: "#ff7043",
  f9c000: "#f9c000",
  ff9800: "#ff9800",
  a80ca8: "#a80ca8",
  e53935: "#e53935",
  "000000": "#000000",
};

export default function ColorPickerComponent({ changeColor, entry, element }) {
  const [color, setColor] = useState("#fff");
  const { label = "" } = entry || {};
  const classes = useStyles();

  const handleChange = (newValue) => {
    setColor(newValue);
    if (newValue && newValue.css && newValue.css.backgroundColor) {
      changeColor(newValue.css.backgroundColor);
    }
  };

  useEffect(() => {
    const bo = getBusinessObject(element);
    const color = bo && bo.di && bo.di.stroke;
    if (!color) return;
    setColor(color);
  }, [element]);

  return (
    <div className={classes.root}>
      <label className={classes.label}>{translate(label)}</label>
      <ColorPicker
        value={color}
        deferred
        hideTextfield
        palette={palette}
        onChange={handleChange}
      />
    </div>
  );
}
