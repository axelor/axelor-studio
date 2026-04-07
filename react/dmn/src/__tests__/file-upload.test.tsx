import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock dependencies
vi.mock("@axelor/ui", () => ({
  Box: ({ children, ...props }: { children?: React.ReactNode; [k: string]: unknown }) => <div {...props}>{children}</div>,
  CommandBar: ({ items: _items }: { items?: unknown[] }) => <div data-testid="commandbar" />,
  Input: (props: Record<string, unknown>) => <input {...props} />,
  Dialog: ({ children, open }: { children?: React.ReactNode; open?: boolean }) => (open ? <div>{children}</div> : null),
  DialogHeader: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  DialogContent: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  DialogFooter: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Button: ({ children, onClick, ...props }: { children?: React.ReactNode; onClick?: () => void; [k: string]: unknown }) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
  InputLabel: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
}));
vi.mock("@studio/shared/components", () => ({
  Select: () => <div data-testid="select" />,
  Logo: () => <div data-testid="logo" />,
  Tooltip: ({ children, title }: { children?: React.ReactNode; title?: string }) => <div title={title}>{children}</div>,
}));
vi.mock("@studio/shared/i18n", () => ({
  translate: (s: string) => s,
}));
vi.mock("@studio/shared/services", () => ({
  getWkfDMNModels: vi.fn(),
}));
vi.mock("../DMNModeler", () => ({
  defaultDMNDiagram: "<xml/>",
}));
vi.mock("../dmn-modeler.module.css", () => ({ default: {} }));
vi.mock("@axelor/ui/icons/bootstrap-icon", () => ({
  BootstrapIcon: ({ icon }: { icon?: string }) => <span data-testid={`icon-${icon}`} />,
}));
vi.mock("@studio/shared/theme", () => ({
  useAppTheme: () => ({ theme: "light" }),
}));

import DmnTopToolbar from "../components/DmnTopToolbar";
import DmnUploadDialog from "../components/DmnUploadDialog";

describe("DmnTopToolbar — file upload", () => {
  it("renders a hidden file input for DMN upload", () => {
    render(
      <DmnTopToolbar
        leftToolbar={[]}
        rightToolbar={[]}
        wkfModel={null}
        setWkfModel={vi.fn()}
        setId={vi.fn()}
        openDiagram={vi.fn()}
        handleViewDRD={vi.fn()}
        selectedElement={null}
        uploadFile={vi.fn()}
        handleDRDClick={vi.fn()}
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
      <DmnTopToolbar
        leftToolbar={[]}
        rightToolbar={[]}
        wkfModel={null}
        setWkfModel={vi.fn()}
        setId={vi.fn()}
        openDiagram={vi.fn()}
        handleViewDRD={vi.fn()}
        selectedElement={null}
        uploadFile={uploadFile}
        handleDRDClick={vi.fn()}
      />,
    );

    const input = document.getElementById("inputFile");
    const dmnFile = new File(["<xml/>"], "decision.dmn", {
      type: "application/xml",
    });

    await userEvent.upload(input as HTMLInputElement, dmnFile);

    expect(uploadFile).toHaveBeenCalled();
  });
});

describe("DmnUploadDialog — Excel upload", () => {
  it("renders hidden file input when dialog is open", () => {
    render(
      <DmnUploadDialog
        open={true}
        onClose={vi.fn()}
        file={null}
        onUploadExcel={vi.fn()}
        onImportExcel={vi.fn()}
      />,
    );

    const input = document.getElementById("inputExcelFile");
    expect(input).toBeTruthy();
    expect((input as HTMLInputElement).type).toBe("file");
    expect((input as HTMLElement).style.display).toBe("none");
  });

  it("clicking Import button triggers file input click", async () => {
    const user = userEvent.setup();
    render(
      <DmnUploadDialog
        open={true}
        onClose={vi.fn()}
        file={null}
        onUploadExcel={vi.fn()}
        onImportExcel={vi.fn()}
      />,
    );

    const input = document.getElementById("inputExcelFile");
    const clickSpy = vi.spyOn(input as HTMLElement, "click");

    // The upload button has a BootstrapIcon "upload" inside
    const uploadBtn = document.querySelector(".property-button") as HTMLElement;
    await user.click(uploadBtn);

    expect(clickSpy).toHaveBeenCalled();
  });

  it("triggers onUploadExcel callback when file is selected", async () => {
    const onUploadExcel = vi.fn();
    render(
      <DmnUploadDialog
        open={true}
        onClose={vi.fn()}
        file={null}
        onUploadExcel={onUploadExcel}
        onImportExcel={vi.fn()}
      />,
    );

    const input = document.getElementById("inputExcelFile");
    const excelFile = new File(["data"], "rules.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    await userEvent.upload(input as HTMLInputElement, excelFile);

    expect(onUploadExcel).toHaveBeenCalled();
  });
});
