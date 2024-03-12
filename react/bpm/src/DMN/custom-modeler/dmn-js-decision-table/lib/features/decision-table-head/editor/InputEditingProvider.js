import { closest as domClosest } from "min-dom";
import InputCell from "./components/InputCell";
import InputCellContextMenu from "./components/InputCellContextMenu";
function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

var InputCellProvider = function InputCellProvider(
  components,
  contextMenu,
  eventBus,
  renderer
) {
  _classCallCheck(this, InputCellProvider);

  components.onGetComponent("cell", function (_ref) {
    var cellType = _ref.cellType;

    if (cellType === "input-header") {
      return InputCell;
    }
  });
  components.onGetComponent("context-menu", function () {
    var context =
      arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    if (context.contextMenuType === "input-edit") {
      return InputCellContextMenu;
    }
  });
  eventBus.on("input.edit", function (_ref2) {
    var event = _ref2.event,
      input = _ref2.input;
    var target = event.target;
    var node = domClosest(target, "th", true);

    var _node$getBoundingClie = node.getBoundingClientRect(),
      left = _node$getBoundingClie.left,
      top = _node$getBoundingClie.top;

    contextMenu.open(
      {
        x: left,
        y: top,
        align: "bottom-right",
      },
      {
        contextMenuType: "input-edit",
        input: input,
      }
    );
  });
};

export { InputCellProvider as default };
InputCellProvider.$inject = [
  "components",
  "contextMenu",
  "eventBus",
  "renderer",
];
