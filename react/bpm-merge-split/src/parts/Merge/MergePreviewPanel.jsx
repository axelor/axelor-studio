import { useState, useEffect, useCallback } from "react";
import { nanoid } from "nanoid";
import { Box } from "@axelor/ui";
import UploadCard from "../../components/UploadCard";
import BpmnPreviews from "../CommonParts/BpmnPreviews";
import PreviewToolBar from "./PreviewTopBar";
import { useConfirmation } from "../../context/ConfirmationContext";
import { getParams, translate } from "../../utils";
import { getBPMModels } from "../../services/api";

const MergePreviewPanel = ({
  selectedParticipants,
  setSelectedParticipants,
  models = [],
  setModels = () => {},
  setMergedModel = () => {},
  mergedModel = null,
}) => {
  const [files, setFiles] = useState([]);
  const [filteredModels, setFilteredModels] = useState([]);
  const { askConfirmation } = useConfirmation();

  const handleFileUpload = useCallback(
    (files) => {
      if (!files?.length) return;

      files.forEach((file) => {
        let reader = new FileReader();
        const fileName = file?.name?.replace(/\s/g, "");
        if (!fileName?.includes(".bpmn")) {
          alert(translate("Upload Bpmn files only"));
          return;
        }
        reader.readAsText(file);
        reader.onload = (e) => {
          setModels((models) => [
            ...models,
            { diagramXml: e.target.result, id: nanoid(), uploaded: true },
          ]);
        };
      });
    },
    [setModels]
  );

  const handleDeleteModel = useCallback(
    (id) => {
      setSelectedParticipants(
        ({ [id]: _val, ...participants }) => participants
      );
      setModels((models) => models.filter((m) => m.id !== id));
    },
    [setModels, setSelectedParticipants]
  );

  const createNew = useCallback(() => {
    if (models.length || mergedModel) {
      askConfirmation(
        "Current changes will be lost. Do you really want to proceed?",
        () => {
          setSelectedParticipants({});
          setModels([]);
          setMergedModel(null);
        }
      );
    } else {
      setSelectedParticipants({});
      setModels([]);
      setMergedModel(null);
    }
  }, [
    askConfirmation,
    mergedModel,
    models.length,
    setMergedModel,
    setModels,
    setSelectedParticipants,
  ]);

  useEffect(() => {
    (async () => {
      const { id } = getParams();
      const ids = id?.split("-")?.map((id) => Number(id)) || [];
      try {
        const data = await getBPMModels();
        const urlModels = data.filter((model) => ids.includes(model.id));
        setModels(urlModels);
      } catch (error) {
        console.error("Error fetching BPM models:", error);
      }
    })();
  }, [setModels]);

  useEffect(() => {
    setFilteredModels(models);
  }, [models]);

  return (
    <Box h={100} className="left-side" pos="relative">
      <PreviewToolBar
        setModels={setModels}
        models={models}
        setFilteredModels={setFilteredModels}
        createNew={createNew}
        setSelectedParticipants={setSelectedParticipants}
      />
      <Box>
        <Box
          my={3}
          me={2}
          ps={2}
          d="flex"
          flexDirection="column"
          style={{ maxHeight: "80vh", overflow: "auto" }}
          gap={20}
        >
          {filteredModels?.map((entry, index) => (
            <BpmnPreviews
              key={entry.id}
              index={index}
              entry={entry}
              handleDeleteModel={handleDeleteModel}
              selectedParticipants={selectedParticipants}
              setSelectedParticipants={setSelectedParticipants}
              showSelectionCount={true}
              showConfiguration={false}
              allowSelection={true}
            />
          ))}
        </Box>
      </Box>
      <Box bg="body" mt={1} style={{ position: "sticky", bottom: "5px" }}>
        <UploadCard
          files={files}
          setFiles={setFiles}
          onFileUpload={handleFileUpload}
        />
      </Box>
    </Box>
  );
};

export default MergePreviewPanel;
