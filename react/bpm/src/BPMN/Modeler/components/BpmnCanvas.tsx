import React, { useCallback } from "react";
import type { TypedBpmnModeler } from "@studio/shared/types";

import XmlEditor from "../XmlEditor";

interface BpmnCanvasProps {
  modeler: TypedBpmnModeler | null;
  isXmlEditorOpen: boolean;
  onCloseXmlEditor: () => void;
}

function BpmnCanvas({ modeler, isXmlEditorOpen, onCloseXmlEditor }: BpmnCanvasProps) {
  const canvasRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!modeler) return;
      if (node) {
        modeler.attachTo(node);
      } else {
        modeler.detach();
      }
    },
    [modeler],
  );

  return (
    <>
      <div
        style={{
          height: "100%",
          display: isXmlEditorOpen ? "none" : "block",
        }}
      >
        <div id="bpmnview" ref={canvasRef}></div>
      </div>
      {isXmlEditorOpen && <XmlEditor onClose={onCloseXmlEditor} />}
    </>
  );
}

export default BpmnCanvas;
