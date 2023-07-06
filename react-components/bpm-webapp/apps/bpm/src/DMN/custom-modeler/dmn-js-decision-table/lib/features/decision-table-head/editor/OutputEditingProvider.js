import { closest as domClosest, matches as domMatches } from "min-dom";
import OutputCell from "./components/OutputCell";
import OutputCellContextMenu from "./components/OutputCellContextMenu";
function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

var OutputEditingProvider = function OutputEditingProvider(
  components,
  contextMenu,
  eventBus,
  renderer
) {
  _classCallCheck(this, OutputEditingProvider);

  components.onGetComponent("cell", function (_ref) {
    var cellType = _ref.cellType;

    if (cellType === "output-header") {
      return OutputCell;
    }
  });
  components.onGetComponent("context-menu", function () {
    var context =
      arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    if (context.contextMenuType === "output-edit") {
      return OutputCellContextMenu;
    }
  });
  eventBus.on("output.edit", function (_ref2) {
    var event = _ref2.event,
      output = _ref2.output;
    var target = event.target;
    var node = domClosest(target, "th", true);

    var _node$getBoundingClie = node.getBoundingClientRect(),
      left = _node$getBoundingClie.left,
      top = _node$getBoundingClie.top;

    var offset = getOffset(node);
    contextMenu.open(
      {
        x: left,
        y: top,
        align: "bottom-right",
      },
      {
        contextMenuType: "output-edit",
        output: output,
        offset: offset,
      }
    );
  });
};

export { OutputEditingProvider as default };
OutputEditingProvider.$inject = [
  "components",
  "contextMenu",
  "eventBus",
  "renderer",
];

function getOffset(element) {
  if (!domMatches(element, ".output-cell + .output-cell")) {
    return {
      x: -1,
      y: 0,
    };
  }
}
