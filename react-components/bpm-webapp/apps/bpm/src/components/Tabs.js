import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { Tab as MaterialTab, Tabs as MaterialTabs } from "@material-ui/core";

export const Tabs = withStyles({
  root: {
    borderBottom: "1px solid #e8e8e8",
    minHeight: 24,
    marginTop: 10,
  },
  indicator: {
    backgroundColor: "#52B415",
    top: 0,
  },
  flexContainer: {
    height: "100%",
  },
})(MaterialTabs);

export const Tab = withStyles((theme) => ({
  root: {
    textTransform: "none",
    minWidth: 72,
    fontWeight: theme.typography.fontWeightRegular,
    marginRight: theme.spacing(1),
    padding: "0px 10px",
    minHeight: 24,
    borderLeft: "1px solid #ccc",
    borderRight: "1px solid #ccc",
    borderTop: "1px solid #ccc",
    fontSize: 12,
    "&:hover": {
      opacity: 1,
    },
    "&$selected": {
      fontWeight: theme.typography.fontWeightMedium,
    },
  },
  selected: {},
}))((props) => <MaterialTab disableRipple {...props} />);
