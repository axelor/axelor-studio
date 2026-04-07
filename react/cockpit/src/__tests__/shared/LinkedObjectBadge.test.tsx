import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

import { LinkedObjectBadge, LinkedObjectList } from "../../components/shared/LinkedObjectBadge";
import type { LinkedObject } from "../../api/types";

const mockOpenView = vi.fn();

vi.mock("@studio/shared/bridge", () => ({
  axelorBridge: {
    translate: (key: string) => key,
    openView: (...args: unknown[]) => mockOpenView(...args),
  },
}));

const saleOrder: LinkedObject = {
  modelName: "SaleOrder",
  modelFullName: "com.axelor.sale.db.SaleOrder",
  recordId: 42,
  displayName: "SO-2024-042",
};

describe("LinkedObjectBadge", () => {
  it("renders model name badge and display name", () => {
    render(<LinkedObjectBadge linkedObject={saleOrder} />);
    expect(screen.getByText("SaleOrder")).toBeDefined();
    expect(screen.getByText("SO-2024-042")).toBeDefined();
  });

  it("calls axelorBridge.openView with correct params on click", () => {
    mockOpenView.mockClear();
    render(<LinkedObjectBadge linkedObject={saleOrder} />);
    fireEvent.click(screen.getByRole("button"));
    expect(mockOpenView).toHaveBeenCalledWith({
      model: "com.axelor.sale.db.SaleOrder",
      viewType: "form",
      context: { _showRecord: 42 },
    });
  });

  it("has a title attribute for accessibility", () => {
    render(<LinkedObjectBadge linkedObject={saleOrder} />);
    const button = screen.getByRole("button");
    expect(button.getAttribute("title")).toBe("SaleOrder: SO-2024-042");
  });
});

describe("LinkedObjectList", () => {
  it("renders multiple badges", () => {
    const objects: LinkedObject[] = [
      saleOrder,
      {
        modelName: "Invoice",
        modelFullName: "com.axelor.account.db.Invoice",
        recordId: 10,
        displayName: "INV-2024-010",
      },
    ];
    render(<LinkedObjectList linkedObjects={objects} />);
    expect(screen.getByText("SaleOrder")).toBeDefined();
    expect(screen.getByText("Invoice")).toBeDefined();
  });

  it("renders empty state when no linked objects", () => {
    render(<LinkedObjectList linkedObjects={[]} />);
    expect(screen.getByText("No linked objects")).toBeDefined();
  });
});
