import BpmnModeler from "bpmn-js/lib/Modeler";
import readOnlyModule from "../../custom/readonly";
import { useRef, useEffect, useState } from "react";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";
import {
  Box,
  Button,
  Collapse,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@axelor/ui";
import ParticipantSelector from "./ParticipantSelector";
import { translate, updateTranslations } from "../../utils";
import ConfigurationBox from "./ConfigurationBox";
import Tooltip from "../../components/Tooltip/Tooltip";
import { useTab } from "../../context/TabChangeContext";
import "../../css/bpmn.css";

const openDiagramImage = async (
  diagramXml,
  bpmnViewer,
  selectedParticipants = {}
) => {
  if (!diagramXml) return;
  try {
    const result = await bpmnViewer.importXML(diagramXml);
    const canvas = bpmnViewer.get("canvas");
    canvas?.zoom("fit-viewport", "auto");
    bpmnViewer?.get("readOnly")?.readOnly(true);

    const elementRegistry = bpmnViewer?.get("elementRegistry");
    let nodes = elementRegistry && elementRegistry._elements;
    if (!nodes) return;
    Object.entries(nodes).forEach(([key, value]) => {
      if (!value) return;
      const { element } = value;
      if (!element) return;
      updateTranslations(element, bpmnViewer);
    });

    const participants = elementRegistry.filter(
      (element) => element.type === "bpmn:Participant"
    );
    participants.forEach((element) => {
      const selected = selectedParticipants.find((p) => p === element.id);
      const outgoingGfx = elementRegistry.getGraphics(element.id);
      const visual = outgoingGfx && outgoingGfx.querySelector(".djs-visual");
      const rec = visual && visual.childNodes && visual.childNodes[0];
      if (rec && rec.style) {
        if (selected) {
          rec.style.strokeWidth = "5px";
          rec.style.stroke = "#006400";
        }
      }
    });
  } catch (e) {
    return;
  }
};

function BpmnPreviews({
  entry = {},
  update = () => {},
  selectedParticipants,
  setSelectedParticipants,
  handleDeleteModel = () => {},
  showSelectionCount = false,
  allowSelection = false,
  showConfiguration = false,
  hideToolbar = false,
  drawerOpen = false,
  openInDialog = true,
  horizontalDrawer = false,
}) {
  const { id, diagramXml, name, code } = entry;
  const bpmnViewerRef = useRef(null);
  const [participant, setParticipant] = useState([]);
  const [selectionDialogOpen, setSelectionDialogOpen] = useState(false);
  const [openConfig, setOpenConfig] = useState(false);
  const canvasTaskRef = useRef(null);
  const { tabVisible } = useTab();

  const onSave = () => {
    if (allowSelection) {
      if (participant.length > 0) {
        setSelectedParticipants((items) => ({
          ...items,
          [id]: [...participant],
        }));
      } else {
        setSelectedParticipants((items) => {
          const updatedItems = { ...items };
          delete updatedItems[id];
          return updatedItems;
        });
      }
    }
    setSelectionDialogOpen(false);
  };

  const handleClose = () => {
    setSelectionDialogOpen(false);
    allowSelection && setParticipant([...(selectedParticipants[id] || [])]);
  };

  useEffect(() => {
    if (!diagramXml || !tabVisible) return;

    if (!bpmnViewerRef?.current) {
      bpmnViewerRef.current = new BpmnModeler({
        container: `#canvas-task-${id}`,
        additionalModules: [
          readOnlyModule,
          { moveCanvas: ["value", ""], zoomScroll: ["value", ""] },
        ],
      });
      openDiagramImage(diagramXml, bpmnViewerRef.current, participant);
    }

    return () => {
      if (bpmnViewerRef.current) {
        bpmnViewerRef.current.destroy();
        bpmnViewerRef.current = null;
      }
    };
  }, [diagramXml, id, participant, selectedParticipants, tabVisible]);

  useEffect(() => {
    const updateParticipantStyles = () => {
      const bpmnViewer = bpmnViewerRef.current;
      if (!bpmnViewer) return;

      const elementRegistry = bpmnViewer.get("elementRegistry");
      const allParticipants = elementRegistry.filter(
        (element) => element.type === "bpmn:Participant"
      );

      allParticipants.forEach((p) => {
        const isSelected = participant?.some((id) => id === p.id);
        const outgoingGfx = elementRegistry.getGraphics(participant.id);
        const visual = outgoingGfx && outgoingGfx.querySelector(".djs-visual");
        const rec = visual && visual.childNodes && visual.childNodes[0];

        if (rec && rec.style && isSelected) {
          rec.style.strokeWidth = "5px";
          rec.style.stroke = "#006400";
        }
      });
    };

    updateParticipantStyles();
  }, [participant, selectedParticipants]);

  useEffect(() => {
    const cardResizeObserver = new ResizeObserver(() => {
      const canvas = bpmnViewerRef?.current?.get("canvas");
      canvas?.zoom("fit-viewport", "auto");
    });
    cardResizeObserver.observe(canvasTaskRef?.current);
    return () => {
      cardResizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    selectedParticipants &&
      setParticipant([...(selectedParticipants[id] || [])]);
  }, [id, selectedParticipants]);

  return (
    <Box
      shadow
      rounded
      border
      overflow="hidden"
      key={id}
      id={`card-${id}`}
      style={{
        position: "relative",
        height: "98%",
        width: "100%",
        minHeight: "230px",
      }}
      borderColor={showConfiguration && (!name || !code) ? "danger" : ""}
    >
      <Box
        style={{
          transition: "all 0.3s ease",
          height: "100%",
        }}
        d="flex"
        overflow="hidden"
        rounded
        justifyContent="space-between"
        className="preview-card"
        flexDirection={horizontalDrawer ? "row" : "column"}
        borderWidth={1}
      >
        <Box
          d="flex"
          flexDirection="column"
          ref={canvasTaskRef}
          style={{ height: "100%", width: "100%" }}
        >
          {!hideToolbar && (
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
              <Box d="flex" gap={2}>
                {showConfiguration ? (
                  <Tooltip title={openConfig ? "Close" : "Configuration"}>
                    <Box
                      rounded="circle"
                      p={1}
                      mb={1}
                      d="flex"
                      justifyContent="center"
                      alignItems="center"
                      style={{
                        cursor: "pointer",
                        width: "40px",
                        height: "30px",
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        setOpenConfig((open) => !open);
                      }}
                    >
                      <MaterialIcon
                        icon={openConfig ? "expand_less" : "settings"}
                      />
                    </Box>
                  </Tooltip>
                ) : (
                  <Tooltip title="Delete">
                    <Box
                      rounded="circle"
                      p={1}
                      mb={1}
                      d="flex"
                      justifyContent="center"
                      alignItems="center"
                      style={{
                        cursor: "pointer",
                        width: "30px",
                        height: "30px",
                      }}
                    >
                      <MaterialIcon
                        icon="delete"
                        onClick={() => handleDeleteModel(id)}
                      />
                    </Box>
                  </Tooltip>
                )}
              </Box>
            </Box>
          )}

          <div
            onClick={() => setSelectionDialogOpen(true)}
            id={`canvas-task-${id}`}
            className="canvas-task"
            style={{
              minHeight: "95%",
              maxHeight: "70vh",
              minWidth: "100%",
              position: "relative",
            }}
          ></div>
        </Box>

        <Box overflow="hidden">
          <Collapse horizontal={horizontalDrawer} in={drawerOpen || openConfig}>
            {showConfiguration && (
              <Box
                p={2}
                border
                bg="body-tertiary"
                style={{ minHeight: horizontalDrawer ? "100vh" : "100%" }}
              >
                <Box fontWeight="bold">{translate("Configure Model")}</Box>
                <ConfigurationBox data={entry} update={update} />
              </Box>
            )}
          </Collapse>
        </Box>

        {showSelectionCount && (
          <Box
            d="flex"
            justifyContent="center"
            gap={4}
            pos="absolute"
            style={{ bottom: 0, left: 0 }}
          >
            <Box
              rounded
              bg={participant.length ? "success" : "body-tertiary"}
              color={participant.length ? "success-emphasis" : "body"}
              d="flex"
              justifyContent="center"
              alignItems="center"
              style={{ cursor: "pointer", width: "50px", height: "30px" }}
            >
              <MaterialIcon icon="person" />
              <Box> {participant.length}</Box>
            </Box>
          </Box>
        )}
      </Box>
      {openInDialog && (
        <Dialog open={selectionDialogOpen} size="xl" backdrop>
          <DialogHeader onCloseClick={handleClose}>
            <DialogTitle>
              {allowSelection
                ? translate("Select Participants")
                : translate("Preview")}
            </DialogTitle>
          </DialogHeader>
          <DialogContent style={{ height: "80vh" }}>
            <ParticipantSelector
              bpmnId={`split-preview-${id}`}
              selectedParticipants={participant}
              setSelectedParticipants={setParticipant}
              entry={entry}
              shouldSelectParticipants={allowSelection}
            />
          </DialogContent>
          <DialogFooter>
            <Button variant="primary" onClick={onSave}>
              {translate("OK")}
            </Button>
            <Button variant="secondary" onClick={handleClose}>
              {translate("Cancel")}
            </Button>
          </DialogFooter>
        </Dialog>
      )}
    </Box>
  );
}

export default BpmnPreviews;
