import { Box, DndProvider as GridProvider } from "@axelor/ui";
import { Grid } from "@axelor/ui/grid";
import { useEffect } from "react";

import useGridState from "./user-grideState";

interface GridRecord {
  id: number | string;
  [key: string]: unknown;
}

interface GridColumn {
  name: string;
  title: string;
  type?: string;
  width?: number;
}

interface DataGridProps {
  records: GridRecord[];
  columns: GridColumn[];
  handleRowSelection?: (indexes: number[]) => void;
  selectedRecords?: GridRecord[];
  setRecords?: React.Dispatch<React.SetStateAction<GridRecord[]>>;
}

export default function DataGrid({
  records,
  columns,
  handleRowSelection = () => {},
  selectedRecords = [],
}: DataGridProps) {
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
      .filter((index): index is number => index !== null && !isNaN(index));
    setState((draft) => {
      draft.selectedRows = selectedIndexes;
    });
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
          state={state as never}
          setState={setState as never}
        />
      </Box>
    </GridProvider>
  );
}
