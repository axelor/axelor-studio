/**
 * Process List Page — full-width process table with search.
 * Accessed via sidebar "Processus" button (route: /process).
 * Clicking a row navigates to /process/:id (ProcessDetailPage).
 */

import { ProcessListTable } from "../components/widgets/ProcessListTable";

export function ProcessListPage() {
  return (
    <div style={{ padding: "var(--ck-space-md)", height: "100%" }}>
      <ProcessListTable />
    </div>
  );
}
