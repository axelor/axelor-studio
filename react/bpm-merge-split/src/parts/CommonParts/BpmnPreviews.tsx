import { useEffect, useState } from "react";
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
import { translate } from "@studio/shared/i18n";
import { Tooltip } from "@studio/shared/components";

import { useTab } from "../../hooks/useTabChange";
import { useBpmnViewer } from "../../hooks/useBpmnViewer";

import ConfigurationBox from "./ConfigurationBox";
import ParticipantSelector from "./ParticipantSelector";
import "../../css/bpmn.css";

interface BpmnModel {
  id?: string | number;
  diagramXml?: string | null;
  name?: string;
  code?: string;
  [key: string]: unknown;
}

interface BpmnPreviewsProps {
  entry?: BpmnModel;
  update?: (id: string | number | undefined, key: string, value: string) => void;
  selectedParticipants?: Record<string, string[]>;
  setSelectedParticipants?: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  handleDeleteModel?: (id: string | number | undefined) => void;
  showSelectionCount?: boolean;
  allowSelection?: boolean;
  showConfiguration?: boolean;
  hideToolbar?: boolean;
  drawerOpen?: boolean;
  openInDialog?: boolean;
  horizontalDrawer?: boolean;
  index?: number;
  showName?: boolean;
  model?: BpmnModel[];
  horizontalPanel?: boolean;
}

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
}: BpmnPreviewsProps) {
  const { id, diagramXml, name, code } = entry;
  const [participant, setParticipant] = useState<string[]>([]);
  const [selectionDialogOpen, setSelectionDialogOpen] = useState(false);
  const [openConfig, setOpenConfig] = useState(false);
  const { tabVisible } = useTab();

  const { containerRef } = useBpmnViewer({
    containerId: `#canvas-task-${id}`,
    diagramXml: diagramXml ?? null,
    additionalModules: [
      { moveCanvas: ["value", ""], zoomScroll: ["value", ""] } as Record<string, unknown>,
    ],
    readOnly: true,
    enabled: !!tabVisible && !!diagramXml,
    selectedParticipants: participant,
  });

  const onSave = () => {
    if (allowSelection && setSelectedParticipants) {
      if (participant.length > 0) {
        setSelectedParticipants((items) => ({
          ...items,
          [String(id)]: [...participant],
        }));
      } else {
        setSelectedParticipants((items) => {
          const updatedItems = { ...items };
          delete updatedItems[String(id)];
          return updatedItems;
        });
      }
    }
    setSelectionDialogOpen(false);
  };

  const handleClose = () => {
    setSelectionDialogOpen(false);
    if (allowSelection && selectedParticipants) {
      setParticipant([...(selectedParticipants[String(id)] || [])]);
    }
  };

  useEffect(() => {
    if (selectedParticipants) {
      setParticipant([...(selectedParticipants[String(id)] || [])]);
    }
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
      borderColor={showConfiguration && (!name || !code) ? "danger" : undefined}
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
          ref={containerRef}
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
                  <Tooltip title={openConfig ? translate("Close") : translate("Configuration")}>
                    <Box
                      data-testid="config-toggle"
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
                      onClick={(e: React.MouseEvent) => {
                        e.preventDefault();
                        setOpenConfig((open) => !open);
                      }}
                    >
                      <MaterialIcon
                        icon={
                          (openConfig ? "expand_less" : "settings") as React.ComponentProps<
                            typeof MaterialIcon
                          >["icon"]
                        }
                      />
                    </Box>
                  </Tooltip>
                ) : (
                  <Tooltip title={translate("Delete")}>
                    <Box
                      data-testid="delete-model"
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
                      <MaterialIcon icon="delete" onClick={() => handleDeleteModel(id)} />
                    </Box>
                  </Tooltip>
                )}
              </Box>
            </Box>
          )}

          <div
            data-testid="bpmn-canvas"
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
              data-testid="selection-count"
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
              {allowSelection ? translate("Select Participants") : translate("Preview")}
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
            <Button variant="primary" onClick={onSave} data-testid="dialog-ok">
              {translate("OK")}
            </Button>
            <Button variant="secondary" onClick={handleClose} data-testid="dialog-cancel">
              {translate("Cancel")}
            </Button>
          </DialogFooter>
        </Dialog>
      )}
    </Box>
  );
}

export default BpmnPreviews;
