import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";

import { useAlert } from "../hooks/useAlert";
import { useConfirmation } from "../hooks/useConfirmation";
import { useTab } from "../hooks/useTabChange";

describe("context hooks — error boundaries", () => {
  it("useAlert throws when used outside AlertProvider", () => {
    expect(() => renderHook(() => useAlert())).toThrow(
      "useAlert must be used within AlertProvider",
    );
  });

  it("useConfirmation throws when used outside ConfirmationDialogProvider", () => {
    expect(() => renderHook(() => useConfirmation())).toThrow(
      "useConfirmation must be used within ConfirmationDialogProvider",
    );
  });

  it("useTab throws when used outside TabProvider", () => {
    expect(() => renderHook(() => useTab())).toThrow(
      "useTab must be used within TabProvider",
    );
  });
});
