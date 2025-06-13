import React, { useEffect, useState } from "react";
import MonacoEditor from "@monaco-editor/react";
import PropTypes from "prop-types";
import { Box, Button, useTheme } from "@axelor/ui";
import AlertComponent from "../../components/Alert";
import { translate } from "../../utils";

const XmlEditor = ({ bpmnModeler, onClose }) => {
  const [xmlContent, setXmlContent] = useState("");
  const [errorToast, setErrorToast] = useState(null);
  const { theme } = useTheme();
  const editorTheme = theme === "light" ? "light" : "vs-dark";

  const handleEditorDidMount = (editor) => {
    editor.updateOptions({
      theme: editorTheme,
      acceptSuggestionOnCommitCharacter: true,
      acceptSuggestionOnEnter: "smart",
      accessibilityPageSize: 10,
      accessibilitySupport: "auto",
      autoClosingBrackets: "always",
      autoClosingQuotes: "always",
      autoIndent: "full",
      automaticLayout: true,
      bracketPairColorization: { enabled: true },
      codeLens: true,
      colorDecorators: true,
      cursorBlinking: "smooth",
      cursorStyle: "line",
      dragAndDrop: true,
      find: { seedSearchStringFromSelection: true },
      folding: true,
      fontFamily: "Courier New",
      fontSize: 14,
      fontWeight: "normal",
      hover: { enabled: true },
      inlayHints: { enabled: true },
      lineNumbers: "on",
      links: true,
      minimap: { enabled: true },
      quickSuggestions: true,
      renderWhitespace: "all",
      scrollBeyondLastLine: true,
      smoothScrolling: true,
      tabCompletion: "on",
      wordWrap: "on",
    });
  };

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
        console.error("Error fetching XML content:", error);
      }
    };

    fetchXmlContent();

    const updateXmlContent = async () => {
      try {
        const { xml } = await bpmnModeler.saveXML({ format: true });
        setXmlContent(xml);
      } catch (error) {
        console.error("Error updating XML content:", error);
      }
    };

    const eventBus = bpmnModeler.get("eventBus");
    eventBus.on("elements.changed", updateXmlContent);

    return () => {
      eventBus.off("elements.changed", updateXmlContent);
    };
  }, [bpmnModeler]);

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
      const errorMessage = error.message || "Invalid XML";
      const lineMatch = errorMessage.match(/line (\d+)/i);
      const columnMatch = errorMessage.match(/column (\d+)/i);
      const lineNumber = lineMatch ? parseInt(lineMatch[1], 10) : 1;
      const columnNumber = columnMatch ? parseInt(columnMatch[1], 10) : 1;

      const model = monaco.editor.getModels()[0];
      if (model) {
        monaco.editor.setModelMarkers(model, "owner", [
          {
            startLineNumber: lineNumber,
            startColumn: columnNumber,
            endLineNumber: lineNumber,
            endColumn: columnNumber + 1,
            message: errorMessage,
            severity: monaco.MarkerSeverity.Error,
          },
        ]);
      }

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
      <Box
        d="flex"
        justifyContent="flex-end"
        alignItems="center"
        bg="body-tertiary"
        gap={4}
        p={2}
      >
        <Button size="sm" variant="secondary" onClick={handleClose}>
          {translate("Close")}
        </Button>
        <Button size="sm" variant="primary" onClick={handleTestAndSave}>
          {translate("Save")}
        </Button>
      </Box>
      <MonacoEditor
        height="100%"
        defaultLanguage="xml"
        value={xmlContent}
        onChange={(value) => setXmlContent(value)}
        options={{
          minimap: { enabled: false },
          theme: editorTheme,
        }}
        onMount={handleEditorDidMount}
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

XmlEditor.propTypes = {
  bpmnModeler: PropTypes.object,
  onClose: PropTypes.func,
};

export default XmlEditor;