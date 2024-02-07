import {
  COMMON_TOKENIZER,
  GROOVY_CONFIG,
  GROOVY_FUNCTIONS,
  GROOVY_KEYWORDS,
  JPQL_CONFIG,
  JPQL_FUNCTIONS,
  JPQL_KEYWORDS,
  STRING_TOKENIZER,
  THEME_RULES,
} from "./constant";

const useLanguageConfig = (languageId) => {
  const getSuggestions = (KEYWORDS, FUNCTIONS, range) => {
    return [
      ...KEYWORDS.map((keyword) => ({
        label: keyword,
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: `${keyword} `,
        range,
      })),
      ...FUNCTIONS.map((keyword) => ({
        label: keyword,
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: `${keyword}()`,
        range,
      })),
    ];
  };
  const config = {
    jpql: {
      tokenizer: {
        root: [
          ...JPQL_KEYWORDS.flatMap((keyword) => [
            [new RegExp(`\\b${keyword}\\b`, "i"), "keyword"],
            [new RegExp(`\\b${keyword.toLowerCase()}\\b`, "i"), "keyword"],
          ]),
          ...JPQL_FUNCTIONS.flatMap((keyword) => [
            [new RegExp(`\\b${keyword}\\b`, "i"), "keyword"],
            [new RegExp(`\\b${keyword.toLowerCase()}\\b`, "i"), "keyword"],
          ]),
          ...COMMON_TOKENIZER,
        ],
        string: STRING_TOKENIZER,
      },
      suggestions: (range) =>
        getSuggestions(JPQL_KEYWORDS, JPQL_FUNCTIONS, range),
      languageConfig: JPQL_CONFIG,
      themeRules: THEME_RULES,
    },

    groovy: {
      tokenizer: {
        root: [
          ...GROOVY_KEYWORDS.flatMap((keyword) => [
            [new RegExp(`\\b${keyword}\\b`, "i"), "keyword"],
          ]),
          ...GROOVY_FUNCTIONS.flatMap((keyword) => [
            [new RegExp(`\\b${keyword}\\b`, "i"), "keyword"],
          ]),
          [(/\/\/.*/, "comment")],
          ...COMMON_TOKENIZER,
        ],
        string: STRING_TOKENIZER,
      },
      suggestions: (range) =>
        getSuggestions(GROOVY_KEYWORDS, GROOVY_FUNCTIONS, range),
      languageConfig: GROOVY_CONFIG,
      themeRules: THEME_RULES,
    },
  };
  return config[languageId] || {};
};

export default useLanguageConfig;
