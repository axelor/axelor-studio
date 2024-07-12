import { useState } from "react";
import { Box, Button, TextField } from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";
import ModelList from "./ModelList";
import { useCallback } from "react";
import Tooltip from "../../components/Tooltip/Tooltip";
import { translate } from "../../utils";

const PreviewTopBar = ({ setModels, models, setFilteredModels, createNew }) => {
  const [open, setOpen] = useState(false);

  const openDialog = () => setOpen(true);

  const filterModels = useCallback(
    (e) => {
      if (!models) return;
      const text = e.target.value;
      const filtered = models?.filter((model) =>
        model?.name?.toLowerCase()?.includes(text?.toLowerCase())
      );
      setFilteredModels(filtered);
    },
    [models, setFilteredModels]
  );

  return (
    <Box p={1} borderBottom bg="body-tertiary">
      <Box d="flex" p={2} justifyContent="space-between" alignItems="center">
        <Tooltip title="Create New">
          <Button me={4} onClick={createNew}>
            <MaterialIcon icon="add" />
          </Button>
        </Tooltip>
        <TextField
          placeholder={translate("Search...")}
          inputProps={{ "aria-label": "search" }}
          onChange={filterModels}
          icons={[{ icon: "search", color: "body" }]}
        />
        <Tooltip title="Model List">
          <Button ms={3} onClick={openDialog}>
            <MaterialIcon icon="list" />
          </Button>
        </Tooltip>
      </Box>
      <ModelList
        open={open}
        setOpen={setOpen}
        models={models}
        setModels={setModels}
      />
    </Box>
  );
};

export default PreviewTopBar;
