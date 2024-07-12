import { Box, Button } from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";
import { getBPMModels } from "../../services/api";
import { useCallback, useEffect, useState } from "react";
import Selection from "../../components/Select";
import Tooltip from "../../components/Tooltip/Tooltip";
import { getParams } from "../../utils";

const SplitViewToolBar = ({
  model,
  setModel,
  createNew = () => {},
  onModelChange = () => {},
}) => {
  const [options, setOptions] = useState([]);
  const { id } = getParams();

  const handleSearch = useCallback(async () => {
    const models = await getBPMModels();
    setOptions(models);
  }, []);

  const handleOnChange = (value) => {
    onModelChange(value);
  };

  useEffect(() => {
    if (options) {
      const model = options?.find((op) => op.id == id);
      setModel(model || {});
    }
  }, [id, options, setModel]);

  return (
    <Box p={1} borderBottom bg="body-tertiary">
      <Box d="flex" p={2} justifyContent="space-between" alignItems="center">
        <Tooltip title="Create New">
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
