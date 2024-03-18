import React from "react";
import { translate } from "../../utils";
import { Box } from "@axelor/ui";

export default function Description({ description, type }) {
  return (
    <Box mt={1} color={type ? "danger" : "body"}>
      {translate(description)}
    </Box>
  );
}
