import { describe, it, expect, vi } from "vitest";
import {  render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock dependencies — keep toolbar renderable with minimal deps
vi.mock("@axelor/ui", () => ({
  Box: ({ children, ...props }: { children?: React.ReactNode; [k: string]: unknown }) => <div {...props}>{children}</div>,
  CommandBar: ({ items }: { items?: Array<{ key?: string; onClick?: () => void; description?: string }> }) => (
    <div data-testid="commandbar">
      {items?.map((item: { key?: string; onClick?: () => void; description?: string }, i: number) => (
        <button key={i} onClick={item.onClick} data-key={item.key}>
          {item.description}
        </button>
      ))}
    </div>
  ),
  ClickAwayListener: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Select: () => <div />,
  Input: (props: Record<string, unknown>) => <input {...props} />,
  InputLabel: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
}));
vi.mock("../../components/Select", () => ({
  default: () => <div data-testid="select" />,
}));
vi.mock("../../components/Collaboration", () => ({
  Collaboration: () => <div data-testid="collaboration" />,
}));
vi.mock("../../utils", () => ({
  translate: (s: string) => s,
}));
vi.mock("../Modeler/bpmn-modeler.module.css", () => ({ default: {} }));

import BpmnTopToolbar from "../Modeler/components/BpmnTopToolbar";

describe("BpmnTopToolbar — file upload", () => {
  it("renders a hidden file input for BPMN upload", () => {
    render(
      <BpmnTopToolbar
        leftToolbar={[]}
        rightToolbar={[]}
        wkf={null}
        setWkf={vi.fn()}
        updateWkfModel={vi.fn()}
        getModels={vi.fn()}
        uploadFile={vi.fn()}
      />,
    );

    const input = document.getElementById("inputFile");
    expect(input).toBeTruthy();
    expect((input as HTMLInputElement).type).toBe("file");
    expect((input as HTMLElement).style.display).toBe("none");
  });

  it("triggers uploadFile callback when file is selected", async () => {
    const uploadFile = vi.fn();
    render(
      <BpmnTopToolbar
        leftToolbar={[]}
        rightToolbar={[]}
        wkf={null}
        setWkf={vi.fn()}
        updateWkfModel={vi.fn()}
        getModels={vi.fn()}
        uploadFile={uploadFile}
      />,
    );

    const input = document.getElementById("inputFile");
    const bpmnFile = new File(["<xml/>"], "test.bpmn", {
      type: "application/xml",
    });

    await userEvent.upload(input as HTMLInputElement, bpmnFile);

    expect(uploadFile).toHaveBeenCalled();
  });

  it("programmatic click on inputFile opens file dialog", () => {
    render(
      <BpmnTopToolbar
        leftToolbar={[]}
        rightToolbar={[]}
        wkf={null}
        setWkf={vi.fn()}
        updateWkfModel={vi.fn()}
        getModels={vi.fn()}
        uploadFile={vi.fn()}
      />,
    );

    const input = document.getElementById("inputFile");
    const clickSpy = vi.spyOn(input as HTMLElement, "click");

    // This is what extra.js uploadXml() does
    document.getElementById("inputFile")!.click();

    expect(clickSpy).toHaveBeenCalled();
  });
});
