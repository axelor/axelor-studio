import useGridState from "./user-grideState";
import { Box, DndProvider as GridProvider } from "@axelor/ui";
import { Grid } from "@axelor/ui/grid";
import { useEffect } from "react";

export default function DataGrid({
  records,
  columns,
  handleRowSelection = () => {},
  selectedRecords = [],
}) {
  const [state, setState] = useGridState();
  useEffect(() => {
    const selectedIds = selectedRecords.map((r) => r.id);
    const selectedIndexes = records
      ?.map(({ id }, index) => {
        if (selectedIds?.includes(id)) {
          return index;
        } else {
          return null;
        }
      })
      .filter((index) => index !== null && !isNaN(index));
    setState((data) => ({ ...data, selectedRows: selectedIndexes }));
  }, [records, selectedRecords, setState]);

  return (
    <GridProvider>
      <Box>
        <Grid
          allowSelection
          allowCheckboxSelection
          selectionType={"multiple"}
          onRowSelectionChange={handleRowSelection}
          records={records}
          columns={columns}
          state={state}
          setState={setState}
        />
      </Box>
    </GridProvider>
  );
}
