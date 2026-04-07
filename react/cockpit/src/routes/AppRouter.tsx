import { createHashRouter, RouterProvider, Navigate } from "react-router-dom";
import { AppShell } from "./AppShell";
import { DashboardPage } from "./DashboardPage";
import { ProcessListPage } from "./ProcessListPage";
import { ProcessDetailPage } from "./ProcessDetailPage";
import { InstanceDetailPage } from "./InstanceDetailPage";

// ---------------------------------------------------------------------------
// Router (D-09, D-10: HashRouter for iframe-safe URL navigation)
// ---------------------------------------------------------------------------

const router = createHashRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: <DashboardPage /> },
      { path: "process", element: <ProcessListPage /> },
      { path: "process/:processId", element: <ProcessDetailPage /> },
      {
        path: "process/:processId/instance/:instanceId",
        element: <InstanceDetailPage />,
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
