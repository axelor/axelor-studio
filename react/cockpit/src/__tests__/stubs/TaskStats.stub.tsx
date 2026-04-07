import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect } from "vitest";
import { TaskStatsWidget } from "../../components/widgets/TaskStatsWidget";

const createTestClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

export function renderTaskStats() {
  const client = createTestClient();
  return render(
    <QueryClientProvider client={client}>
      <TaskStatsWidget />
    </QueryClientProvider>,
  );
}

describe("TaskStats", () => {
  it("renders without crashing", () => {
    const { container } = renderTaskStats();
    expect(container).toBeDefined();
  });
});
