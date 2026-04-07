import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

import { createSnackbarStore } from "../../stores/createSnackbarStore";

// Mock the Alert component
vi.mock("../Alert.jsx", () => ({
  AlertComponent: ({ open, message, messageType, onClose }) => (
    <div data-testid="alert" data-open={open} data-message={message} data-type={messageType}>
      <button data-testid="alert-close" onClick={onClose}>
        close
      </button>
    </div>
  ),
}));

import { SnackbarNotification } from "../SnackbarNotification";

describe("SnackbarNotification", () => {
  let store;

  beforeEach(() => {
    store = createSnackbarStore();
  });

  it("renders nothing when store.open is false", () => {
    const { container } = render(<SnackbarNotification store={store} onClose={vi.fn()} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders Alert with correct props when store.open is true", () => {
    store.getState().show("success", "Saved successfully");

    render(<SnackbarNotification store={store} onClose={vi.fn()} />);

    const alert = screen.getByTestId("alert");
    expect(alert).toBeInTheDocument();
    expect(alert.dataset.open).toBe("true");
    expect(alert.dataset.message).toBe("Saved successfully");
    expect(alert.dataset.type).toBe("success");
  });

  it("calls onClose when Alert close is triggered", () => {
    store.getState().show("danger", "Error");
    const onClose = vi.fn();

    render(<SnackbarNotification store={store} onClose={onClose} />);

    screen.getByTestId("alert-close").click();
    expect(onClose).toHaveBeenCalledOnce();
  });
});
