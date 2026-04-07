import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@axelor/ui";
import { translate } from "@studio/shared/i18n";

import DataGrid from "../../components/DataGrid";
import { getBPMModels } from "../../services/api";
import { setParam } from "../../utils";
import { MODEL_GRID_COLUMNS } from "../../Constants";

interface BpmnModel {
  id?: string | number;
  name?: string;
  code?: string;
  uploaded?: boolean;
  [key: string]: unknown;
}

interface ModelListProps {
  setModels: React.Dispatch<React.SetStateAction<BpmnModel[]>>;
  models?: BpmnModel[];
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedParticipants: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
}

const ModelList = ({
  setModels,
  models = [],
  open,
  setOpen,
  setSelectedParticipants,
}: ModelListProps) => {
  const [records, setRecords] = useState<BpmnModel[]>([]);
  const [selectedRecords, setSelectedRecords] = useState<BpmnModel[]>([]);

  const handleRowSelection = useCallback(
    (indexes: number[]) => {
      const selected = records.filter((_, index) => indexes.includes(index));
      setSelectedRecords(selected);
    },
    [records],
  );

  const onSave = () => {
    const ids = selectedRecords.map(({ id }) => id);
    const idParams = ids?.join("-");
    setParam("id", String(idParams));
    setModels((models) => [...selectedRecords, ...models.filter(({ uploaded }) => uploaded)]);
    setSelectedParticipants((sp) => {
      const newParticipants: Record<string, string[]> = {};
      for (const [key, value] of Object.entries(sp)) {
        const numKey = Number(key);
        if (ids.includes(numKey) || isNaN(numKey)) {
          newParticipants[isNaN(numKey) ? key : String(numKey)] = Array.isArray(value)
            ? value
            : [value as unknown as string]; // safety: value type narrowing from union to string
        }
      }
      return newParticipants;
    });
    setSelectedRecords([]);
    setOpen(false);
  };

  const onCancel = () => {
    setSelectedRecords(models);
    setOpen(false);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getBPMModels();
        setRecords((data || []) as BpmnModel[]);
      } catch {
        // Error silently handled by design
      }
    };
    if (open) {
      void fetchData();
    }
  }, [open]);

  return (
    <Dialog size="xl" backdrop open={open}>
      <DialogHeader>
        <DialogTitle> {translate("BPMN Models")}</DialogTitle>
      </DialogHeader>
      <DialogContent>
        <Box p={2} style={{ maxHeight: "600px", overflow: "auto" }}>
          <DataGrid
            records={records as { id: string | number; [key: string]: unknown }[]}
            selectedRecords={models as { id: string | number; [key: string]: unknown }[]}
            columns={MODEL_GRID_COLUMNS}
            handleRowSelection={handleRowSelection}
          />
        </Box>
      </DialogContent>
      <DialogFooter>
        <Button variant="primary" size="sm" onClick={onSave}>
          {translate("Save")}
        </Button>
        <Button variant="secondary" size="sm" onClick={onCancel}>
          {translate("Cancel")}
        </Button>
      </DialogFooter>
    </Dialog>
  );
};

export default ModelList;
