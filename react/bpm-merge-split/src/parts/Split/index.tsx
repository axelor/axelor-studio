import { useState, useRef, useEffect, useCallback } from "react";
import SplitPane from "react-split-pane";
// react-split-pane@0.1.92 types lack children (React 19 compat)
const SplitPaneWithChildren = SplitPane as unknown as React.ComponentType< // safety: react-split-pane lacks children in type definition
  import("react-split-pane").SplitPaneProps & { children: React.ReactNode }
>;
import { Box, Grow } from "@axelor/ui";
import { nanoid } from "nanoid";

import { useAlert } from "../../hooks/useAlert";
import { useConfirmation } from "../../hooks/useConfirmation";
import { splitWkfModel } from "../../services/api";
import { setParam } from "../../utils";
import ActionButton from "../../components/ActionButton";
import ParticipantSelector from "../CommonParts/ParticipantSelector";
import SplitGuide from "../CommonParts/SplitGuide";
import LoadingAnimation from "../CommonParts/LoadingAnimation";
import { LOADING_TEXT } from "../../Constants";

import SplitPanel from "./SplitPanel";
import SplitPreviewToolBar from "./SplitPreviewToolBar";
import SplitViewToolBar from "./SplitViewToolBar";

interface BpmnModel {
  id?: string | number;
  diagramXml?: string | null;
  name?: string;
  code?: string;
  [key: string]: unknown;
}

const Split = () => {
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const payloadRef = useRef<Record<string, unknown>>({});
  const [splittedModels, setSplittedModels] = useState<BpmnModel[]>([]);
  const [model, setModel] = useState<BpmnModel>({});
  const [loading, setLoading] = useState(false);
  const { showError } = useAlert();
  const { askConfirmation } = useConfirmation();

  const update = useCallback(
    (id: string | number | undefined, key: string, value: string) => {
      setSplittedModels((models) => {
        const index = models.findIndex((m) => m.id === id);
        if (index === -1) {
          return models;
        }
        const updatedModel: BpmnModel = { ...models[index] };
        if (!value || value === "") {
          delete updatedModel[key];
        } else {
          updatedModel[key] = value;
        }
        const newModels = [...models];
        newModels[index] = updatedModel;

        return newModels;
      });
    },
    [setSplittedModels],
  );

  const removeAllModels = () => {
    setSplittedModels([]);
  };

  const handleSplitClick = useCallback(async () => {
    if (!model) return;
    setLoading(true);
    payloadRef.current = { id: model.id, participants: selectedParticipants };
    const response = await splitWkfModel(payloadRef.current);
    const values = response.values as Record<string, unknown> | undefined;
    const error = response.error as { message?: string } | undefined;
    const results = (values?.results as string[]) ?? [];
    if (!error) {
      const resultantModels = results?.reduce<BpmnModel[]>((acc, xml) => {
        acc.push({
          id: nanoid(),
          diagramXml: xml,
        });
        return acc;
      }, []);
      setSplittedModels(resultantModels || []);
    } else {
      setSplittedModels([]);
      showError("danger", `Error: ${error.message}`);
    }
    setLoading(false);
  }, [model, selectedParticipants, showError]);

  const createNew = () => {
    handleOnChange();
  };

  useEffect(() => {
    let rotationInterval: ReturnType<typeof setInterval> | undefined;
    if (loading) {
      rotationInterval = setInterval(() => {
        setLoading(false);
      }, 3000);
    }

    return () => clearInterval(rotationInterval);
  }, [loading]);

  const handleOnChange = (value?: BpmnModel) => {
    if (selectedParticipants?.length || splittedModels?.length) {
      askConfirmation("Current changes will be lost. Do you really want to proceed?", () => {
        setModel(value || {});
        setParam("id", String(value?.id || ""));
        setSelectedParticipants([]);
        setSplittedModels([]);
      });
    } else {
      setModel(value || {});
      setParam("id", String(value?.id ?? ""));
    }
  };

  return (
    <SplitPaneWithChildren
      split="vertical"
      defaultSize={"70%"}
      maxSize={window.innerWidth - 330}
      minSize={320}
    >
      <Box minVH={100} className="right-pane" d="flex" flexDirection="column">
        <ActionButton
          onClick={() => void handleSplitClick()}
          loading={loading}
          btnPosition={{
            top: "45vh",
            right: "-24px",
          }}
          type="split"
        />
        <SplitViewToolBar
          model={model}
          setModel={setModel}
          createNew={createNew}
          onModelChange={handleOnChange}
        />
        <Box pos="relative" style={{ height: "calc(100vh - 60px)", maxWidth: "100%" }}>
          <ParticipantSelector
            entry={model}
            bpmnId={`canvas-selection-${model?.id}`}
            showName={false}
            shouldSelectParticipants={true}
            selectedParticipants={selectedParticipants}
            setSelectedParticipants={setSelectedParticipants}
          />
        </Box>
      </Box>
      <Box minVH={100}>
        <SplitPreviewToolBar
          models={splittedModels}
          payloadRef={payloadRef}
          enableSaving={!splittedModels?.length}
          setSelectedParticipants={setSelectedParticipants}
          removeAllModels={removeAllModels}
        />
        {!loading && !splittedModels.length && <SplitGuide />}
        {!loading && splittedModels && (
          <Grow in={!loading}>
            <Box>
              <SplitPanel models={splittedModels} update={update} />
            </Box>
          </Grow>
        )}
        {loading && <LoadingAnimation loadingTexts={LOADING_TEXT} />}
      </Box>
    </SplitPaneWithChildren>
  );
};

export default Split;
