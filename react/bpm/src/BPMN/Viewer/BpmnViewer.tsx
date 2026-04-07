import React, { useRef, useEffect, useState } from "react";
import BpmnModeler from "bpmn-js/lib/Modeler";

import readOnlyModule from "./custom/readonly";
import BpmnViewerInner from "./BpmnViewerInner";

import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css";
import "../css/bpmn.css";

interface BpmnViewerProps {
  isInstance: boolean;
}

/**
 * BpmnViewer wrapper -- creates and destroys the bpmn-js viewer instance.
 */
function BpmnViewerComponent({ isInstance }: BpmnViewerProps) {
  const viewerRef = useRef<InstanceType<typeof BpmnModeler> | null>(null);
  const [viewer, setViewer] = useState<InstanceType<typeof BpmnModeler> | null>(null);

  useEffect(() => {
    const instance = new BpmnModeler({
      container: "#canvas-task",
      additionalModules: [readOnlyModule],
    });
    viewerRef.current = instance;
    setViewer(instance);

    return () => {
      instance.destroy();
      viewerRef.current = null;
    };
  }, []);

  return <BpmnViewerInner isInstance={isInstance} viewerRef={viewerRef} viewer={viewer} />;
}

export default BpmnViewerComponent;
