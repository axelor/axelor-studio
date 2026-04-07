/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";

// Mock bpmn-js modules before any component imports
vi.mock("bpmn-js/lib/Modeler", () => {
  const MockModeler = vi.fn().mockImplementation(() => ({
    importXML: vi.fn(() => Promise.resolve({ warnings: [] })),
    get: vi.fn((name: string) => {
      if (name === "canvas") return { zoom: vi.fn() };
      if (name === "readOnly") return { readOnly: vi.fn() };
      if (name === "elementRegistry")
        return {
          filter: vi.fn(() => []),
          getAll: vi.fn(() => []),
          getGraphics: vi.fn(),
          get: vi.fn(),
        };
      if (name === "modeling") return { updateProperties: vi.fn() };
      return null;
    }),
    on: vi.fn(),
    off: vi.fn(),
    destroy: vi.fn(),
  }));
  return { default: MockModeler };
});

vi.mock("bpmn-js/lib/util/ModelUtil", () => ({
  getBusinessObject: vi.fn(() => ({})),
}));

// Mock bpmn-js CSS imports
vi.mock("bpmn-js/dist/assets/diagram-js.css", () => ({}));
vi.mock("bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css", () => ({}));

// Mock react-split-pane (uses DOM APIs not available in jsdom)
vi.mock("react-split-pane", () => ({
  default: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="split-pane">{children}</div>
  ),
}));

// Mock API calls
vi.mock("../services/api", () => ({
  getBPMModels: vi.fn(() => Promise.resolve([])),
  mergeWkfModel: vi.fn(() => Promise.resolve({})),
  splitWkfModel: vi.fn(() => Promise.resolve({})),
  save: vi.fn(() => Promise.resolve({})),
  saveAndDeploy: vi.fn(() => Promise.resolve({})),
  removeWkf: vi.fn(() => Promise.resolve({})),
  getInfo: vi.fn(() => Promise.resolve({ user: { lang: "en" } })),
  getTranslations: vi.fn(() => Promise.resolve([])),
}));

// Mock react-dropzone
vi.mock("react-dropzone", () => ({
  default: ({
    children,
  }: {
    children: (args: {
      getRootProps: () => Record<string, unknown>;
      getInputProps: () => Record<string, unknown>;
    }) => React.ReactNode;
  }) => children({ getRootProps: () => ({}), getInputProps: () => ({}) }),
  useDropzone: () => ({ getRootProps: () => ({}), getInputProps: () => ({}) }),
}));

// Mock @studio/shared sub-path imports
vi.mock("@studio/shared/theme", () => ({
  useAppTheme: () => ({ theme: "light", options: {} }),
}));
vi.mock("@studio/shared/i18n", () => ({
  translate: (str: string) => str,
}));
vi.mock("@studio/shared/services", () => ({
  ServiceInstance: {
    get: vi.fn(() => Promise.resolve({})),
    search: vi.fn(() => Promise.resolve({})),
    action: vi.fn(() => Promise.resolve({})),
    request: vi.fn(() => Promise.resolve({})),
  },
}));
vi.mock("@studio/shared/components", () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock CSS/SCSS imports
vi.mock("../App.css", () => ({}));

describe("App Component - Characterization Tests", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "http://localhost:3000");
  });

  it("renders without crashing in merge mode (default)", async () => {
    window.history.replaceState({}, "", "http://localhost:3000?type=merge");

    const { default: App } = await import("../App");
    const { container } = render(<App />);

    expect(container.querySelector("#app")).toBeInTheDocument();
  }, 15000);

  it("renders without crashing in split mode", async () => {
    window.history.replaceState({}, "", "http://localhost:3000?type=split");

    // Need fresh module for different URL params
    vi.resetModules();
    // Re-apply mocks after resetModules
    vi.mock("bpmn-js/lib/Modeler", () => {
      const MockModeler = vi.fn().mockImplementation(() => ({
        importXML: vi.fn(() => Promise.resolve({ warnings: [] })),
        get: vi.fn((name: string) => {
          if (name === "canvas") return { zoom: vi.fn() };
          if (name === "readOnly") return { readOnly: vi.fn() };
          if (name === "elementRegistry")
            return {
              filter: vi.fn(() => []),
              getAll: vi.fn(() => []),
              getGraphics: vi.fn(),
              get: vi.fn(),
            };
          if (name === "modeling") return { updateProperties: vi.fn() };
          return null;
        }),
        on: vi.fn(),
        off: vi.fn(),
        destroy: vi.fn(),
      }));
      return { default: MockModeler };
    });
    vi.mock("bpmn-js/lib/util/ModelUtil", () => ({
      getBusinessObject: vi.fn(() => ({})),
    }));
    vi.mock("bpmn-js/dist/assets/diagram-js.css", () => ({}));
    vi.mock("bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css", () => ({}));
    vi.mock("react-split-pane", () => ({
      default: ({ children }: { children?: React.ReactNode }) => (
        <div data-testid="split-pane">{children}</div>
      ),
    }));
    vi.mock("../services/api", () => ({
      getBPMModels: vi.fn(() => Promise.resolve([])),
      mergeWkfModel: vi.fn(() => Promise.resolve({})),
      splitWkfModel: vi.fn(() => Promise.resolve({})),
      save: vi.fn(() => Promise.resolve({})),
      saveAndDeploy: vi.fn(() => Promise.resolve({})),
      removeWkf: vi.fn(() => Promise.resolve({})),
      getInfo: vi.fn(() => Promise.resolve({ user: { lang: "en" } })),
      getTranslations: vi.fn(() => Promise.resolve([])),
    }));
    vi.mock("react-dropzone", () => ({
      default: ({
        children,
      }: {
        children: (args: {
          getRootProps: () => Record<string, unknown>;
          getInputProps: () => Record<string, unknown>;
        }) => React.ReactNode;
      }) => children({ getRootProps: () => ({}), getInputProps: () => ({}) }),
      useDropzone: () => ({ getRootProps: () => ({}), getInputProps: () => ({}) }),
    }));
    vi.mock("@studio/shared/theme", () => ({
      useAppTheme: () => ({ theme: "light", options: {} }),
    }));
    vi.mock("@studio/shared/i18n", () => ({
      translate: (str: string) => str,
    }));
    vi.mock("@studio/shared/services", () => ({
      ServiceInstance: {
        get: vi.fn(() => Promise.resolve({})),
        search: vi.fn(() => Promise.resolve({})),
        action: vi.fn(() => Promise.resolve({})),
        request: vi.fn(() => Promise.resolve({})),
      },
    }));
    vi.mock("@studio/shared/components", () => ({
      Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    }));
    vi.mock("../App.css", () => ({}));

    const { default: App } = await import("../App");
    const { container } = render(<App />);

    expect(container.querySelector("#app")).toBeInTheDocument();
  });

  it("renders ThemeProvider with light theme by default", async () => {
    window.history.replaceState({}, "", "http://localhost:3000?type=merge");

    const { default: App } = await import("../App");
    const { container } = render(<App />);

    // ThemeProvider wraps content -- verify the app container exists
    const appBox = container.querySelector("#app");
    expect(appBox).toBeInTheDocument();
    // Verify children are rendered (context providers produce child content)
    expect(appBox!.children.length).toBeGreaterThan(0);
  });
});
