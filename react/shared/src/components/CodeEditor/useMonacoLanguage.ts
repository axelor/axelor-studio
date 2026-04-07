import { useCallback } from "react";
import type { OnMount } from "@monaco-editor/react";

import { groovyLanguage } from "./languages/groovy";
import { jpqlLanguage } from "./languages/jpql";

const registeredLanguages = new Set<string>();

type LanguageDefinition = typeof groovyLanguage | typeof jpqlLanguage;

const CUSTOM_LANGUAGES: Record<string, LanguageDefinition> = {
  groovy: groovyLanguage,
  jpql: jpqlLanguage,
};

/**
 * Hook that returns an `onMount` callback for @monaco-editor/react.
 * Registers custom language tokenizers, configurations, and completion providers
 * using the `monaco` instance from the callback (no globals).
 *
 * Each language is registered only once across the application lifetime.
 */
export function useMonacoLanguage(
  languageId: string,
  options?: { suggestion?: boolean },
): { onMount: OnMount } {
  const onMount: OnMount = useCallback(
    (editor, monaco) => {
      const langDef = CUSTOM_LANGUAGES[languageId];

      if (langDef && !registeredLanguages.has(languageId)) {
        const isAlreadyRegistered = monaco.languages
          .getLanguages()
          .some((lang) => lang.id === languageId);

        if (!isAlreadyRegistered) {
          monaco.languages.register({ id: languageId });
        }

        monaco.languages.setMonarchTokensProvider(languageId, {
          tokenizer: langDef.tokenizer,
        });

        monaco.languages.setLanguageConfiguration(languageId, langDef.config);

        monaco.languages.registerCompletionItemProvider(languageId, {
          provideCompletionItems: (model, position) => {
            const wordInfo = model.getWordUntilPosition(position);
            const wordRange = new monaco.Range(
              position.lineNumber,
              wordInfo.startColumn,
              position.lineNumber,
              wordInfo.endColumn,
            );
            return {
              suggestions: langDef.completionItems(wordRange, monaco),
            };
          },
        });

        registeredLanguages.add(languageId);
      }

      // Define and apply custom theme with language-specific rules
      const themeRules = langDef && options?.suggestion !== false ? langDef.themeRules : [];

      monaco.editor.defineTheme("studio-custom-theme", {
        base: document.documentElement.dataset.bsTheme === "dark" ? "vs-dark" : "vs",
        inherit: true,
        rules: themeRules,
        colors: {
          "editor.foreground":
            document.documentElement.dataset.bsTheme === "dark" ? "#ffffff" : "#000000",
        },
      });

      monaco.editor.setTheme("studio-custom-theme");
    },
    [languageId, options?.suggestion],
  );

  return { onMount };
}
