import { useState, useRef, useEffect, useCallback } from "react";
import SplitPane from "react-split-pane";
import { Box, Grow } from "@axelor/ui";
import { nanoid } from "nanoid";
import { useAlert } from "../../context/AlertContext";
import { useConfirmation } from "../../context/ConfirmationContext";
import { splitWkfModel } from "../../services/api";
import { setParam } from "../../utils";
import ActionButton from "../../components/ActionButton";
import SplitViewToolBar from "./SplitViewToolBar";
import ParticipantSelector from "../CommonParts/ParticipantSelector";
import SplitPreviewToolBar from "./SplitPreviewToolBar";
import SplitGuide from "../CommonParts/SplitGuide";
import SplitPanel from "./SplitPanel";
import LoadingAnimation from "../CommonParts/LoadingAnimation";
import { LOADING_TEXT } from "../../Constants";

const Split = () => {
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const payloadRef = useRef("");
  const [splittedModels, setSplittedModels] = useState([]);
  const [model, setModel] = useState({});
  const [loading, setLoading] = useState(false);
  const { showError } = useAlert();
  const { askConfirmation } = useConfirmation();

  const update = useCallback(
    (id, key, value) => {
      setSplittedModels((models) => {
        const index = models.findIndex((m) => m.id === id);
        if (index === -1) {
          return models;
        }
        const updatedModel = { ...models[index] };
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
    [setSplittedModels]
  );

  const removeAllModels = () => {
    setSplittedModels([]);
  };

  const handleSplitClick = useCallback(async () => {
    if (!model) return;
    setLoading(true);
    payloadRef.current = { id: model.id, participants: selectedParticipants };
    const { values: { results = [] } = {}, error } = await splitWkfModel(
      payloadRef.current
    );
    if (!error) {
      const resultantModels = results?.reduce((acc, xml) => {
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
    let rotationInterval;
    if (loading) {
      rotationInterval = setInterval(() => {
        setLoading(false);
      }, 3000);
    }

    return () => clearInterval(rotationInterval);
  }, [loading]);

  const handleOnChange = (value) => {
    if (selectedParticipants?.length || splittedModels?.length) {
      askConfirmation(
        "Current changes will be lost. Do you really want to proceed?",
        () => {
          setModel(value || []);
          setParam("id", value?.id || "");
          setSelectedParticipants([]);
          setSplittedModels([]);
        }
      );
    } else {
      setModel(value);
      setParam("id", value?.id);
    }
  };

  return (
    <SplitPane
      split="vertical"
      defaultSize={"70%"}
      maxSize={window.innerWidth - 330}
      minSize={320}
    >
      <Box minVH={100} className="right-pane" d="flex" flexDirection="column">
        <ActionButton
          onClick={handleSplitClick}
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
        <Box
          pos="relative"
          style={{ height: "calc(100vh - 60px)", maxWidth: "100%" }}
        >
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
              <SplitPanel
                models={splittedModels}
                setModels={setSelectedParticipants}
                update={update}
              />
            </Box>
          </Grow>
        )}
        {loading && <LoadingAnimation loadingTexts={LOADING_TEXT} />}
      </Box>
    </SplitPane>
  );
};

export default Split;
