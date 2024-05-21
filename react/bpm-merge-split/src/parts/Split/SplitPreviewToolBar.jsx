import { Box, Button } from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";
import { save, saveAndDeploy } from "../../services/api";
import Tooltip from "../../components/Tooltip/Tooltip";
import { useAlert } from "../../context/AlertContext";
import { setParam } from "../../utils";

const SplitPreviewToolBar = ({
  models = true,
  payloadRef = {},
  enableSaving = false,
  setSelectedParticipants = () => {},
  removeAllModels = () => {},
}) => {
  const { showError } = useAlert();

  const handleSaveAndDeploy = async (modelsData, requestFunction) => {
    const errorModel = modelsData.find((model) => !model.name || !model.code);
    if (errorModel) {
      const errorCard = document.getElementById(`card-${errorModel.id}`);
      const cardContainer = document.querySelector("card-container");
      errorCard?.classList?.add("shake-animation");
      if (cardContainer) {
        cardContainer.scrollTop =
          errorCard?.offsetTop - cardContainer?.offsetTop;
      }
      setTimeout(() => {
        errorCard.classList.remove("shake-animation");
      }, 2000);
      showError("danger", "Please configure all the models !");
    } else {
      const results = modelsData.reduce((acc, { id, ...model }) => {
        acc.push({
          code: model.code,
          name: model.name,
          diagram: model.diagramXml,
        });
        return acc;
      }, []);
      const { values: { result = "" } = {}, error } = await requestFunction(
        [payloadRef?.current || {}],
        results
      );
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
      backgroundColor="body-tertiary"
      paddingY={1}
      py={2}
      bg="body-tertiary"
      borderBottom
    >
      <Box display="flex" mt={2} alignItems="center">
        <Tooltip title="Save">
          <Button marginLeft={3} disabled={enableSaving} onClick={onSave}>
            <MaterialIcon icon="save" />
          </Button>
        </Tooltip>
        <Tooltip title="Save and Deploy">
          <Button
            marginLeft={3}
            disabled={enableSaving}
            onClick={onSaveAndDeploy}
          >
            <MaterialIcon icon="rocket" />
          </Button>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default SplitPreviewToolBar;
