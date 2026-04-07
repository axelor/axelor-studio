import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect } from "vitest";
import { AdoptionChart } from "../../components/widgets/AdoptionChart";

const createTestClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

export function renderAdoptionOverview() {
  const client = createTestClient();
  return render(
    <QueryClientProvider client={client}>
      <AdoptionChart />
    </QueryClientProvider>,
  );
}

describe("AdoptionOverview", () => {
  it("renders without crashing", () => {
    const { container } = renderAdoptionOverview();
    expect(container).toBeDefined();
  });
});
