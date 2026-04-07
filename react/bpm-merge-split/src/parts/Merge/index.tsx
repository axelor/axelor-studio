import { useState, useEffect, useCallback } from "react";
import SplitPane from "react-split-pane";
// react-split-pane@0.1.92 types lack children (React 19 compat)
const SplitPaneWithChildren = SplitPane as unknown as React.ComponentType< // safety: react-split-pane lacks children in type definition
  import("react-split-pane").SplitPaneProps & { children: React.ReactNode }
>;
import { Box, Grow } from "@axelor/ui";
import { nanoid } from "nanoid";

import ActionButton from "../../components/ActionButton";
import MergeGuide from "../CommonParts/MergeGuide";
import BpmnPreviews from "../CommonParts/BpmnPreviews";
import LoadingAnimation from "../CommonParts/LoadingAnimation";
import { useAlert } from "../../hooks/useAlert";
import { mergeWkfModel } from "../../services/api";
import { LOADING_TEXT } from "../../Constants";

import MergePreviewPanel from "./MergePreviewPanel";
import MergeViewToolBar from "./MergeViewToolbar";

interface BpmnModel {
  id?: string | number;
  diagramXml?: string | null;
  name?: string;
  code?: string;
  [key: string]: unknown;
}

const Merge = () => {
  const [selectedParticipants, setSelectedParticipants] = useState<Record<string, string[]>>({});
  const [models, setModels] = useState<BpmnModel[]>([]);
  const [mergedModel, setMergedModel] = useState<BpmnModel | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showError } = useAlert();

  const update = useCallback((id: string | number | undefined, key: string, value: string) => {
    setMergedModel((model) => {
      const newModel: BpmnModel = { ...model };
      if (!value || value === "") {
        delete newModel[key];
      } else {
        newModel[key] = value;
      }
      return { ...newModel };
    });
  }, []);

  const processData = useCallback(
    (selectedParticipants: Record<string, string[]>) => {
      return Object.entries(selectedParticipants).map(([id, participants]) => {
        const model = models.find((m) => String(m.id) == id);
        return {
          id: model?.code ? model.id : null,
          diagramXml: model?.code ? null : model?.diagramXml,
          participants: participants || [],
        };
      });
    },
    [models],
  );

  const handleMergeClick = async () => {
    setLoading(true);
    setDrawerOpen(false);
    const payload = processData(selectedParticipants);
    const result = await mergeWkfModel(payload);
    const values = result.values as Record<string, unknown> | undefined;
    const error = result.error as { message?: string } | undefined;
    const mergedResult = (values?.result as string) ?? "";
    if (!error && mergedResult) {
      setMergedModel({ id: nanoid(), diagramXml: mergedResult });
    } else {
      setMergedModel(null);
      showError("danger", `Error: ${error?.message || ""}`);
    }
    setLoading(false);
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

  return (
    <SplitPaneWithChildren
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
          onClick={() => void handleMergeClick()}
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
            <Box d="flex" style={{ height: "100vh", minWidth: "100%" }} flex={1}>
              <Box h={100} style={{ width: "100%" }} pos="relative" d="flex" flex={1}>
                <BpmnPreviews
                  entry={mergedModel}
                  update={update}
                  drawerOpen={drawerOpen}
                  showConfiguration={true}
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
    </SplitPaneWithChildren>
  );
};

export default Merge;
