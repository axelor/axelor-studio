import React from "react";
import { translate } from "../../../utils";
import { Box, Button } from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";

function ButtonComp({ title, children, Icon, onClick, className, ...rest }) {
  return (
    <Button
      my={2}
      rounded
      d="flex"
      alignItems="center"
      border={Boolean(title || children)}
      borderColor="primary"
      color="primary"
      gap={1}
      flexWrap="wrap"
      justifyContent="center"
      outline={false}
      onClick={onClick}
      {...rest}
    >
      <span>{translate(title)}</span>
      {Icon && <MaterialIcon icon={Icon} color="primary" className="pointer" />}
      {children}
    </Button>
  );
}

export default ButtonComp;
