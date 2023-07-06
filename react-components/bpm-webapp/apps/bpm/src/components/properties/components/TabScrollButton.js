import TabScrollButton from "@material-ui/core/TabScrollButton";
import { withStyles } from "@material-ui/core/styles";

export const TabScrollButtonComponent = withStyles((theme) => ({
  root: {
    width: 20,
    overflow: "hidden",
    transition: "width 0.5s",
    "&.Mui-disabled": {
      width: 0,
    },
  },
}))(TabScrollButton);
