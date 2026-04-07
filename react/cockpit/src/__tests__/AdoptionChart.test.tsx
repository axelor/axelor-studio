import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi } from "vitest";

// Mock echarts-for-react to avoid canvas rendering in jsdom
vi.mock("echarts-for-react/lib/core", () => ({
  default: (props: Record<string, unknown>) => (
    <div data-testid="echarts-mock" data-options={JSON.stringify(props.option)} />
  ),
}));

import { AdoptionChart } from "../components/widgets/AdoptionChart";

const createTestClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

describe("AdoptionChart", () => {
  it("renders chart container", async () => {
    const client = createTestClient();
    render(
      <QueryClientProvider client={client}>
        <AdoptionChart />
      </QueryClientProvider>,
    );

    // Should show loading initially via WidgetShell
    await waitFor(() => {
      expect(screen.getByTestId("adoption-chart")).toBeDefined();
    });
  });

  it("renders the ECharts component after data loads", async () => {
    const client = createTestClient();
    render(
      <QueryClientProvider client={client}>
        <AdoptionChart />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("echarts-mock")).toBeDefined();
    });
  });
});
