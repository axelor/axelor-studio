/**
 * Regression guard: property panel components must route script entries to CodeEditor.
 *
 * Root cause: during Phase 15-16 Shared Promotion, the Textbox, TextField,
 * and Table components were re-created as clean TypeScript versions in
 * @studio/shared, but the CodeEditor routing for script entries was lost.
 * The BPM barrel (index.ts) re-exports from shared, so the BPM-local versions
 * with CodeEditor were silently orphaned.
 *
 * These tests verify the BEHAVIOR: when a component should render CodeEditor,
 * it actually does — not a plain textarea/input.
 */
import { describe, it, expect, vi } from "vitest";
import {  render, screen } from "@testing-library/react";
import React from "react";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@axelor/ui", () => ({
  Input: React.forwardRef(function MockInput(
    props: React.InputHTMLAttributes<HTMLTextAreaElement> & {
      as?: string;
      invalid?: boolean;
      flex?: string;
    },
    ref: React.Ref<HTMLTextAreaElement>,
  ) {
    const { as, invalid: _invalid, flex: _flex, ...rest } = props;
    if (as === "textarea")
      return <textarea ref={ref} data-testid="plain-textarea" {...(rest as any)} />;
    return <input ref={ref as any} data-testid="plain-input" {...(rest as any)} />;
  }),
  InputLabel: (props: any) => <label {...props} />,
  Box: (props: any) => <div {...props} />,
  Button: (props: any) => (
    <button data-testid={`button-${props.children?.props?.icon || "unknown"}`} {...props} />
  ),
  clsx: (...args: any[]) => args.filter(Boolean).join(" "),
  TextField: React.forwardRef((props: any, ref: any) => (
    <input ref={ref} data-testid="axelor-textfield" defaultValue={props.defaultValue} {...props} />
  )),
  Table: (props: any) => <table {...props} />,
  TableBody: (props: any) => <tbody {...props} />,
  TableHead: (props: any) => <thead {...props} />,
  TableRow: (props: any) => <tr {...props} />,
  TableCell: (props: any) => <td {...props} />,
}));

vi.mock("@axelor/ui/icons/material-icon", () => ({
  MaterialIcon: (props: any) => (
    <span data-testid={`icon-${props.icon}`} data-icon={props.icon} />
  ),
}));

vi.mock("../CodeEditor", () => ({
  CodeEditor: (props: any) => (
    <div data-testid="code-editor" data-value={props.value} data-language={props.language} />
  ),
  isMonacoReady: () => true,
  markMonacoReady: () => {},
}));

vi.mock("../AlertDialog", () => ({
  AlertDialog: (props: any) =>
    props.openAlert ? <div data-testid="alert-dialog">{props.children}</div> : null,
}));

vi.mock("../IconButton", () => ({
  default: (props: any) => <button data-testid="icon-button" {...props} />,
}));

vi.mock("../Description", () => ({ Description: () => null }));
vi.mock("../../i18n/index", () => ({ translate: (s: string) => s }));
vi.mock("../properties/textbox.module.css", () => ({ default: {} }));
vi.mock("../properties/textfield.module.css", () => ({ default: {} }));
vi.mock("../properties/table.module.css", () => ({ default: {} }));

// ---------------------------------------------------------------------------
// 1. Textbox
// ---------------------------------------------------------------------------
describe("Textbox — script entry routes to CodeEditor", () => {
  it('renders CodeEditor when entry.id === "script"', async () => {
    const { default: Textbox } = await import("../properties/Textbox");
    render(
      <Textbox
        entry={{ id: "script", modelProperty: "script", get: () => ({ script: "def x = 1" }) }}
        element={{} as any}
        defaultHeight={500}
      />,
    );
    expect(screen.getByTestId("code-editor")).toBeInTheDocument();
    expect(screen.queryByTestId("plain-textarea")).toBeNull();
  });

  it('renders plain textarea when entry.id !== "script"', async () => {
    const { default: Textbox } = await import("../properties/Textbox");
    render(
      <Textbox
        entry={{ id: "name", modelProperty: "name", get: () => ({ name: "test" }) }}
        element={{} as any}
      />,
    );
    expect(screen.getByTestId("plain-textarea")).toBeInTheDocument();
    expect(screen.queryByTestId("code-editor")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 2. TextField
// ---------------------------------------------------------------------------
describe("TextField — isScript prop enables code editor button + modal", () => {
  it("renders a code button when isScript is true", async () => {
    const { default: TextField } = await import("../properties/TextField");
    render(
      <TextField
        entry={{ modelProperty: "script", get: () => ({ script: "" }) }}
        element={{} as any}
        isScript={true}
        language="groovy"
      />,
    );
    expect(screen.getByTestId("icon-code")).toBeInTheDocument();
  });

  it("does NOT render a code button when isScript is false/absent", async () => {
    const { default: TextField } = await import("../properties/TextField");
    render(
      <TextField
        entry={{ modelProperty: "name", get: () => ({ name: "" }) }}
        element={{} as any}
      />,
    );
    expect(screen.queryByTestId("icon-code")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 3. Table
// ---------------------------------------------------------------------------
describe("Table — value cells have code editor button for non-first columns", () => {
  it("renders code editor icon button in value cells (index > 0)", async () => {
    const { default: Table } = await import("../properties/Table");
    render(
      <Table
        entry={{
          id: "test",
          addLabel: "Add",
          labels: ["Key", "Value"],
          modelProperties: ["key", "value"],
          getElements: () => [{ key: "k1", value: "v1" }],
          addElement: vi.fn(),
          removeElement: vi.fn(),
          updateElement: vi.fn(),
        }}
      />,
    );
    // The value column (index=1 > 0) should have a code editor icon
    expect(screen.getByTestId("icon-code")).toBeInTheDocument();
  });

  it("does NOT render code editor icon for the first column (index === 0)", async () => {
    const { default: Table } = await import("../properties/Table");
    render(
      <Table
        entry={{
          id: "test",
          addLabel: "Add",
          labels: ["Only"],
          modelProperties: ["only"],
          getElements: () => [{ only: "val" }],
          addElement: vi.fn(),
          removeElement: vi.fn(),
          updateElement: vi.fn(),
        }}
      />,
    );
    // Single column (index=0) should NOT have code editor icon
    expect(screen.queryByTestId("icon-code")).toBeNull();
  });
});
