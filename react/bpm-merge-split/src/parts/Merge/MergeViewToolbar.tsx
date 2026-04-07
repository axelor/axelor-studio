import { Box, Button } from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";
import { Tooltip } from "@studio/shared/components";
import { translate } from "@studio/shared/i18n";
import { useCallback } from "react";

import { useAlert } from "../../hooks/useAlert";
import { save, saveAndDeploy } from "../../services/api";

interface BpmnModel {
  id?: string | number;
  name?: string;
  code?: string;
  diagramXml?: string | null;
  [key: string]: unknown;
}

interface MergeViewToolBarProps {
  open: boolean;
  setDrawerOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  mergedModel?: BpmnModel | null;
  ids?: Record<string, unknown>[];
  setSelectedParticipants?: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  setModels?: React.Dispatch<React.SetStateAction<BpmnModel[]>>;
}

const MergeViewToolBar = ({
  open,
  setDrawerOpen = () => {},
  mergedModel = {},
  ids = [],
  setSelectedParticipants = () => {},
  setModels = () => {},
}: MergeViewToolBarProps) => {
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
      const response = await save(ids as unknown as Record<string, unknown>, [results]); // safety: Axelor REST save API expects dynamic Record payload
      const error = response.error as { message?: string } | undefined;
      if (error) {
        showError("danger", `Error: ${error.message}`);
      } else {
        setSelectedParticipants({} as Record<string, string[]>);
        setModels([]);
        showError("success", `Model saved successfully !`);
      }
    }
  }, [ids, mergedModel, setDrawerOpen, setModels, setSelectedParticipants, showError]);

  const onSaveAndDeploy = async () => {
    if (!mergedModel?.name || !mergedModel?.code) {
      setDrawerOpen(true);
    } else {
      const results = {
        code: mergedModel.code,
        name: mergedModel.name,
        diagram: mergedModel.diagramXml,
      };
      const response = await saveAndDeploy(ids as unknown as Record<string, unknown>, [results]); // safety: Axelor REST save API expects dynamic Record payload
      const error = response.error as { message?: string } | undefined;
      if (error) {
        showError("danger", `Error: ${error.message}`);
      } else {
        setSelectedParticipants({} as Record<string, string[]>);
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
        <Tooltip title={translate("Save")}>
          <Button ms={3} disabled={!mergedModel} onClick={() => void onSave()}>
            <MaterialIcon icon="save" />
          </Button>
        </Tooltip>
        <Tooltip title={translate("Save and Deploy")}>
          <Button ms={3} disabled={!mergedModel} onClick={() => void onSaveAndDeploy()}>
            <MaterialIcon icon="rocket" />
          </Button>
        </Tooltip>
      </Box>
      <Tooltip title={open && mergedModel ? translate("Close") : translate("Configure")}>
        <Button mx={3} onClick={handleDrawerToggle} disabled={!mergedModel}>
          <MaterialIcon icon={open && mergedModel ? "close" : "settings"} />
        </Button>
      </Tooltip>
    </Box>
  );
};
export default MergeViewToolBar;
