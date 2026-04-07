import { CockpitLayout } from "../components/layout/CockpitLayout";

/**
 * Dashboard route: wraps the existing Phase 50 CockpitLayout.
 * This keeps the grid-based widget dashboard intact as a route target.
 */
export function DashboardPage() {
  return <CockpitLayout />;
}
