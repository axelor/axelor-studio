import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act, fireEvent } from "@testing-library/react";
import React from "react";

// ---------------------------------------------------------------------------
// Module-level mocks
// ---------------------------------------------------------------------------

vi.mock("@axelor/ui", () => ({
  Input: React.forwardRef(function MockInput(
    props: React.InputHTMLAttributes<HTMLTextAreaElement> & { as?: string },
    ref: React.Ref<HTMLTextAreaElement>,
  ) {
    const { as, ...rest } = props;
    if (as === "textarea")
      return (
        <textarea ref={ref} {...(rest as React.TextareaHTMLAttributes<HTMLTextAreaElement>)} />
      );
    return (
      <input
        ref={ref as React.Ref<HTMLInputElement>}
        {...(rest as React.InputHTMLAttributes<HTMLInputElement>)}
      />
    );
  }),
}));

vi.mock("@monaco-editor/react", () => ({
  loader: { config: vi.fn() },
  default: function MockEditor(props: Record<string, unknown>) {
    return <div data-testid="monaco-editor" data-value={props.value as string} />;
  },
}));

vi.mock("../CodeEditor/code-editor.module.css", () => ({
  default: {
    editorContainer: "",
    editorError: "",
    resizableWrapper: "",
    fallbackContainer: "",
    loadingIndicator: "",
  },
}));

// ---------------------------------------------------------------------------
// 1. TextareaFallback — renders a functional textarea
// ---------------------------------------------------------------------------
describe("TextareaFallback", () => {
  let TextareaFallback: typeof import("../CodeEditor/TextareaFallback").TextareaFallback;

  beforeEach(async () => {
    ({ TextareaFallback } = await import("../CodeEditor/TextareaFallback"));
  });

  it("renders a textarea with the provided value", () => {
    render(<TextareaFallback value="def x = 42" onChange={vi.fn()} />);
    expect(screen.getByRole<HTMLTextAreaElement>("textbox").value).toBe("def x = 42");
  });

  it("calls onChange when the user types", () => {
    const onChange = vi.fn();
    render(<TextareaFallback value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "new" } });
    expect(onChange).toHaveBeenCalledWith("new");
  });

  it("respects readOnly", () => {
    render(<TextareaFallback value="locked" onChange={vi.fn()} readOnly />);
    expect(screen.getByRole<HTMLTextAreaElement>("textbox").readOnly).toBe(true);
  });

  it("applies height", () => {
    const { container } = render(<TextareaFallback value="" onChange={vi.fn()} height={400} />);
    expect((container.firstElementChild as HTMLElement).style.height).toBe("400px");
  });
});

// ---------------------------------------------------------------------------
// 2. MonacoContext — markMonacoReady / isMonacoReady
// ---------------------------------------------------------------------------
describe("MonacoContext", () => {
  let markMonacoReady: typeof import("../CodeEditor/MonacoContext").markMonacoReady;
  let isMonacoReady: typeof import("../CodeEditor/MonacoContext").isMonacoReady;
  let _resetMonacoReady: typeof import("../CodeEditor/MonacoContext")._resetMonacoReady;

  beforeEach(async () => {
    const mod = await import("../CodeEditor/MonacoContext");
    markMonacoReady = mod.markMonacoReady;
    isMonacoReady = mod.isMonacoReady;
    _resetMonacoReady = mod._resetMonacoReady;
    _resetMonacoReady();
  });

  it("starts as not ready", () => {
    expect(isMonacoReady()).toBe(false);
  });

  it("becomes ready after markMonacoReady()", () => {
    markMonacoReady();
    expect(isMonacoReady()).toBe(true);
  });

  it("is idempotent — calling markMonacoReady twice is safe", () => {
    markMonacoReady();
    markMonacoReady();
    expect(isMonacoReady()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 3. CodeEditor — renders Monaco when ready, textarea when not
// ---------------------------------------------------------------------------
describe("CodeEditor", () => {
  let _resetMonacoReady: typeof import("../CodeEditor/MonacoContext")._resetMonacoReady;
  let markMonacoReady: typeof import("../CodeEditor/MonacoContext").markMonacoReady;

  beforeEach(async () => {
    const ctx = await import("../CodeEditor/MonacoContext");
    _resetMonacoReady = ctx._resetMonacoReady;
    markMonacoReady = ctx.markMonacoReady;
  });

  afterEach(() => {
    _resetMonacoReady();
  });

  it("renders TextareaFallback when Monaco is NOT configured", async () => {
    _resetMonacoReady(); // ensure not ready
    const { CodeEditor } = await import("../CodeEditor/CodeEditor");

    render(<CodeEditor value="no monaco" onChange={vi.fn()} />);

    const textarea = screen.getByRole("textbox");
    expect((textarea as HTMLTextAreaElement).value).toBe("no monaco");
    expect(screen.queryByTestId("monaco-editor")).toBeNull();
  });

  it("renders Monaco editor when Monaco IS configured", async () => {
    markMonacoReady();
    const { CodeEditor } = await import("../CodeEditor/CodeEditor");

    await act(async () => {
      render(<CodeEditor value="def x = 1" onChange={vi.fn()} />);
    });

    await waitFor(() => {
      expect(screen.getByTestId("monaco-editor")).toBeInTheDocument();
    });
    expect(screen.getByTestId("monaco-editor").getAttribute("data-value")).toBe("def x = 1");
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("textarea fallback is NOT an error state — it is the intended behavior without Monaco", async () => {
    _resetMonacoReady();
    // This test documents the design contract: apps that don't configure
    // Monaco get a functional textarea. This is intentional, not a bug.
    const { CodeEditor } = await import("../CodeEditor/CodeEditor");
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(<CodeEditor value="just a textarea" onChange={vi.fn()} />);

    // No error should be logged — textarea is the expected behavior
    const monacoErrors = consoleSpy.mock.calls.filter(
      (c) => String(c[0]).includes("Monaco") || String(c[0]).includes("CodeEditor"),
    );
    expect(monacoErrors).toHaveLength(0);
    consoleSpy.mockRestore();
  });
});
