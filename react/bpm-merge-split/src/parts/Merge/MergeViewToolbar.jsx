import { Box, Button } from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";
import { save, saveAndDeploy } from "../../services/api";
import Tooltip from "../../components/Tooltip/Tooltip";
import { useAlert } from "../../context/AlertContext";
import { useCallback } from "react";

const MergeViewToolBar = ({
  open,
  setDrawerOpen = () => {},
  mergedModel = {},
  ids = [],
  setSelectedParticipants = () => {},
  setModels = () => {},
}) => {
  const { showError } = useAlert();

  const handleDrawerToggle = () => {
    setDrawerOpen((open) => !open);
  };

  const onSave = useCallback(async () => {
    if (!mergedModel?.name || !mergedModel?.code) {
      setDrawerOpen(true);
      showError("danger", "Please configure model");
    } else {
      const results = {
        code: mergedModel?.code,
        name: mergedModel?.name,
        diagram: mergedModel?.diagramXml,
      };
      const { values, error } = await save(ids, [results]);
      if (error) {
        showError("danger", `Error: ${error.message}`);
      } else {
        setSelectedParticipants([]);
        setModels([]);
        showError("success", `Model saved successfully !`);
      }
    }
  }, [
    ids,
    mergedModel,
    setDrawerOpen,
    setModels,
    setSelectedParticipants,
    showError,
  ]);

  const onSaveAndDeploy = async () => {
    if (!mergedModel?.name || !mergedModel?.code) {
      setDrawerOpen(true);
    } else {
      const results = {
        code: mergedModel.code,
        name: mergedModel.name,
        diagram: mergedModel.diagramXml,
      };
      const { values: { result = "" } = {}, error } = await saveAndDeploy(ids, [
        results,
      ]);
      if (error) {
        showError("danger", `Error: ${error.message}`);
      } else {
        setSelectedParticipants([]);
        setModels([]);
        showError("success", `Model saved successfully !`);
      }
    }
  };

  return (
    <Box
      d="flex"
      alignItems="center"
      justifyContent="space-between"
      bg="body-tertiary"
      py={1}
      borderBottom
      style={{ width: "100%" }}
    >
      <Box d="flex" p={2} alignItems="center">
        <Tooltip title="Save">
          <Button ms={3} disabled={!mergedModel} onClick={onSave}>
            <MaterialIcon icon="save" />
          </Button>
        </Tooltip>
        <Tooltip title="Save and Deploy">
          <Button ms={3} disabled={!mergedModel} onClick={onSaveAndDeploy}>
            <MaterialIcon icon="rocket" />
          </Button>
        </Tooltip>
      </Box>
      <Tooltip title={open && mergedModel ? "Close" : "Configure"}>
        <Button mx={3} onClick={handleDrawerToggle} disabled={!mergedModel}>
          <MaterialIcon icon={open && mergedModel ? "close" : "settings"} />
        </Button>
      </Tooltip>
    </Box>
  );
};
export default MergeViewToolBar;
