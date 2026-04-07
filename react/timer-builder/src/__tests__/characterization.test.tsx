/// <reference types="@testing-library/jest-dom" />
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

// Mock shared module (Service replacement)
vi.mock("@studio/shared/services", () => ({
  ServiceInstance: {
    info: vi.fn(() => Promise.resolve({ user: { lang: "en" } })),
  },
}));

// Mock @sbzen/re-cron -- it requires Bootstrap DOM that jsdom cannot handle
vi.mock("@sbzen/re-cron", () => ({
  ReQuartzCron: (_props: Record<string, unknown>) => <div data-testid="re-cron" />,
}));

// Mock Bootstrap CSS import
vi.mock("bootstrap/dist/css/bootstrap.min.css", () => ({}));

// Mock CSS modules
vi.mock("../App.module.css", () => ({
  default: {
    tabs: "tabs",
    dialogTitle: "dialogTitle",
    dialogContent: "dialogContent",
    dialogActions: "dialogActions",
    button: "button",
  },
}));

vi.mock("../ReCron.css", () => ({}));

import App from "../App";

describe("App component characterization tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders in standalone mode with timerDefinitionType=cron", async () => {
    const { container } = render(<App timerDefinitionType="cron" open={true} value={undefined} />);

    await waitFor(() => {
      const appDiv = container.querySelector(".App");
      expect(appDiv).toBeInTheDocument();
    });

    // Cron tab renders the ReQuartzCron component (mocked with data-testid)
    expect(screen.getByTestId("re-cron")).toBeInTheDocument();

    // Cron expression initial value rendered
    expect(container.textContent).toContain("* * * ? * * *");
  });

  it("renders with timerDefinitionType=timeCycle showing ISO8601 and Cron tabs", async () => {
    const { container } = render(
      <App timerDefinitionType="timeCycle" open={true} value={undefined} />,
    );

    await waitFor(() => {
      const appDiv = container.querySelector(".App");
      expect(appDiv).toBeInTheDocument();
    });

    // timeCycle shows ISO8601 (with Repeat) as first tab and Cron as second tab
    // ISO8601 with repeat shows the repeat field and ISO duration fields
    expect(container.textContent).toContain("Repeat");
    expect(container.textContent).toContain("Years");
    expect(container.textContent).toContain("Months");
    expect(container.textContent).toContain("Hours");
  });

  it("renders with timerDefinitionType=timeDuration showing ISO8601 tab only", async () => {
    const { container } = render(
      <App timerDefinitionType="timeDuration" open={true} value={undefined} />,
    );

    await waitFor(() => {
      const appDiv = container.querySelector(".App");
      expect(appDiv).toBeInTheDocument();
    });

    // timeDuration shows ISO8601 without repeat -- has duration fields but no repeat
    expect(container.textContent).toContain("Years");
    expect(container.textContent).toContain("Hours");
    // No cron component
    expect(screen.queryByTestId("re-cron")).not.toBeInTheDocument();
  });

  it("renders in dialog mode when isDialog=true", async () => {
    const { container } = render(
      <App timerDefinitionType="cron" isDialog={true} open={true} value={undefined} />,
    );

    // Dialog mode should NOT render div.App
    await waitFor(() => {
      const appDiv = container.querySelector(".App");
      expect(appDiv).not.toBeInTheDocument();
    });
  });

  it("calls Service.info() on mount to get user language", async () => {
    const { ServiceInstance } = await import("@studio/shared/services");

    render(<App timerDefinitionType="cron" open={true} value={undefined} />);

    await waitFor(() => {
      // eslint-disable-next-line @typescript-eslint/unbound-method -- vitest spy assertion pattern
      expect(ServiceInstance.info).toHaveBeenCalled();
    });
  });
});
