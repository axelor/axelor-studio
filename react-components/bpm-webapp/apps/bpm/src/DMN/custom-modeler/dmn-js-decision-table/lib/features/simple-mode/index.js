import ContextMenu from "table-js/lib/features/context-menu";
import CellSelection from "dmn-js-decision-table/lib/features/cell-selection";
import ExpressionLanguagesModule from "dmn-js-shared/lib/features/expression-languages";
import SimpleMode from "./SimpleMode";
const init = {
  __depends__: [ContextMenu, CellSelection, ExpressionLanguagesModule],
  __init__: ["simpleMode"],
  simpleMode: ["type", SimpleMode],
};
export default init;
