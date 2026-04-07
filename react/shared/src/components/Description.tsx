import React from "react";
import { InputFeedback } from "@axelor/ui";

import { translate } from "../i18n/index";

interface DescriptionProps {
  desciption: string;
  type?: string;
}

export function Description({ desciption, type }: DescriptionProps) {
  return (
    <InputFeedback style={{ marginTop: 5 }} fontSize={6} invalid={type === "error"}>
      {translate(desciption)}
    </InputFeedback>
  );
}
