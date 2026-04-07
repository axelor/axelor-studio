import type * as Monaco from "monaco-editor";

const GROOVY_KEYWORDS = [
  "abstract",
  "as",
  "assert",
  "boolean",
  "break",
  "byte",
  "case",
  "catch",
  "char",
  "class",
  "const",
  "continue",
  "def",
  "default",
  "do",
  "double",
  "else",
  "enum",
  "extends",
  "false",
  "final",
  "finally",
  "float",
  "for",
  "goto",
  "if",
  "implements",
  "import",
  "in",
  "instanceof",
  "int",
  "interface",
  "long",
  "native",
  "new",
  "null",
  "package",
  "private",
  "protected",
  "public",
  "return",
  "short",
  "static",
  "strictfp",
  "super",
  "switch",
  "synchronized",
  "this",
  "threadsafe",
  "throw",
  "throws",
  "transient",
  "true",
  "try",
  "void",
  "volatile",
  "while",
];

const GROOVY_FUNCTIONS = [
  "addAll",
  "asImmutable",
  "asReversed",
  "asSynchronized",
  "asUnmodifiable",
  "bufferedIterator",
  "drop",
  "dropRight",
  "dropWhile",
  "each",
  "eachWithIndex",
  "equals",
  "execute",
  "findAll",
  "find",
  "first",
  "flatten",
  "getAt",
  "grep",
  "head",
  "init",
  "intersect",
  "last",
  "leftShift",
  "minus",
  "multiply",
  "plus",
  "pop",
  "push",
  "putAt",
  "removeAt",
  "removeLast",
  "reverse",
  "shuffle",
  "shuffled",
  "split",
  "subsequences",
  "swap",
  "tail",
  "take",
  "takeRight",
  "takeWhile",
  "toSpreadMap",
  "toUnique",
  "transpose",
  "unique",
  "withDefault",
  "withEagerDefault",
  "withLazyDefault",
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

const GROOVY_CONFIG: Monaco.languages.LanguageConfiguration = {
  comments: {
    lineComment: "//",
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
    ...GROOVY_KEYWORDS.map((keyword) => ({
      label: keyword,
      kind: monaco.languages.CompletionItemKind.Keyword,
      insertText: `${keyword} `,
      range,
    })),
    ...GROOVY_FUNCTIONS.map((fn) => ({
      label: fn,
      kind: monaco.languages.CompletionItemKind.Function,
      insertText: `${fn}()`,
      range,
    })),
  ];
}

export const groovyLanguage = {
  id: "groovy" as const,
  tokenizer: {
    root: [
      ...GROOVY_KEYWORDS.map(
        (keyword) =>
          [new RegExp(`\\b${keyword}\\b`, "i"), "keyword"] as Monaco.languages.IMonarchLanguageRule,
      ),
      ...GROOVY_FUNCTIONS.map(
        (fn) =>
          [new RegExp(`\\b${fn}\\b`, "i"), "keyword"] as Monaco.languages.IMonarchLanguageRule,
      ),
      [/\/\/.*/, "comment"] as Monaco.languages.IMonarchLanguageRule,
      ...COMMON_TOKENIZER,
    ],
    string: STRING_TOKENIZER,
  },
  config: GROOVY_CONFIG,
  themeRules: THEME_RULES,
  completionItems,
};
