import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect } from "vitest";
import { ProcessListTable } from "../../components/widgets/ProcessListTable";

const createTestClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

export function renderProcessList() {
  const client = createTestClient();
  return render(
    <QueryClientProvider client={client}>
      <ProcessListTable />
    </QueryClientProvider>,
  );
}

describe("ProcessList", () => {
  it("renders without crashing", () => {
    const { container } = renderProcessList();
    expect(container).toBeDefined();
  });
});
