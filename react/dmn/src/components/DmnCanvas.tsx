import React, { useCallback } from "react";

import { useDmnModeler } from "../context/DmnModelerContext";

/**
 * Canvas container with deferred attach pattern.
 * Uses callback ref to attach dmn-js modeler to the DOM node.
 * display:none toggle for visibility (not conditional rendering)
 * to preserve DOM and avoid detach/reattach.
 */
function DmnCanvas() {
  const dmnModeler = useDmnModeler();

  // Callback ref: fires when div mounts/unmounts
  // deps: [dmnModeler] -- modeler changes once (null -> instance)
  const canvasRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (dmnModeler && node) {
        dmnModeler.attachTo(node);
      }
    },
    [dmnModeler],
  );

  return (
    <>
      {/* Canvas container -- deferred attach via callback ref */}
      <div ref={canvasRef} style={{ width: "100%", height: "100%" }} />
      {/* Hidden properties panel div -- DMN properties panel is hidden
          (custom React panels are used instead). Lowest-risk approach. */}
      <div id="properties" style={{ display: "none" }}></div>
    </>
  );
}

export default DmnCanvas;
