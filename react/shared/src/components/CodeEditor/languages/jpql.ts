import type * as Monaco from "monaco-editor";

const JPQL_KEYWORDS = [
  "SELECT",
  "FROM",
  "WHERE",
  "GROUP BY",
  "HAVING",
  "ORDER BY",
  "JOIN",
  "INNER JOIN",
  "LEFT JOIN",
  "RIGHT JOIN",
  "INNER",
  "OUTER",
  "LEFT",
  "RIGHT",
  "FETCH",
  "DISTINCT",
  "AND",
  "OR",
  "NOT",
  "BETWEEN",
  "LIKE",
  "IN",
  "IS NULL",
  "IS NOT NULL",
  "NULL",
  "TRUE",
  "FALSE",
  "self",
  "as",
];

const JPQL_FUNCTIONS = [
  "COUNT",
  "SUM",
  "AVG",
  "MIN",
  "MAX",
  "CONCAT",
  "SUBSTRING",
  "LENGTH",
  "LOWER",
  "UPPER",
  "CASE",
  "WHEN",
  "THEN",
  "ELSE",
  "END",
  "NULLS FIRST",
  "NULLS LAST",
  "ASC",
  "DESC",
  "PARAMETER",
];

const COMMON_TOKENIZER: Monaco.languages.IMonarchLanguageRule[] = [
  [/\b\d+\b/, "number"],
  [/".*"/, "string"],
  [/[a-zA-Z_]\w*/, "identifier"],
  [/"/, "string", "@string"],
  [/===|\?|\./, "custom-operator"],
  [/[!@#$%^&*()\-+=[\]{}|;:'",.<>/?]+/, "custom-punctuation"],
  [/[^\w\s]/, "custom-special"],
];

const STRING_TOKENIZER: Monaco.languages.IMonarchLanguageRule[] = [
  [/"$/, "string", "@pop"],
  [/'$/, "string", "@pop"],
  [/[^"'\n\\]+/, "string"],
  [/\\./, "string.escape"],
  [/["']/, "string", "@pop"],
];

const JPQL_CONFIG: Monaco.languages.LanguageConfiguration = {
  comments: {
    lineComment: "--",
    blockComment: ["/*", "*/"],
  },
  brackets: [
    ["{", "}"],
    ["[", "]"],
    ["(", ")"],
  ],
  autoClosingPairs: [
    { open: "{", close: "}" },
    { open: "[", close: "]" },
    { open: "(", close: ")" },
    { open: "'", close: "'", notIn: ["string"] },
    { open: '"', close: '"', notIn: ["string"] },
  ],
  surroundingPairs: [
    { open: "{", close: "}" },
    { open: "[", close: "]" },
    { open: "(", close: ")" },
    { open: "'", close: "'" },
    { open: '"', close: '"' },
  ],
  folding: {
    markers: {
      start: new RegExp("^\\s*\\/\\*\\s*region\\b\\s*(.*?)\\s*$"),
      end: new RegExp("^\\s*\\/\\*\\s*endregion\\b\\s*(.*?)\\s*$"),
    },
  },
};

const THEME_RULES: Monaco.editor.ITokenThemeRule[] = [
  { token: "custom-operator", foreground: "#800080" },
  { token: "custom-punctuation", foreground: "#008000" },
  { token: "custom-special", foreground: "#ffa20c" },
  { token: "identifier", foreground: "800080" },
];

function completionItems(
  range: Monaco.IRange,
  monaco: typeof Monaco,
): Monaco.languages.CompletionItem[] {
  return [
    ...JPQL_KEYWORDS.map((keyword) => ({
      label: keyword,
      kind: monaco.languages.CompletionItemKind.Keyword,
      insertText: `${keyword} `,
      range,
    })),
    ...JPQL_FUNCTIONS.map((fn) => ({
      label: fn,
      kind: monaco.languages.CompletionItemKind.Function,
      insertText: `${fn}()`,
      range,
    })),
  ];
}

export const jpqlLanguage = {
  id: "jpql" as const,
  tokenizer: {
    root: [
      ...JPQL_KEYWORDS.flatMap(
        (keyword) =>
          [
            [new RegExp(`\\b${keyword}\\b`, "i"), "keyword"],
            [new RegExp(`\\b${keyword.toLowerCase()}\\b`, "i"), "keyword"],
          ] as Monaco.languages.IMonarchLanguageRule[],
      ),
      ...JPQL_FUNCTIONS.flatMap(
        (fn) =>
          [
            [new RegExp(`\\b${fn}\\b`, "i"), "keyword"],
            [new RegExp(`\\b${fn.toLowerCase()}\\b`, "i"), "keyword"],
          ] as Monaco.languages.IMonarchLanguageRule[],
      ),
      ...COMMON_TOKENIZER,
    ],
    string: STRING_TOKENIZER,
  },
  config: JPQL_CONFIG,
  themeRules: THEME_RULES,
  completionItems,
};
