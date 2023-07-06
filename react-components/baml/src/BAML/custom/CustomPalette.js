import { assign } from "min-dash";

export default function PaletteProvider(
  palette,
  create,
  elementFactory,
  spaceTool,
  lassoTool,
  translate
) {
  this._create = create;
  this._elementFactory = elementFactory;
  this._spaceTool = spaceTool;
  this._lassoTool = lassoTool;
  this.translate = translate;

  palette.registerProvider(this);
}

PaletteProvider.$inject = [
  "palette",
  "create",
  "elementFactory",
  "spaceTool",
  "lassoTool",
  "translate",
];

PaletteProvider.prototype.getPaletteEntries = function (element) {
  let actions = {},
    create = this._create,
    elementFactory = this._elementFactory,
    translate = this.translate;

  function createAction(type, group, className, title, options) {
    function createListener(event) {
      let shape = elementFactory.createShape(assign({ type: type }, options));

      if (options) {
        shape.businessObject.di.isExpanded = options.isExpanded;
      }

      create.start(event, shape);
    }

    let shortType = type.replace(/^bpmn:/, "");

    return {
      group: group,
      className: className,
      title: title || translate("Create") + " " + translate(shortType),
      action: {
        dragstart: createListener,
        click: createListener,
      },
    };
  }

  function createParentNode(event, type) {
    let loop = elementFactory.createShape({
      type: type,
      x: 0,
      y: 0,
      isExpanded: true,
    });

    create.start(event, [loop], {
      hints: {
        autoSelect: [],
      },
    });
  }

  assign(actions, {
    "create.mapper": createAction(
      "bpmn:Mapper",
      "activity",
      "bpmn-icon-task",
      translate("Create mapper")
    ),
    "create.query": createAction(
      "bpmn:Query",
      "gateway",
      "bpmn-icon-gateway-xor",
      translate("Create query")
    ),
    "create.loop": {
      group: "activity",
      className: "bpmn-icon-loop-marker",
      title: translate("Create loop"),
      action: {
        dragstart: (e) => createParentNode(e, "bpmn:Loop"),
        click: (e) => createParentNode(e, "bpmn:Loop"),
      },
    },
    "create.conditional": {
      group: "activity",
      className: "bpmn-icon-sequential-mi-marker",
      title: translate("Create condition"),
      action: {
        dragstart: (e) => createParentNode(e, "bpmn:Conditional"),
        click: (e) => createParentNode(e, "bpmn:Conditional"),
      },
    },
  });

  return actions;
};
