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
import DataGrid from "../../components/DataGrid";
import { getBPMModels } from "../../services/api";
import { setParam, translate } from "../../utils";
import { MODEL_GRID_COLUMNS } from "../../Constants";

const ModelList = ({ setModels, models = [], open, setOpen,setSelectedParticipants }) => {
  const [records, setRecords] = useState([]);
  const [selectedRecords, setSelectedRecords] = useState([]);

  const handleRowSelection = useCallback(
    (indexes) => {
      const selected = records.filter((_, index) => indexes.includes(index));
      setSelectedRecords(selected);
    },
    [records]
  );

  const onSave = () => {
    const ids = selectedRecords.map(({ id }) => id)
    const idParams=ids?.join("-");
    setParam("id", idParams);
    setModels((models) => [
      ...selectedRecords,
      ...models.filter(({ uploaded }) => uploaded),
    ]);
    setSelectedParticipants((sp) => {
      const newParticipants = Object.entries(sp)
        .filter(([key, value]) => ids.includes(Number(key)) || isNaN(Number(key)))
        .reduce((acc, [key, value]) => {
          const numKey = Number(key);
          acc[isNaN(numKey) ? key : numKey] = Array.isArray(value) ? value : [value];
          return acc;
        }, {});
    
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
        setRecords(data || []);
      } catch (error) {
        console.error("Error fetching BPM models:", error);
      }
    };
    if (open) {
      fetchData();
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
            records={records}
            setRecords={setRecords}
            selectedRecords={models}
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
