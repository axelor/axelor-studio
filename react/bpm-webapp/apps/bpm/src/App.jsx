import React, { useEffect, useState } from "react";
import BpmnModelerComponent from "./BPMN/Modeler/BpmnModeler";
import BpmnViewerComponent from "./BPMN/Viewer/BpmnViewer";
import DMNModeler from "./DMN/DMNModeler";
import { useAppTheme } from "./custom-hooks/useAppTheme";
import Loader from "./components/Loader";
import { ThemeProvider } from "@axelor/ui";
import StoreProvider from "./store";

let isInstance = false;

const getParams = () => {
  const params = new URL(document.location).searchParams;
  return {
    isDMN: params.get("type") === "dmn",
    instanceIds: params.get("instanceId"),
    taskIds: params.get("taskIds"),
    id: params.get("id"),
  };
};

const fetchId = () => {
  const { isDMN, instanceIds, taskIds, id } = getParams();
  if (isDMN) {
    return "dmnModeler";
  } else if (instanceIds) {
    isInstance = true;
    return "bpmnViewer";
  } else if (taskIds) {
    return "bpmnViewer";
  } else if (id) {
    return "bpmnModeler";
  }

  return "bpmnModeler";
};

function App() {
  const [type, setType] = useState(null);
  const data = useAppTheme();
  const { theme, options, loading } = data;

  useEffect(() => {
    let type = fetchId() || {};
    setType(type);
  }, []);

  if (loading) {
    return <Loader />;
  }

  return (
    <StoreProvider>
      <ThemeProvider options={options} theme={theme}>
        {(() => {
          switch (type) {
            case "dmnModeler":
              return <DMNModeler />;
            case "bpmnModeler":
              return <BpmnModelerComponent />;
            case "bpmnViewer":
              return <BpmnViewerComponent isInstance={isInstance} />;
            default:
              return <BpmnModelerComponent />;
          }
        })()}
      </ThemeProvider>
    </StoreProvider>
  );
}
export default App;
