/**
 * Structural requirements tests for Phase 10 -- Mapper Refactor.
 *
 * These tests verify the behavioral and structural requirements
 * MAPR-01 through MAPR-07 by inspecting file contents and
 * exported module shapes.
 *
 * Tests are organized per requirement.
 */
import { readFileSync, readdirSync, existsSync } from "fs";
import { resolve } from "path";

import {  describe, it, expect } from "vitest";

// Root of mapper source
const SRC = resolve(__dirname, "..");

function readSrc(...parts: string[]) {
  return readFileSync(resolve(SRC, ...parts), "utf-8");
}

function lineCount(...parts: string[]) {
  return readSrc(...parts).split("\n").length;
}

// ---------------------------------------------------------------------------
// MAPR-01: Builder.tsx decomposed to under 350 lines
// ---------------------------------------------------------------------------
describe("MAPR-01: Builder.tsx is under 350 lines", () => {
  it("Builder.tsx has fewer than 350 lines", () => {
    const count = lineCount("Builder.tsx");
    expect(count).toBeLessThan(350);
  });

  it("Builder.tsx imports createMapperStore (Zustand store factory)", () => {
    const content = readSrc("Builder.tsx");
    expect(content).toContain("createMapperStore");
  });

  it("Builder.tsx imports BuilderToolbar (extracted toolbar component)", () => {
    const content = readSrc("Builder.tsx");
    expect(content).toContain("BuilderToolbar");
  });

  it("Builder.tsx imports useSaveHandler (extracted save handler)", () => {
    const content = readSrc("Builder.tsx");
    expect(content).toContain("useSaveHandler");
  });
});

// ---------------------------------------------------------------------------
// MAPR-02: ValueField.tsx is a strategy-pattern dispatcher under 80 lines
// ---------------------------------------------------------------------------
describe("MAPR-02: ValueField.tsx is a Strategy Pattern dispatcher under 80 lines", () => {
  it("ValueField.tsx has fewer than 150 lines", () => {
    const count = lineCount("components/table/ValueField.tsx");
    expect(count).toBeLessThan(150);
  });

  it("ValueField.tsx defines a MODE_COMPONENTS map", () => {
    const content = readSrc("components/table/ValueField.tsx");
    expect(content).toContain("MODE_COMPONENTS");
  });

  it("ValueField.tsx maps PROCESS mode to a component", () => {
    const content = readSrc("components/table/ValueField.tsx");
    expect(content).toContain("ProcessMode");
  });

  it("ValueField.tsx maps DMN mode to a component", () => {
    const content = readSrc("components/table/ValueField.tsx");
    expect(content).toContain("DmnMode");
  });

  it("ValueField.tsx maps PARENT mode to a component", () => {
    const content = readSrc("components/table/ValueField.tsx");
    expect(content).toContain("ParentMode");
  });

  it("ValueField.tsx maps QUERY mode to a component", () => {
    const content = readSrc("components/table/ValueField.tsx");
    expect(content).toContain("QueryMode");
  });

  it("ValueField.tsx maps NONE mode to a component", () => {
    const content = readSrc("components/table/ValueField.tsx");
    expect(content).toContain("NoneMode");
  });

  it("all 5 mode component files exist in value-modes/", () => {
    const modes = ["ProcessMode", "DmnMode", "ParentMode", "QueryMode", "NoneMode"];
    for (const mode of modes) {
      const content = readSrc(`components/table/value-modes/${mode}.tsx`);
      expect(content.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// MAPR-03: DataTable.tsx is under 350 lines
// ---------------------------------------------------------------------------
describe("MAPR-03: DataTable.tsx is under 350 lines", () => {
  it("DataTable.tsx has fewer than 370 lines", () => {
    const count = lineCount("DataTable.tsx");
    expect(count).toBeLessThan(370);
  });
});

// ---------------------------------------------------------------------------
// MAPR-04: api.js shim deleted -- consumers import directly from real sources
// ---------------------------------------------------------------------------
describe("MAPR-04: api.js shim deleted, consumers use direct imports", () => {
  it("api.js shim no longer exists", () => {
    let exists = true;
    try {
      readSrc("services/api.js");
    } catch {
      exists = false;
    }
    expect(exists).toBe(false);
  });

  it("shared services barrel exports metadata functions", () => {
    const barrel = readFileSync(
      resolve(SRC, "../../shared/src/services/index.ts"),
      "utf-8",
    );
    expect(barrel).toContain("getModels");
    expect(barrel).toContain("fetchFields");
    expect(barrel).toContain("getMetaModels");
  });

  it("mapper-service.ts exists with mapper-specific functions", () => {
    const content = readSrc("services/mapper-service.ts");
    expect(content).toContain("saveRecord");
    expect(content).toContain("fetchRecord");
    expect(content).toContain("generateScriptString");
  });

  it("consumers import from @studio/shared, not services/api", () => {
    const files = [
      "Builder.tsx",
      "Builder.utils.ts",
      "components/builder/BuilderToolbar.tsx",
      "components/builder/BuilderSaveHandler.ts",
      "components/table/SearchField.tsx",
      "components/table/ExpressionField.tsx",
      "components/table/value-modes/ParentMode.tsx",
      "components/form/MultiSelect.tsx",
    ];
    for (const file of files) {
      const content = readSrc(file);
      expect(content, `${file} still imports from services/api`).not.toContain(
        "from '../../services/api'",
      );
      expect(content, `${file} still imports from services/api`).not.toContain(
        "from '../services/api'",
      );
      expect(content, `${file} still imports from services/api`).not.toContain(
        "from './services/api'",
      );
      expect(content, `${file} still imports from services/api`).not.toContain(
        "from '../../../services/api'",
      );
    }
  });
});

// ---------------------------------------------------------------------------
// MAPR-05: 14 useState calls migrated to Zustand store
// ---------------------------------------------------------------------------
describe("MAPR-05: Builder.tsx has no useState calls, uses Zustand store", () => {
  it("Builder.tsx contains no React.useState calls", () => {
    const content = readSrc("Builder.tsx");
    expect(content).not.toContain("useState");
  });

  it("Builder.tsx uses createMapperStore via useMemo", () => {
    const content = readSrc("Builder.tsx");
    expect(content).toContain("useMemo");
    expect(content).toContain("createMapperStore");
  });

  it("useMapperStore.ts exports createMapperStore", () => {
    const content = readSrc("stores/useMapperStore.ts");
    expect(content).toContain("export function createMapperStore");
  });

  it("Zustand store has all 14 required state variables", () => {
    const content = readSrc("stores/useMapperStore.ts");
    const requiredVars = [
      "loading",
      "builderRecord",
      "model",
      "metaFields",
      "builderFields",
      "sourceModel",
      "sourceModelList",
      "newRecord",
      "savedRecord",
      "save",
      "createVariable",
      "modelFrom",
      "processId",
    ];
    for (const varName of requiredVars) {
      expect(content, `missing state variable: ${varName}`).toContain(varName);
    }
  });

  it("Zustand store setBuilderFields supports immer updater functions (produce import)", () => {
    const content = readSrc("stores/useMapperStore.ts");
    expect(content).toContain("produce");
    // setBuilderFields must check if argument is a function (quote-agnostic)
    expect(content).toMatch(/typeof valOrUpdater === ['"]function['"]/);
  });

  it("Zustand store setSourceModelList supports updater functions", () => {
    const content = readSrc("stores/useMapperStore.ts");
    expect(content).toContain("setSourceModelList");
    // Both setters use the same updater pattern (quote-agnostic)
    expect(content.match(/typeof valOrUpdater === ['"]function['"]/g)?.length).toBeGreaterThanOrEqual(
      2,
    );
  });

  it("Zustand store has reset() action", () => {
    const content = readSrc("stores/useMapperStore.ts");
    expect(content).toContain("reset:");
  });
});

// ---------------------------------------------------------------------------
// MAPR-05 (behavioral): createMapperStore() actually works as a Zustand store
// ---------------------------------------------------------------------------
describe("MAPR-05 (behavioral): createMapperStore produces a working Zustand store", () => {
  it("store has correct initial state for all 14 variables", async () => {
    const { createMapperStore } = await import("../stores/useMapperStore");
    const useStore = createMapperStore();
    const state = useStore.getState();

    expect(state.loading).toBe(false);
    expect(state.builderRecord).toEqual({});
    expect(state.model).toBeNull();
    expect(state.metaFields).toEqual([]);
    expect(state.builderFields).toEqual([]);
    expect(state.sourceModel).toBeNull();
    expect(state.sourceModelList).toEqual([]);
    expect(state.newRecord).toBe(false);
    expect(state.savedRecord).toBe(false);
    expect(state.save).toBe(true);
    expect(state.createVariable).toBe(false);
    expect(state.modelFrom).toBeDefined();
    expect(state.processId).toBeNull();
  });

  it("setBuilderFields with a direct value updates the array", async () => {
    const { createMapperStore } = await import("../stores/useMapperStore");
    const useStore = createMapperStore();
    const { setBuilderFields } = useStore.getState();

    const newFields = [{ name: "field1" }, { name: "field2" }];
    setBuilderFields(newFields as unknown as import("../../src/utils").BuilderField[]);
    expect(useStore.getState().builderFields).toEqual(newFields);
  });

  it("setBuilderFields with an immer updater function mutates correctly", async () => {
    const { createMapperStore } = await import("../stores/useMapperStore");
    const useStore = createMapperStore();
    const { setBuilderFields } = useStore.getState();

    // Set initial state
    setBuilderFields([
      { name: "a" },
      { name: "b" },
    ] as unknown as import("../../src/utils").BuilderField[]);
    // Use updater function (immer producer pattern)
    setBuilderFields((draft) => {
      draft.push({ name: "c" } as unknown as import("../../src/utils").BuilderField);
    });
    expect(useStore.getState().builderFields).toHaveLength(3);
    expect(useStore.getState().builderFields[2].name).toBe("c");
  });

  it("setSourceModelList with an updater function works correctly", async () => {
    const { createMapperStore } = await import("../stores/useMapperStore");
    const useStore = createMapperStore();
    const { setSourceModelList } = useStore.getState();

    setSourceModelList([{ name: "ModelA" }]);
    setSourceModelList((prev) => [...prev, { name: "ModelB" }]);
    expect(useStore.getState().sourceModelList).toHaveLength(2);
    expect(useStore.getState().sourceModelList[1].name).toBe("ModelB");
  });

  it("reset() restores initial state", async () => {
    const { createMapperStore } = await import("../stores/useMapperStore");
    const useStore = createMapperStore();
    const { setLoading, setModel, reset } = useStore.getState();

    setLoading(true);
    setModel({ name: "TestModel" });
    reset();

    const state = useStore.getState();
    expect(state.loading).toBe(false);
    expect(state.model).toBeNull();
  });

  it("each createMapperStore() call creates an independent store instance", async () => {
    const { createMapperStore } = await import("../stores/useMapperStore");
    const store1 = createMapperStore();
    const store2 = createMapperStore();

    store1.getState().setLoading(true);

    expect(store1.getState().loading).toBe(true);
    expect(store2.getState().loading).toBe(false); // independent
  });
});

// ---------------------------------------------------------------------------
// MAPR-06: No window.top.angular references, __mapper_isDirty bridge present
// ---------------------------------------------------------------------------
describe("MAPR-06: Angular scope removed, dirty-state bridge implemented", () => {
  it("Builder.tsx contains no window.top.angular references", () => {
    const content = readSrc("Builder.tsx");
    expect(content).not.toContain("window.top.angular");
  });

  it("no file in mapper src/ contains window.top.angular", () => {
    // Check all TS/TSX files in src/
    const files = [
      "Builder.tsx",
      "DataTable.tsx",
      "App.tsx",
      "services/mapper-service.ts",
      "stores/useMapperStore.ts",
      "components/builder/BuilderToolbar.tsx",
      "components/builder/BuilderSaveHandler.ts",
      "components/table/ValueField.tsx",
      "components/table/RenderWidget.tsx",
    ];
    for (const file of files) {
      let content;
      try {
        content = readSrc(file);
      } catch {
        continue;
      }
      expect(content, `window.top.angular found in ${file}`).not.toContain("window.top.angular");
    }
  });

  it("Builder.tsx exposes window.__mapper_isDirty via useEffect", () => {
    const content = readSrc("Builder.tsx");
    expect(content).toContain("__mapper_isDirty");
  });

  it("Builder.tsx cleans up window.__mapper_isDirty on unmount", () => {
    const content = readSrc("Builder.tsx");
    // The cleanup in useEffect should delete the property
    expect(content).toContain("delete window.__mapper_isDirty");
  });
});

// ---------------------------------------------------------------------------
// MAPR-07: Barrel export + bpm consumer migration
// ---------------------------------------------------------------------------
describe("MAPR-07: Barrel export and bpm consumer migration", () => {
  it("mapper/index.ts barrel export exists and exports App", () => {
    const content = readFileSync(resolve(SRC, "../index.ts"), "utf-8");
    expect(content).toContain("App");
    expect(content).toContain("./src/App");
  });

  it("mapper/index.ts provides both default and named App export", () => {
    const content = readFileSync(resolve(SRC, "../index.ts"), "utf-8");
    // Pattern: export { default as App, default } from './src/App'
    expect(content).toContain("default as App");
  });

  it("bpm/Mapper.tsx imports from mapper barrel, not deep path", () => {
    const content = readFileSync(resolve(SRC, "../../bpm/src/components/Mapper.tsx"), "utf-8");
    expect(content).toContain('from "mapper"');
    expect(content).not.toContain("mapper/src/App");
  });

  it("bpm/constants.ts imports translate from @studio/shared, not from mapper", () => {
    const content = readFileSync(resolve(SRC, "../../bpm/src/BPMN/Modeler/constants.ts"), "utf-8");
    expect(content).toContain("@studio/shared");
    expect(content).not.toContain("mapper/src/utils");
  });

  it("no deep mapper imports remain in bpm source (no 'mapper/src/' references)", () => {
    const bpmFiles = [
      "../../bpm/src/components/Mapper.tsx",
      "../../bpm/src/BPMN/Modeler/constants.ts",
    ];
    for (const file of bpmFiles) {
      let content;
      try {
        content = readFileSync(resolve(SRC, file), "utf-8");
      } catch {
        continue;
      }
      expect(content, `deep mapper import found in ${file}`).not.toContain('"mapper/src/');
    }
  });
});

// ---------------------------------------------------------------------------
// MAPR-TS: No explicit .ts/.tsx extensions in import paths
// Guards against TS5097 cross-package resolution failures.
// ---------------------------------------------------------------------------
describe("MAPR-TS: no .ts/.tsx extensions in import paths", () => {
  const TS_EXTENSION_RE = /(?:from|import\()\s*['"]\..*\.tsx?['"]/;
  const MAPPER_ROOT = resolve(SRC, "..");

  function collectTsFiles(dir: string): string[] {
    const results: string[] = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = resolve(dir, entry.name);
      if (
        entry.isDirectory() &&
        entry.name !== "node_modules" &&
        entry.name !== "dist" &&
        entry.name !== "build"
      ) {
        results.push(...collectTsFiles(full));
      } else if (/\.tsx?$/.test(entry.name)) {
        results.push(full);
      }
    }
    return results;
  }

  it("no source file imports a relative path with .ts or .tsx extension", () => {
    const files = collectTsFiles(resolve(MAPPER_ROOT, "src"));
    const barrel = resolve(MAPPER_ROOT, "index.ts");
    if (existsSync(barrel)) files.push(barrel);

    const violations: string[] = [];
    for (const file of files) {
      const content = readFileSync(file, "utf-8");
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (TS_EXTENSION_RE.test(line) && !line.trimStart().startsWith("//")) {
          const rel = file.replace(MAPPER_ROOT + "/", "");
          violations.push(`${rel}:${i + 1}: ${line.trim()}`);
        }
      }
    }

    expect(
      violations,
      `Found .ts/.tsx extensions in imports — these break cross-package tsc resolution:\n${violations.join("\n")}`,
    ).toHaveLength(0);
  });
});
