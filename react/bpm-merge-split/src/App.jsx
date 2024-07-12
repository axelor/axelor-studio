import React from "react";
import { Box, ThemeProvider } from "@axelor/ui";
import { useAppTheme } from "./Theme/hooks/useAopTheme";
import { getParams } from "./utils";
import { AlertProvider } from "./context/AlertContext";
import { ConfirmationDialogProvider } from "./context/ConfirmationContext";
import { TabProvider } from "./context/TabChangeContext";
import Split from "./parts/Split";
import Merge from "./parts/Merge";
import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css";
import "./App.css";


const App = () => {
  const { theme = "light", options = {} } = useAppTheme();
  const { isSplit } = getParams();

  return (
    <Box id="app">
      <TabProvider>
        <ThemeProvider theme={theme} options={options}>
          <ConfirmationDialogProvider>
            <AlertProvider>{isSplit ? <Split /> : <Merge />}</AlertProvider>
          </ConfirmationDialogProvider>
        </ThemeProvider>
      </TabProvider>
    </Box>
  );
};

export default App;
