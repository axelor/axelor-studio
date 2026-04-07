import { assign } from "min-dash";
import { translate } from "@studio/shared/i18n";

interface DrdFactory {
  create(type: string, attrs?: Record<string, unknown>): Record<string, unknown>;
}

interface ElementFactory {
  createShape(attrs: Record<string, unknown>): Record<string, unknown>;
}

interface CreateService {
  start(event: Event, shape: Record<string, unknown>): void;
}

interface ToolService {
  activateHand?(event: Event): void;
  activateSelection?(event: Event): void;
}

interface PaletteProviderInstance {
  _palette: PaletteServiceType;
  _create: CreateService;
  _elementFactory: ElementFactory;
  _handTool: ToolService;
  _lassoTool: ToolService;
  _translate: typeof translate;
  _drdFactory: DrdFactory;
  getPaletteEntries(element: Record<string, unknown>): Record<string, PaletteEntry>;
}

interface PaletteServiceType {
  registerProvider(provider: PaletteProviderInstance): void;
}

interface PaletteEntry {
  group: string;
  className?: string;
  title?: string;
  separator?: boolean;
  action?: Record<string, (event: Event) => void>;
}

/**
 * A palette provider for DMN elements.
 */
export default function PaletteProvider(
  this: PaletteProviderInstance,
  palette: PaletteServiceType,
  create: CreateService,
  elementFactory: ElementFactory,
  handTool: ToolService,
  lassoTool: ToolService,
  _translate: typeof translate,
  drdFactory: DrdFactory,
): void {
  this._palette = palette;
  this._create = create;
  this._elementFactory = elementFactory;
  this._handTool = handTool;
  this._lassoTool = lassoTool;
  this._translate = _translate;
  this._drdFactory = drdFactory;
  palette.registerProvider(this);
}
PaletteProvider.$inject = [
  "palette",
  "create",
  "elementFactory",
  "handTool",
  "lassoTool",
  "translate",
  "drdFactory",
];

PaletteProvider.prototype.getPaletteEntries = function (
  this: PaletteProviderInstance,
  _element: Record<string, unknown>,
): Record<string, PaletteEntry> {
  const actions: Record<string, PaletteEntry> = {};
  const create = this._create;
  const elementFactory = this._elementFactory;
  const handTool = this._handTool;
  const lassoTool = this._lassoTool;
  const drdFactory = this._drdFactory;

  function createAction(
    type: string,
    group: string,
    className: string,
    title: string,
    options?: Record<string, unknown>,
  ): PaletteEntry {
    function createListener(event: Event) {
      const shape = elementFactory.createShape(
        assign(
          {
            type: type,
          },
          options,
        ),
      );
      if (type === "dmn:Decision" && shape) {
        const businessObject = shape.businessObject as Record<string, unknown> | undefined;
        const table = drdFactory.create("dmn:DecisionTable");
        if (businessObject) {
          businessObject.decisionLogic = table;
        }
        table.$parent = businessObject;
        const output = drdFactory.create("dmn:OutputClause");
        output.typeRef = "string";
        output.$parent = table;
        table.output = [output];
        const input = drdFactory.create("dmn:InputClause");
        input.$parent = table;
        const inputExpression = drdFactory.create("dmn:LiteralExpression", {
          typeRef: "string",
        });
        input.inputExpression = inputExpression;
        inputExpression.$parent = input;
        table.input = [input];
      }
      create.start(event, shape);
    }

    return {
      group: group,
      className: className,
      title: title,
      action: {
        dragstart: createListener,
        click: createListener,
      },
    };
  }

  assign(actions, {
    "hand-tool": {
      group: "tools",
      className: "dmn-icon-hand-tool",
      title: translate("Activate the hand tool"),
      action: {
        click: function click(event: Event) {
          handTool.activateHand?.(event);
        },
      },
    },
    "lasso-tool": {
      group: "tools",
      className: "dmn-icon-lasso-tool",
      title: translate("Activate the lasso tool"),
      action: {
        click: function click(event: Event) {
          lassoTool.activateSelection?.(event);
        },
      },
    },
    "tool-separator": {
      group: "tools",
      separator: true,
    },
    "create.decision": createAction(
      "dmn:Decision",
      "drd",
      "dmn-icon-decision",
      translate("Create Decision Table"),
    ),
    "create.input-data": createAction(
      "dmn:InputData",
      "drd",
      "dmn-icon-input-data",
      translate("Create Input Data"),
    ),
    "create.knowledge-source": createAction(
      "dmn:KnowledgeSource",
      "drd",
      "dmn-icon-knowledge-source",
      translate("Create Knowledge Source"),
    ),
    "create.business-knowledge-model": createAction(
      "dmn:BusinessKnowledgeModel",
      "drd",
      "dmn-icon-business-knowledge",
      translate("Create Knowledge Model"),
    ),
  });
  return actions;
};
