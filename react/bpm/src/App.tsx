import React from "react";
import { ThemeProvider } from "@axelor/ui";
import { DialogContextProvider } from "@studio/shared/hooks";

import BpmnModelerComponent from "./BPMN/Modeler/BpmnModeler";
import BpmnViewerComponent from "./BPMN/Viewer/BpmnViewer";
import { useAppTheme } from "./custom-hooks/useAppTheme";
import { Loader } from "@studio/shared/components";
import StoreProvider from "./store";
import DialogBox from "./components/dialog-box/DialogBox";
import Alert from "./components/alert/Alert";
import { AlertProvider } from "./context/alert-context";

/**
 * Derive app mode from URL parameters — pure synchronous computation.
 * Evaluated once at module load (not in a useEffect) to avoid an extra render cycle.
 */
function resolveAppMode(): { type: "bpmnModeler" | "bpmnViewer"; isInstance: boolean } {
  const params = new URL(document.location.href).searchParams;
  if (params.get("instanceId")) return { type: "bpmnViewer", isInstance: true };
  if (params.get("taskIds")) return { type: "bpmnViewer", isInstance: false };
  return { type: "bpmnModeler", isInstance: false };
}

const APP_MODE = resolveAppMode();

function App() {
  const { theme, options, loading } = useAppTheme();

  if (loading) {
    return <Loader />;
  }

  return (
    <StoreProvider>
      <ThemeProvider options={options} theme={theme}>
        <DialogContextProvider>
          <AlertProvider>
            <>
              {APP_MODE.type === "bpmnViewer" ? (
                <BpmnViewerComponent isInstance={APP_MODE.isInstance} />
              ) : (
                <BpmnModelerComponent />
              )}
              <DialogBox />
              <Alert />
            </>
          </AlertProvider>
        </DialogContextProvider>
      </ThemeProvider>
    </StoreProvider>
  );
}
export default App;
