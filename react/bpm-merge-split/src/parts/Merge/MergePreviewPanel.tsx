import { useState, useEffect, useCallback } from "react";
import { nanoid } from "nanoid";
import { Box } from "@axelor/ui";
import { translate } from "@studio/shared/i18n";

import UploadCard from "../../components/UploadCard";
import BpmnPreviews from "../CommonParts/BpmnPreviews";
import { useConfirmation } from "../../hooks/useConfirmation";
import { getParams } from "../../utils";
import { getBPMModels } from "../../services/api";

import PreviewToolBar from "./PreviewTopBar";

interface BpmnModel {
  id?: string | number;
  diagramXml?: string | null;
  name?: string;
  code?: string;
  uploaded?: boolean;
  [key: string]: unknown;
}

interface MergePreviewPanelProps {
  selectedParticipants: Record<string, string[]>;
  setSelectedParticipants: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  models?: BpmnModel[];
  setModels?: React.Dispatch<React.SetStateAction<BpmnModel[]>>;
  setMergedModel?: React.Dispatch<React.SetStateAction<BpmnModel | null>>;
  mergedModel?: BpmnModel | null;
}

const MergePreviewPanel = ({
  selectedParticipants,
  setSelectedParticipants,
  models = [],
  setModels = () => {},
  setMergedModel = () => {},
  mergedModel = null,
}: MergePreviewPanelProps) => {
  const [files, _setFiles] = useState<File[]>([]);
  const [filteredModels, setFilteredModels] = useState<BpmnModel[]>([]);
  const { askConfirmation } = useConfirmation();

  const handleFileUpload = useCallback(
    (files: File[]) => {
      if (!files?.length) return;

      files.forEach((file) => {
        const reader = new FileReader();
        const fileName = file?.name?.replace(/\s/g, "");
        if (!fileName?.includes(".bpmn")) {
          alert(translate("Upload Bpmn files only"));
          return;
        }
        reader.readAsText(file);
        reader.onload = (e) => {
          setModels((models) => [
            ...models,
            { diagramXml: e.target?.result as string, id: nanoid(), uploaded: true },
          ]);
        };
      });
    },
    [setModels],
  );

  const handleDeleteModel = useCallback(
    (id: string | number | undefined) => {
      setSelectedParticipants(({ [String(id)]: _val, ...participants }) => participants);
      setModels((models) => models.filter((m) => m.id !== id));
    },
    [setModels, setSelectedParticipants],
  );

  const createNew = useCallback(() => {
    if (models.length || mergedModel) {
      askConfirmation("Current changes will be lost. Do you really want to proceed?", () => {
        setSelectedParticipants({});
        setModels([]);
        setMergedModel(null);
      });
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
    void (async () => {
      const { id } = getParams();
      const ids = id?.split("-")?.map((id) => Number(id)) || [];
      try {
        const data = await getBPMModels();
        const urlModels = data.filter((model) => model.id != null && ids.includes(Number(model.id)));
        setModels(urlModels as BpmnModel[]);
      } catch {
        // Error silently handled by design
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
              key={String(entry.id)}
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
        <UploadCard files={files} onFileUpload={handleFileUpload} />
      </Box>
    </Box>
  );
};

export default MergePreviewPanel;
