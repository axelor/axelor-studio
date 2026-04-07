import { Box, Button } from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";
import { Tooltip } from "@studio/shared/components";
import { translate } from "@studio/shared/i18n";

import { save, saveAndDeploy } from "../../services/api";
import { useAlert } from "../../hooks/useAlert";
import { setParam } from "../../utils";

interface BpmnModel {
  id?: string | number;
  name?: string;
  code?: string;
  diagramXml?: string | null;
  [key: string]: unknown;
}

interface SplitPreviewToolBarProps {
  models?: BpmnModel[];
  payloadRef?: React.MutableRefObject<Record<string, unknown>>;
  enableSaving?: boolean;
  setSelectedParticipants?: React.Dispatch<React.SetStateAction<string[]>>;
  removeAllModels?: () => void;
}

const SplitPreviewToolBar = ({
  models = [],
  payloadRef = { current: {} },
  enableSaving = false,
  setSelectedParticipants = () => {},
  removeAllModels = () => {},
}: SplitPreviewToolBarProps) => {
  const { showError } = useAlert();

  const handleSaveAndDeploy = async (
    modelsData: BpmnModel[],
    requestFunction: (
      ids: Record<string, unknown>,
      results: unknown,
    ) => Promise<Record<string, unknown>>,
  ) => {
    const errorModel = modelsData.find((model) => !model.name || !model.code);
    if (errorModel) {
      const errorCard = document.getElementById(`card-${errorModel.id}`);
      const cardContainer = document.querySelector(".card-container");
      errorCard?.classList?.add("shake-animation");
      if (cardContainer) {
        (cardContainer as HTMLElement).scrollTop =
          (errorCard?.offsetTop ?? 0) - ((cardContainer as HTMLElement)?.offsetTop ?? 0);
      }
      setTimeout(() => {
        errorCard?.classList?.remove("shake-animation");
      }, 2000);
      showError("danger", "Please configure all the models !");
    } else {
      const results = modelsData.reduce<Record<string, unknown>[]>((acc, { id: _id, ...model }) => {
        acc.push({
          code: model.code,
          name: model.name,
          diagram: model.diagramXml,
        });
        return acc;
      }, []);
      const response = await requestFunction(
        [payloadRef?.current || {}] as unknown as Record<string, unknown>, // safety: Axelor REST API expects dynamic Record payload
        results,
      );
      const error = response.error as { message?: string } | undefined;
      if (error) {
        showError("danger", `Error: ${error.message}`);
      } else {
        setParam("id", "");
        setSelectedParticipants([]);
        removeAllModels();
        showError("success", `Model saved successfully !`);
      }
    }
  };

  const onSave = async () => {
    await handleSaveAndDeploy(models, save);
  };

  const onSaveAndDeploy = async () => {
    await handleSaveAndDeploy(models, saveAndDeploy);
  };

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      py={2}
      bg="body-tertiary"
      borderBottom
    >
      <Box display="flex" mt={2} alignItems="center">
        <Tooltip title={translate("Save")}>
          <Button ms={3} disabled={enableSaving} onClick={() => void onSave()}>
            <MaterialIcon icon="save" />
          </Button>
        </Tooltip>
        <Tooltip title={translate("Save and Deploy")}>
          <Button ms={3} disabled={enableSaving} onClick={() => void onSaveAndDeploy()}>
            <MaterialIcon icon="rocket" />
          </Button>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default SplitPreviewToolBar;
