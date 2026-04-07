import { Box, Button } from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";
import { useCallback, useEffect, useState } from "react";
import { Tooltip } from "@studio/shared/components";
import { translate } from "@studio/shared/i18n";

import Selection from "../../components/Select";
import { getBPMModels } from "../../services/api";
import { getParams } from "../../utils";

interface BpmnModel {
  id?: string | number;
  name?: string;
  [key: string]: unknown;
}

interface SplitViewToolBarProps {
  model: BpmnModel;
  setModel: React.Dispatch<React.SetStateAction<BpmnModel>>;
  createNew?: () => void;
  onModelChange?: (value?: BpmnModel) => void;
}

const SplitViewToolBar = ({
  model,
  setModel,
  createNew = () => {},
  onModelChange = () => {},
}: SplitViewToolBarProps) => {
  const [options, setOptions] = useState<BpmnModel[]>([]);
  const { id } = getParams();

  const handleSearch = useCallback(async () => {
    const models = await getBPMModels();
    setOptions(models as BpmnModel[]);
  }, []);

  const handleOnChange = (value: BpmnModel | null) => {
    onModelChange(value ?? undefined);
  };

  useEffect(() => {
    if (options) {
      const foundModel = options?.find((op) => String(op.id) == id);
      setModel(foundModel || {});
    }
  }, [id, options, setModel]);

  return (
    <Box p={1} borderBottom bg="body-tertiary">
      <Box d="flex" p={2} justifyContent="space-between" alignItems="center">
        <Tooltip title={translate("Create New")} placement="bottom-start">
          <Button me={4} onClick={createNew}>
            <MaterialIcon icon="add" />
          </Button>
        </Tooltip>
        <Selection
          openOnFocus={true}
          options={options}
          value={model || ""}
          placeholder="models"
          onChange={handleOnChange}
          label="name"
          onSearch={handleSearch}
          disableClearable={true}
        />
      </Box>
    </Box>
  );
};
export default SplitViewToolBar;
