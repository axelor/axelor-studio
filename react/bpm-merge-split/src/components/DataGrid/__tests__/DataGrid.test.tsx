/**
 * DataGrid regression test: ensures selection sync uses functional updater.
 *
 * The stale-closure bug (f7744b1f) happened because DataGrid's useEffect
 * called setState({ ...state, selectedRows }) with a stale closure,
 * overwriting state.rows computed by @axelor/ui Grid.
 *
 * Since mocking @axelor/ui Grid for integration testing causes render loops,
 * we verify the contract at the source level: the DataGrid module must NOT
 * contain the dangerous direct-state-spread pattern.
 */
import { readFileSync } from "fs";
import { resolve } from "path";

import { describe, it, expect } from "vitest";

describe("DataGrid — stale state regression guard", () => {
  const source = readFileSync(
    resolve(__dirname, "../index.tsx"),
    "utf-8",
  );

  it("uses functional updater for setState (not direct spread)", () => {
    // The buggy pattern: setState({ ...state, selectedRows: ... })
    // The safe pattern:  setState((draft) => { draft.selectedRows = ... })
    const hasDangerousSpread = /setState\(\s*\{[^}]*\.\.\.state/.test(source);

    expect(hasDangerousSpread).toBe(false);
  });

  it("calls setState with a function argument in the useEffect", () => {
    // Ensure the functional updater form is present
    const hasFunctionalUpdater = /setState\(\s*\(\s*draft\s*\)\s*=>/.test(source);

    expect(hasFunctionalUpdater).toBe(true);
  });
});
