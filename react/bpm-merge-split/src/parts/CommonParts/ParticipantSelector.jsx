import BpmnModeler from "bpmn-js/lib/Modeler";
import readOnlyModule from "../../custom/readonly";
import { useRef, useEffect, useCallback } from "react";
import { Box } from "@axelor/ui";
import "../../css/bpmn.css";
import { useTab } from "../../context/TabChangeContext";
import { updateTranslations } from "../../utils";

const openDiagramImage = async (
  diagramXml,
  bpmnViewer,
  selectedParticipants,
  shouldSelectParticipants
) => {
  if (!diagramXml) return;

  try {
    const result = await bpmnViewer.importXML(diagramXml);
    const canvas = bpmnViewer.get("canvas");
    canvas.zoom("fit-viewport", "auto");
    bpmnViewer.get("readOnly").readOnly(true);
    const elementRegistry = bpmnViewer?.get("elementRegistry");
    let nodes = elementRegistry && elementRegistry._elements;
    if (!nodes) return;
    Object.entries(nodes).forEach(([key, value]) => {
      if (!value) return;
      const { element } = value;
      if (!element) return;
      updateTranslations(element, bpmnViewer);
    });
    if (shouldSelectParticipants) {
      const participants = elementRegistry.filter(
        (element) => element.type === "bpmn:Participant"
      );
      participants.forEach((element) => {
        const selected = selectedParticipants.includes(element.id);
        const outgoingGfx = elementRegistry.getGraphics(element.id);
        const visual = outgoingGfx && outgoingGfx.querySelector(".djs-visual");
        const rec = visual && visual.childNodes && visual.childNodes[0];
        if (rec && rec.style) {
          if (selected) {
            rec.style.strokeWidth = "5px";
            rec.style.stroke = "#006400";
          } else {
            rec.style.strokeWidth = "2px";
            rec.style.stroke = "rgb(200, 200, 200)";
          }
        }
      });
    }
  } catch (e) {
    return;
  }
};

function ParticipantSelector({
  entry = {},
  selectedParticipants = [],
  setSelectedParticipants,
  shouldSelectParticipants = true,
  bpmnId = "",
  showName = false,
}) {
  if (!bpmnId) {
    throw new Error("bpmnId is required");
  }

  const bpmnViewerRef = useRef(null);
  const containerRef = useRef(null);
  const { tabVisible } = useTab();
  const { id, diagramXml, name } = entry || {};

  const handleParticipantClick = useCallback(
    (event) => {
      const { element } = event || {};
      const elementRegistry = bpmnViewerRef?.current?.get("elementRegistry");
      const participants = elementRegistry.filter(
        (element) => element.type === "bpmn:Participant"
      );

      const clickedElementId = event.element.id;
      const clickedParticipant = participants.find((participant) => {
        return (
          participant.id === clickedElementId ||
          participant?.children.find((node) => node.id == clickedElementId)
        );
      });

      if (clickedParticipant) {
        const elementId = clickedParticipant.id || element.id;
        const selected = selectedParticipants?.includes(elementId);
        if (selected) {
          setSelectedParticipants(
            selectedParticipants?.filter((id) => id !== elementId)
          );
        } else {
          setSelectedParticipants([...selectedParticipants, elementId]);
        }
      }
    },
    [selectedParticipants, setSelectedParticipants]
  );

  useEffect(() => {
    if (!diagramXml || !bpmnId || !tabVisible) return;
    const cardResizeObserver = new ResizeObserver((entries) => {
      for (let _entry of entries) {
        const canvas = bpmnViewerRef?.current?.get("canvas");
        canvas?.zoom("fit-viewport", "auto");
      }
    });

    if (!bpmnViewerRef.current) {
      bpmnViewerRef.current = new BpmnModeler({
        container: `#${bpmnId}`,
        additionalModules: [readOnlyModule],
      });

      openDiagramImage(
        diagramXml,
        bpmnViewerRef.current,
        selectedParticipants,
        shouldSelectParticipants
      );
      if (shouldSelectParticipants) {
        bpmnViewerRef?.current?.on("element.click", handleParticipantClick);
      }
      cardResizeObserver.observe(containerRef.current);
    }

    return () => {
      if (bpmnViewerRef.current) {
        cardResizeObserver.disconnect();
        bpmnViewerRef.current.off("element.click", handleParticipantClick);
        bpmnViewerRef.current.destroy();
        bpmnViewerRef.current = null;
      }
    };
  }, [
    bpmnId,
    diagramXml,
    handleParticipantClick,
    selectedParticipants,
    shouldSelectParticipants,
    tabVisible,
  ]);

  return (
    <Box
      shadow
      border
      rounded
      key={id}
      style={{ height: "100%" }}
      d="flex"
      flex={1}
    >
      <Box
        d="flex"
        pos="relative"
        flexDirection="column"
        ref={containerRef}
        style={{ right: 0, left: 0, height: "100%", width: "100%" }}
      >
        {name && showName && (
          <Box
            color="body"
            p={1}
            d="flex"
            justifyContent="space-between"
            style={{
              fontSize: "12px",
            }}
            bg="body-tertiary"
            borderBottom
            mb={2}
            px={2}
            alignItems="center"
          >
            <Box color="body">{name}</Box>
          </Box>
        )}
        <div id={bpmnId} className="canvas-task"></div>
      </Box>
    </Box>
  );
}

export default ParticipantSelector;
