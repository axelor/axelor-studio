import { useState, useCallback  } from "react";
import { Box, Button, TextField } from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";
import { Tooltip } from "@studio/shared/components";
import { translate } from "@studio/shared/i18n";

import ModelList from "./ModelList";

interface BpmnModel {
  id?: string | number;
  name?: string;
  code?: string;
  uploaded?: boolean;
  [key: string]: unknown;
}

interface PreviewTopBarProps {
  setModels: React.Dispatch<React.SetStateAction<BpmnModel[]>>;
  models: BpmnModel[];
  setFilteredModels: React.Dispatch<React.SetStateAction<BpmnModel[]>>;
  createNew: () => void;
  setSelectedParticipants: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
}

const PreviewTopBar = ({
  setModels,
  models,
  setFilteredModels,
  createNew,
  setSelectedParticipants,
}: PreviewTopBarProps) => {
  const [open, setOpen] = useState(false);

  const openDialog = () => setOpen(true);

  const filterModels = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!models) return;
      const text = e.target.value;
      const filtered = models?.filter((model) =>
        model?.name?.toLowerCase()?.includes(text?.toLowerCase()),
      );
      setFilteredModels(filtered);
    },
    [models, setFilteredModels],
  );

  return (
    <Box p={1} borderBottom bg="body-tertiary">
      <Box d="flex" p={2} justifyContent="space-between" alignItems="center">
        <Tooltip title={translate("Create New")} placement="bottom-start">
          <Button me={4} onClick={createNew}>
            <MaterialIcon icon="add" />
          </Button>
        </Tooltip>
        <TextField
          placeholder={translate("Search...")}
          aria-label="search"
          onChange={filterModels}
          icons={[{ icon: "search" }]}
        />
        <Tooltip title={translate("Model List")}>
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
        setSelectedParticipants={setSelectedParticipants}
      />
    </Box>
  );
};

export default PreviewTopBar;
