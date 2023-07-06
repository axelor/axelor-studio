import { assign, forEach } from "min-dash";

let DEFAULT_COLORS = {
  fill: undefined,
  stroke: undefined,
};

export default function SetColorHandler(commandStack) {
  this._commandStack = commandStack;
}

SetColorHandler.$inject = ["commandStack"];

SetColorHandler.prototype.postExecute = function (context) {
  let elements = context.elements,
    colors = context.colors || DEFAULT_COLORS;

  let self = this;

  let di = {};

  if ("fill" in colors) {
    assign(di, { fill: colors.fill });
  }

  if ("stroke" in colors) {
    assign(di, { stroke: colors.stroke });
  }

  forEach(elements, function (element) {
    self._commandStack.execute("element.updateProperties", {
      element: element,
      properties: {
        di: di,
      },
    });
  });
};
