/**
 * Vitest mock for monaco-editor.
 *
 * monaco-editor has no `main` or `exports` in its package.json — only `module`.
 * Vite 7.x's resolvePackageEntry cannot resolve it, so vitest fails at the
 * transform phase before vi.mock() takes effect.
 *
 * This file is aliased in vitest.config.js to intercept the resolution.
 * Test files can still override with vi.mock('monaco-editor', ...) if needed.
 */
export const editor = {
  create: () => null,
  defineTheme: () => {},
  setTheme: () => {},
};

export const languages = {
  register: () => {},
  getLanguages: () => [],
  setMonarchTokensProvider: () => {},
  setLanguageConfiguration: () => {},
  registerCompletionItemProvider: () => {},
  CompletionItemKind: { Keyword: 17, Function: 1, Snippet: 27, Text: 18 },
};

export const Range = class MockRange {
  constructor(
    public startLineNumber: number,
    public startColumn: number,
    public endLineNumber: number,
    public endColumn: number,
  ) {}
};
