import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, beforeEach } from "vitest";

import { ProcessListTable } from "../components/widgets/ProcessListTable";
import { useCockpitStore } from "../stores/useCockpitStore";

const createTestClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

function renderWithProviders() {
  const client = createTestClient();
  return render(
    <QueryClientProvider client={client}>
      <ProcessListTable />
    </QueryClientProvider>,
  );
}

describe("ProcessListTable", () => {
  beforeEach(() => {
    useCockpitStore.getState().reset();
  });

  it("renders the table element", async () => {
    renderWithProviders();
    // Table renders (may be loading initially)
    const table = await screen.findByRole("table");
    expect(table).toBeDefined();
  });

  it("renders search input", async () => {
    renderWithProviders();
    const searchInput = await screen.findByPlaceholderText("Search processes...");
    expect(searchInput).toBeDefined();
  });

  it("renders column headers", async () => {
    renderWithProviders();
    // Wait for MSW to respond and table to populate
    const nameHeader = await screen.findByText("Name");
    expect(nameHeader).toBeDefined();
    expect(screen.getByText("KPI: Time")).toBeDefined();
    expect(screen.getByText("KPI: Quality")).toBeDefined();
  });

  it("renders process rows from MSW mock data", async () => {
    renderWithProviders();
    // MSW handlers return 3 mock processes
    const orderProcess = await screen.findByText("Order Process", {}, { timeout: 3000 });
    expect(orderProcess).toBeDefined();
    expect(screen.getByText("Invoice Process")).toBeDefined();
    expect(screen.getByText("Leave Request")).toBeDefined();
  });

  it("renders KPI badges in table cells", async () => {
    renderWithProviders();
    // Wait for data to load -- KPI displayValues from MSW mock
    const badge = await screen.findByText("4h 12m", {}, { timeout: 3000 });
    expect(badge).toBeDefined();
  });
});
