import { Outlet } from "react-router-dom";
import { CockpitSidebar } from "../components/layout/CockpitSidebar";
import { CockpitToolbar } from "../components/layout/CockpitToolbar";
import { Breadcrumbs } from "../components/shared/Breadcrumbs";

/**
 * Application shell: sidebar + toolbar + breadcrumbs + route outlet.
 * Persistent across all routes; the Outlet swaps child content.
 */
export function AppShell() {
  return (
    <>
      <CockpitSidebar />
      <main
        style={{
          marginLeft: "var(--ck-sidebar-width)",
          display: "flex",
          flexDirection: "column",
          height: "100vh",
        }}
      >
        <CockpitToolbar />
        <Breadcrumbs />
        <div style={{ flex: 1, overflow: "auto" }}>
          <Outlet />
        </div>
      </main>
    </>
  );
}
