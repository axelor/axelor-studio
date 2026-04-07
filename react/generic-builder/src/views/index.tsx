/**
 * ExpressionBuilder entry point.
 */
import React from "react";
import { ThemeProvider } from "@axelor/ui";
import { useAppTheme } from "@studio/shared/theme";

import { GenericDialogBox } from "../components";

import { DialogContext, useDialog } from "./dialog-context";
import ExpressionBuilder from "./expression-builder/ExpressionBuilder";

export { useDialog };

interface ExpressionBuilderAppProps {
  DialogBox?: React.ComponentType<Record<string, unknown>>;
  [key: string]: unknown;
}

export default function ExpressionBuilderApp(props: ExpressionBuilderAppProps) {
  const { theme, options } = useAppTheme();

  const DialogBox = (props?.DialogBox || GenericDialogBox) as React.ComponentType<
    Record<string, unknown> & { open: boolean }
  >;

  return (
    <ThemeProvider theme={theme} options={options}>
      <DialogContext.Provider value={{ DialogBox }}>
        <ExpressionBuilder {...props} />
      </DialogContext.Provider>
    </ThemeProvider>
  );
}
