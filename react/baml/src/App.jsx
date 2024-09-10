import React from "react";
import { ThemeProvider } from "@axelor/ui";
import BAML from "./BAML";
import { useAppTheme } from "./Theme/hooks/useAopTheme";

function App() {
  const { theme, options } = useAppTheme();
  return (
    <div className="App">
      <ThemeProvider theme={theme} options={options}>
        <BAML />
      </ThemeProvider>
    </div>
  );
}

export default App;