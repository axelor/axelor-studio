import React from "react";
import { InputFeedback } from "@axelor/ui";
import { translate } from "../../../utils";

export default function Description({ desciption, type }) {
  return (
    <InputFeedback
      style={{ marginTop: 5 }}
      fontSize={6}
      invalid={type === "error"}
    >
      {translate(desciption)}
    </InputFeedback>
  );
}
