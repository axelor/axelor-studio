import React from "react";
import { useAppTheme } from "@studio/shared/theme";
import { ThemeProvider } from "@axelor/ui";
import { DialogContextProvider } from "@studio/shared/hooks";

import DMNModeler from "./DMNModeler";

function App() {
  const { theme, options, loading } = useAppTheme();
  if (loading) return null;
  return (
    <ThemeProvider options={options} theme={theme}>
      <DialogContextProvider>
        <DMNModeler />
      </DialogContextProvider>
    </ThemeProvider>
  );
}

export default App;
