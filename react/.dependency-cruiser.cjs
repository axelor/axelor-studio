/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    // Rule 1: @studio/shared must never import from consumer packages (D-05.1)
    // When running from react/shared/, consumer packages resolve as ../bpm/, ../dmn/, etc.
    // Scoped to the 3 app packages (bpm, dmn, bpm-merge-split). Utility packages
    // (generic-builder, mapper, timer-builder) are excluded to avoid false positives
    // when bpm/mapper legitimately import them as workspace dependencies.
    {
      name: "shared-no-consumer-imports",
      comment:
        "@studio/shared must not import from app consumer packages (bpm, dmn, bpm-merge-split)",
      severity: "error",
      from: { path: "^src/" },
      to: {
        path: "^\\.\\./(?:bpm|dmn|bpm-merge-split)/",
      },
    },
    // Rule 2: No circular dependencies across package boundaries (D-05.2, D-06)
    // Detects cycles where the current package's source (src/) participates in a cycle
    // that passes through a sibling package (../). Internal cycles within a single
    // package are out of scope per D-06 (inter-package boundaries only).
    {
      name: "no-inter-package-cycles",
      comment: "No circular dependencies across package boundaries",
      severity: "error",
      from: { path: "^src/" },
      to: { circular: true, path: "^\\.\\." },
    },
    // Rule 3: App packages (bpm, dmn, bpm-merge-split) must not import each other (D-05.3)
    // When running from bpm/, dmn resolves as ../dmn/; from dmn/, bpm resolves as ../bpm/
    {
      name: "bpm-no-import-dmn",
      comment: "bpm must not import from dmn",
      severity: "error",
      from: { path: "^src/" },
      to: { path: "^\\.\\./dmn/" },
    },
    {
      name: "bpm-no-import-merge-split",
      comment: "bpm must not import from bpm-merge-split",
      severity: "error",
      from: { path: "^src/" },
      to: { path: "^\\.\\./bpm-merge-split/" },
    },
    {
      name: "dmn-no-import-bpm",
      comment: "dmn must not import from bpm",
      severity: "error",
      from: { path: "^src/" },
      to: { path: "^\\.\\./bpm/" },
    },
    {
      name: "dmn-no-import-merge-split",
      comment: "dmn must not import from bpm-merge-split",
      severity: "error",
      from: { path: "^src/" },
      to: { path: "^\\.\\./bpm-merge-split/" },
    },
    {
      name: "merge-split-no-import-bpm",
      comment: "bpm-merge-split must not import from bpm",
      severity: "error",
      from: { path: "^src/" },
      to: { path: "^\\.\\./bpm/" },
    },
    {
      name: "merge-split-no-import-dmn",
      comment: "bpm-merge-split must not import from dmn",
      severity: "error",
      from: { path: "^src/" },
      to: { path: "^\\.\\./dmn/" },
    },
    // Rule 4: No deep imports into @studio/shared (D-05.4)
    // Consumers must use sub-path imports (@studio/shared/services), never ../shared/src/...
    // The package.json exports field maps sub-path imports to the correct source files.
    // Direct filesystem traversal (../shared/src/...) bypasses the exports field and is forbidden.
    {
      name: "no-deep-shared-imports",
      comment:
        "Use sub-path imports (@studio/shared/services), never ../shared/src/...",
      severity: "error",
      from: { path: "^src/" },
      to: { path: "^\\.\\./shared/src/" },
    },
  ],
  options: {
    moduleSystems: ["es6"],
    tsConfig: { fileName: "./tsconfig.json" },
    exclude: {
      path: "(node_modules|bundled-config\\.js)",
    },
  },
};
