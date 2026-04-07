import React, { useEffect, useState } from "react";
import { Box, Button } from "@axelor/ui";
import { CodeEditor } from "@studio/shared/components";
import { translate } from "@studio/shared/i18n";

import AlertComponent from "../../components/Alert";

import { useModeler } from "./hooks/useModeler";
import { useModelerEvent } from "./hooks/useModelerEvent";

interface XmlEditorProps {
  onClose?: () => void;
}

const XmlEditor = ({ onClose }: XmlEditorProps) => {
  const bpmnModeler = useModeler();
  const [xmlContent, setXmlContent] = useState("");
  const [errorToast, setErrorToast] = useState<{ message: string; messageType: string } | null>(
    null,
  );

  useEffect(() => {
    if (!bpmnModeler) {
      console.warn("bpmnModeler is not initialized.");
      return;
    }

    const fetchXmlContent = async () => {
      try {
        const { xml } = await bpmnModeler.saveXML({ format: true });
        setXmlContent(xml);
      } catch (error) {
        console.error("[XmlEditor] Error fetching XML content:", error);
      }
    };

    fetchXmlContent();
  }, [bpmnModeler]);

  useModelerEvent(
    "elements.changed",
    async () => {
      if (!bpmnModeler) return;
      try {
        const { xml } = await bpmnModeler.saveXML({ format: true });
        setXmlContent(xml);
      } catch (error) {
        console.error("[XmlEditor] Error updating XML content:", error);
      }
    },
    [bpmnModeler],
  );

  const handleTestAndSave = async () => {
    if (!bpmnModeler) {
      console.warn("bpmnModeler is not initialized.");
      return;
    }

    try {
      await bpmnModeler.importXML(xmlContent);
      bpmnModeler.get("eventBus").fire("elements.changed", { elements: [] });
      setErrorToast({
        message: translate("XML saved successfully."),
        messageType: "success",
      });
    } catch (error) {
      const errorMessage = (error as Error).message || "Invalid XML";
      const lineMatch = errorMessage.match(/line (\d+)/i);
      const columnMatch = errorMessage.match(/column (\d+)/i);
      const lineNumber = lineMatch ? parseInt(lineMatch[1], 10) : 1;
      const columnNumber = columnMatch ? parseInt(columnMatch[1], 10) : 1;

      setErrorToast({
        message: translate(`Error at Line ${lineNumber}, Column ${columnNumber}`),
        messageType: "danger",
      });
    }
  };

  const handleAlertClose = () => {
    setErrorToast(null);
  };

  const handleClose = () => {
    setXmlContent("");
    if (onClose) onClose();
  };

  return (
    <>
      <Box d="flex" justifyContent="flex-end" alignItems="center" bg="body-tertiary" gap={4} p={2}>
        <Button size="sm" variant="secondary" onClick={handleClose}>
          {translate("Close")}
        </Button>
        <Button size="sm" variant="primary" onClick={handleTestAndSave}>
          {translate("Save")}
        </Button>
      </Box>
      <CodeEditor
        height="100%"
        language="xml"
        value={xmlContent}
        onChange={(value) => setXmlContent(value ?? "")}
        minimap={false}
      />
      {errorToast && (
        <AlertComponent
          open={!!errorToast}
          messageType={errorToast.messageType}
          message={errorToast.message}
          onClose={handleAlertClose}
        />
      )}
    </>
  );
};

export default XmlEditor;
