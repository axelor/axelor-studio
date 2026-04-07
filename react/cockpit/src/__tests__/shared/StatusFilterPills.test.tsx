import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

import { StatusFilterPills } from "../../components/shared/StatusFilterPills";
import type { InstanceCountsResponse } from "../../api/types";

vi.mock("@studio/shared/bridge", () => ({
  axelorBridge: {
    translate: (key: string) => key,
    openView: vi.fn(),
  },
}));

const mockCounts: InstanceCountsResponse = {
  running: 42,
  completed: 318,
  failed: 7,
  suspended: 3,
};

describe("StatusFilterPills", () => {
  it("renders all 5 pills (All, Running, Completed, Failed, Suspended)", () => {
    render(
      <StatusFilterPills
        counts={mockCounts}
        activeFilter={null}
        onFilterChange={() => {}}
      />,
    );
    expect(screen.getByText("All")).toBeDefined();
    expect(screen.getByText("Running")).toBeDefined();
    expect(screen.getByText("Completed")).toBeDefined();
    expect(screen.getByText("Failed")).toBeDefined();
    expect(screen.getByText("Suspended")).toBeDefined();
  });

  it("shows counts on status pills", () => {
    render(
      <StatusFilterPills
        counts={mockCounts}
        activeFilter={null}
        onFilterChange={() => {}}
      />,
    );
    expect(screen.getByText("42")).toBeDefined();
    expect(screen.getByText("318")).toBeDefined();
    expect(screen.getByText("7")).toBeDefined();
    expect(screen.getByText("3")).toBeDefined();
  });

  it("marks active pill with aria-pressed='true'", () => {
    render(
      <StatusFilterPills
        counts={mockCounts}
        activeFilter="ACTIVE"
        onFilterChange={() => {}}
      />,
    );
    const runningPill = screen.getByText("Running").closest("button")!;
    expect(runningPill.getAttribute("aria-pressed")).toBe("true");

    const allPill = screen.getByText("All").closest("button")!;
    expect(allPill.getAttribute("aria-pressed")).toBe("false");
  });

  it("calls onFilterChange with correct status when pill is clicked", () => {
    const onFilterChange = vi.fn();
    render(
      <StatusFilterPills
        counts={mockCounts}
        activeFilter={null}
        onFilterChange={onFilterChange}
      />,
    );
    fireEvent.click(screen.getByText("Running").closest("button")!);
    expect(onFilterChange).toHaveBeenCalledWith("ACTIVE");
  });

  it("calls onFilterChange(null) when 'All' is clicked", () => {
    const onFilterChange = vi.fn();
    render(
      <StatusFilterPills
        counts={mockCounts}
        activeFilter="ACTIVE"
        onFilterChange={onFilterChange}
      />,
    );
    fireEvent.click(screen.getByText("All").closest("button")!);
    expect(onFilterChange).toHaveBeenCalledWith(null);
  });
});
