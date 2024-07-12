import { useState, useEffect, useCallback } from "react";
import SplitPane from "react-split-pane";
import { Box, Grow } from "@axelor/ui";
import ActionButton from "../../components/ActionButton";
import { nanoid } from "nanoid";
import MergePreviewPanel from "./MergePreviewPanel";
import MergeViewToolBar from "./MergeViewToolbar";
import MergeGuide from "../CommonParts/MergeGuide";
import BpmnPreviews from "../CommonParts/BpmnPreviews";
import LoadingAnimation from "../CommonParts/LoadingAnimation";
import { useAlert } from "../../context/AlertContext";
import { mergeWkfModel } from "../../services/api";
import { LOADING_TEXT } from "../../Constants";

const Merge = () => {
  const [selectedParticipants, setSelectedParticipants] = useState({});
  const [models, setModels] = useState([]);
  const [mergedModel, setMergedModel] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showError } = useAlert();

  const update = useCallback((id, key, value) => {
    setMergedModel((model) => {
      const newModel = { ...model };
      if (!value || value === "") {
        delete newModel[key];
      } else {
        newModel[key] = value;
      }
      return { ...newModel };
    });
  }, []);

  const processData = useCallback(
    (selectedParticipants) => {
      return Object.entries(selectedParticipants).map(([id, participants]) => {
        const model = models.find((m) => m.id == id);
        return {
          id: model?.code ? model.id : null,
          diagramXml: model.code ? null : model.diagramXml,
          participants: participants || [],
        };
      });
    },
    [models]
  );

  const handleMergeClick = async () => {
    setLoading(true);
    setDrawerOpen(false);
    const payload = processData(selectedParticipants);
    const { values: { result = "" } = {}, error } = await mergeWkfModel(
      payload
    );
    if (!error && result) {
      setMergedModel({ id: nanoid(), diagramXml: result });
    } else {
      setMergedModel(null);
      showError("danger", `Error: ${error?.message || ""}`);
    }
    setLoading(false);
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

  return (
    <SplitPane
      split="vertical"
      defaultSize={"20%"}
      maxSize={window.innerWidth * (2 / 3)}
      minSize={300}
    >
      <MergePreviewPanel
        selectedParticipants={selectedParticipants}
        setSelectedParticipants={setSelectedParticipants}
        models={models}
        setModels={setModels}
        setMergedModel={setMergedModel}
        mergedModel={mergedModel}
      />
      <Box minVH={100} className="right-pane" style={{ width: "100%" }}>
        <ActionButton
          onClick={handleMergeClick}
          loading={loading}
          mergedModel={mergedModel}
          btnPosition={{
            top: "45vh",
            left: "-30px",
          }}
          type="merge"
        />
        <MergeViewToolBar
          open={drawerOpen}
          setDrawerOpen={setDrawerOpen}
          mergedModel={mergedModel}
          ids={processData(selectedParticipants)}
          setSelectedParticipants={setSelectedParticipants}
          setModels={setModels}
        />
        {!loading && !mergedModel && <MergeGuide />}
        {!loading && mergedModel && (
          <Grow in={!loading}>
            <Box
              d="flex"
              style={{ height: "100vh", minWidth: "100%" }}
              flex={1}
            >
              <Box
                h={100}
                style={{ width: "100%" }}
                pos="relative"
                d="flex"
                flex={1}
              >
                <BpmnPreviews
                  entry={mergedModel}
                  showName={false}
                  update={update}
                  drawerOpen={drawerOpen}
                  showConfiguration={true}
                  horizontalPanel={drawerOpen}
                  hideToolbar={true}
                  openInDialog={false}
                  horizontalDrawer={true}
                />
              </Box>
            </Box>
          </Grow>
        )}
        {loading && <LoadingAnimation loadingTexts={LOADING_TEXT} />}
      </Box>
    </SplitPane>
  );
};

export default Merge;
