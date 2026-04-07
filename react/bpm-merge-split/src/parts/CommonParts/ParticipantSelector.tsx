import { useRef, useCallback } from "react";
import { Box } from "@axelor/ui";
import type { BpmnElementClickEvent } from "bpmn-js/lib/Modeler";

import { useTab } from "../../hooks/useTabChange";
import { useBpmnViewer } from "../../hooks/useBpmnViewer";
import "../../css/bpmn.css";

interface BpmnModel {
  id?: string | number;
  diagramXml?: string | null;
  name?: string;
  [key: string]: unknown;
}

interface ParticipantElement {
  id: string;
  type: string;
  children?: { id: string }[];
}

interface ParticipantSelectorProps {
  entry?: BpmnModel;
  selectedParticipants?: string[];
  setSelectedParticipants?: React.Dispatch<React.SetStateAction<string[]>>;
  shouldSelectParticipants?: boolean;
  bpmnId?: string;
  showName?: boolean;
}

function ParticipantSelector({
  entry = {},
  selectedParticipants = [],
  setSelectedParticipants,
  shouldSelectParticipants = true,
  bpmnId = "",
  showName = false,
}: ParticipantSelectorProps) {
  if (!bpmnId) {
    throw new Error("bpmnId is required");
  }

  const { tabVisible } = useTab();
  const { id, diagramXml, name } = entry || {};
  // Keep a stable ref for the click handler to access the viewer
  const viewerAccessRef = useRef<unknown>(null);

  const handleParticipantClick = useCallback(
    (event: BpmnElementClickEvent) => {
      const viewer = viewerAccessRef.current as {
        get(name: string): {
          filter(fn: (el: ParticipantElement) => boolean): ParticipantElement[];
        };
      } | null;
      if (!viewer) return;

      const elementRegistry = viewer.get("elementRegistry");
      const participants = elementRegistry.filter(
        (element: ParticipantElement) => element.type === "bpmn:Participant",
      );

      const clickedElementId = event.element.id;
      const clickedParticipant = participants.find((participant: ParticipantElement) => {
        return (
          participant.id === clickedElementId ||
          participant?.children?.find((node) => node.id == clickedElementId)
        );
      });

      if (clickedParticipant && setSelectedParticipants) {
        const elementId = clickedParticipant.id;
        const selected = selectedParticipants?.includes(elementId);
        if (selected) {
          setSelectedParticipants(selectedParticipants?.filter((id) => id !== elementId));
        } else {
          setSelectedParticipants([...selectedParticipants, elementId]);
        }
      }
    },
    [selectedParticipants, setSelectedParticipants],
  );

  const { containerRef, viewerRef } = useBpmnViewer({
    containerId: `#${bpmnId}`,
    diagramXml: diagramXml ?? null,
    readOnly: true,
    enabled: !!tabVisible && !!diagramXml && !!bpmnId,
    selectedParticipants: shouldSelectParticipants ? selectedParticipants : [],
    onElementClick: shouldSelectParticipants ? handleParticipantClick : null,
  });

  // Sync viewerRef into the stable ref for the click handler
  viewerAccessRef.current = viewerRef.current;

  return (
    <Box shadow border rounded key={id} style={{ height: "100%" }} d="flex" flex={1}>
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
        <div data-testid="participant-canvas" id={bpmnId} className="canvas-task"></div>
      </Box>
    </Box>
  );
}

export default ParticipantSelector;
