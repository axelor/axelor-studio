import { Resizable } from "re-resizable";
import useLanguageConfig from "./languageConfig";
import { Box, useTheme } from "@axelor/ui";
import { useState, useRef, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { CUSTOM_LANGUAGES } from "./constant";

const VS_DARK_THEME = "vs-dark";
const VS_THEME = "vs";

const PADDING = 2;
const INITIAL_HEIGHT = 120;

function ScriptEditor({
  id,
  value,
  width: containerWidth,
  onChange,
  onBlur = () => {},
  isError,
  readOnly,
  defaultHeight,
  suggestion,
  language = "groovy",
  minimap = true,
}) {
  const [height, setHeight] = useState(defaultHeight || INITIAL_HEIGHT);
  const [width, setWidth] = useState(containerWidth - PADDING * 4);
  const savedDimension = useRef({ width, height });
  const { tokenizer, suggestions, languageConfig, themeRules } =
    useLanguageConfig(language);
  const { theme } = useTheme();

  const options = {
    readOnly: readOnly,
    selectOnLineNumbers: true,
    automaticLayout: true,
    minimap: {
      enabled: minimap,
    },
    suggestOnTriggerCharacters: suggestion,
    quickSuggestions: suggestion,
  };

  function handleChange(newValue) {
    onChange(newValue);
  }

  function handleEditorDidMount(_e, monaco) {
    const isLanguageRegistered = monaco.languages
      .getLanguages()
      .some((lang) => lang.id === language);
    const isCustomLanguage =
      CUSTOM_LANGUAGES.GROOVY === language ||
      CUSTOM_LANGUAGES.JPQL === language;
    if (!isLanguageRegistered && isCustomLanguage) {
      monaco.languages.register({ id: language });
      monaco.languages.setMonarchTokensProvider(language, {
        tokenizer,
      });
      monaco.languages.setLanguageConfiguration(language, languageConfig);

      monaco.languages.registerCompletionItemProvider(language, {
        provideCompletionItems: (model, position, context, token) => {
          const wordInfo = model.getWordUntilPosition(position);
          const wordRange = new monaco.Range(
            position.lineNumber,
            wordInfo.startColumn,
            position.lineNumber,
            wordInfo.endColumn
          );
          return {
            suggestions: suggestions(wordRange) || [],
          };
        },
      });
    }
    monaco.editor.defineTheme("custom-theme", {
      base: theme === "dark" ? VS_DARK_THEME : VS_THEME,
      inherit: true,
      rules: suggestion ? themeRules : [],
      colors: {
        "editor.foreground": theme === "dark" ? "#ffffff" : "#000000",
      },
    });

    monaco.editor.setTheme("custom-theme");
  }

  useEffect(() => {
    setWidth(containerWidth - PADDING * 2);
  }, [containerWidth]);

  return (
    <Resizable
      style={{ padding: PADDING }}
      onResizeStart={(e, direction, element) => {
        savedDimension.current = { width, height };
      }}
      enable={{
        top: false,
        right: false,
        bottom: true,
        left: false,
        topRight: false,
        bottomRight: false,
        bottomLeft: false,
        topLeft: false,
      }}
      onResize={(e, direction, ref, d) => {
        setHeight(savedDimension.current.height + d.height);
      }}
    >
      <Box
        id={id}
        border
        borderColor={isError ? "danger-subtle" : null}
        onBlur={onBlur}
      >
        <Editor
          height={`${height}px`}
          width={`${width}px`}
          options={options}
          language={language}
          value={value}
          onChange={handleChange}
          onMount={handleEditorDidMount}
        />
      </Box>
    </Resizable>
  );
}

export default ScriptEditor;
