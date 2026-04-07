import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi } from "vitest";

// Mock echarts-for-react to avoid canvas rendering in jsdom
vi.mock("echarts-for-react/lib/core", () => ({
  default: (props: Record<string, unknown>) => (
    <div data-testid="echarts-mock" data-options={JSON.stringify(props.option)} />
  ),
}));

import { TaskStatsWidget } from "../components/widgets/TaskStatsWidget";

const createTestClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

describe("TaskStatsWidget", () => {
  it("renders 3 counter labels", async () => {
    const client = createTestClient();
    render(
      <QueryClientProvider client={client}>
        <TaskStatsWidget />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Due today")).toBeDefined();
      expect(screen.getByText("Upcoming")).toBeDefined();
      expect(screen.getByText("Overdue")).toBeDefined();
    });
  });

  it("renders pie chart container after data loads", async () => {
    const client = createTestClient();
    render(
      <QueryClientProvider client={client}>
        <TaskStatsWidget />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("status-pie-chart")).toBeDefined();
    });
  });
});
