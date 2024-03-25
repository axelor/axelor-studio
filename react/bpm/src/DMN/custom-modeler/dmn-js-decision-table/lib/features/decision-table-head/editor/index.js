import ContextMenu from "table-js/lib/features/context-menu";
import DebounceInput from "dmn-js-shared/lib/features/debounce-input";
import ExpressionLanguagesModule from "dmn-js-shared/lib/features/expression-languages";
import OutputEditingProvider from "./OutputEditingProvider";
import InputEditingProvider from "./InputEditingProvider";
import TypeRefEditing from "dmn-js-decision-table/lib/features/type-ref";
import AllowedValuesEditing from "dmn-js-decision-table/lib/features/allowed-values";
import AddInputOutput from "dmn-js-decision-table/lib/features/add-input-output";
import KeyboardModule from "dmn-js-decision-table/lib/features/keyboard";

const init = {
  __depends__: [
    AddInputOutput,
    ContextMenu,
    DebounceInput,
    ExpressionLanguagesModule,
    KeyboardModule,
    AllowedValuesEditing,
    TypeRefEditing,
  ],
  __init__: ["inputEditingProvider", "outputEditingProvider"],
  inputEditingProvider: ["type", InputEditingProvider],
  outputEditingProvider: ["type", OutputEditingProvider],
};

export default init;
