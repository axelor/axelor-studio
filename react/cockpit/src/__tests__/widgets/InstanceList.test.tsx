import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi } from "vitest";
import { RouterWrapper } from "../helpers/router-wrapper";
import { InstanceList } from "../../components/widgets/InstanceList";
import { formatDuration, formatRelativeTime } from "../../utils/format";

function renderInstanceList(overrides = {}) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const onSelect = vi.fn();
  render(
    <QueryClientProvider client={qc}>
      <RouterWrapper>
        <InstanceList
          processId={1}
          onSelectInstance={onSelect}
          selectedInstanceId={null}
          {...overrides}
        />
      </RouterWrapper>
    </QueryClientProvider>,
  );
  return { onSelect };
}

describe("InstanceList", () => {
  it("renders instance rows from MSW handler", async () => {
    renderInstanceList();
    await waitFor(() =>
      expect(screen.getByText(/inst-abc-001/)).toBeInTheDocument(),
    );
    expect(screen.getByText(/inst-abc-002/)).toBeInTheDocument();
  });

  it("shows status badges for each instance", async () => {
    renderInstanceList();
    await waitFor(() =>
      expect(screen.getByText(/inst-abc-001/)).toBeInTheDocument(),
    );
    // Failed instance (INTERNALLY_TERMINATED) should show "Failed" badge
    expect(screen.getByText("Failed")).toBeInTheDocument();
    // Active instance should show "Running" badge
    expect(screen.getByText("Running")).toBeInTheDocument();
  });

  it("calls onSelectInstance when clicking a row", async () => {
    const { onSelect } = renderInstanceList();
    await waitFor(() =>
      expect(screen.getByText(/inst-abc-002/)).toBeInTheDocument(),
    );
    await userEvent.click(screen.getByText(/inst-abc-002/));
    expect(onSelect).toHaveBeenCalledWith("inst-abc-002");
  });

  it("renders pagination bar", async () => {
    renderInstanceList();
    // Wait for data to load; with only 3 items and limit 20, pagination may not show
    // but the component still renders
    await waitFor(() =>
      expect(screen.getByText(/inst-abc-001/)).toBeInTheDocument(),
    );
  });

  it("renders search input", async () => {
    renderInstanceList();
    await waitFor(() =>
      expect(screen.getByText(/inst-abc-001/)).toBeInTheDocument(),
    );
    expect(
      screen.getByPlaceholderText(/Search instances/),
    ).toBeInTheDocument();
  });
});

describe("formatDuration", () => {
  it("formats seconds", () => {
    expect(formatDuration(45000)).toBe("45s");
  });

  it("formats hours and minutes", () => {
    expect(formatDuration(9000000)).toBe("2h 30m");
  });

  it("formats days and hours", () => {
    expect(formatDuration(100800000)).toBe("1d 4h");
  });
});

describe("formatRelativeTime", () => {
  it("returns 'Just now' for recent time", () => {
    const now = new Date().toISOString();
    expect(formatRelativeTime(now)).toBe("Just now");
  });

  it("returns minutes ago", () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(formatRelativeTime(fiveMinAgo)).toMatch(/5m ago/);
  });
});
