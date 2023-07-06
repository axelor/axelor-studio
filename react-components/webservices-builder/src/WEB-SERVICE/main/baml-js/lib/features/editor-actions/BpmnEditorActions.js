import inherits from "inherits";

import EditorActions from "diagram-js/lib/features/editor-actions/EditorActions";

import { filter } from "min-dash";

import { is } from "../../util/ModelUtil";

import { getBBox } from "diagram-js/lib/util/Elements";

/**
 * Registers and executes BPMN specific editor actions.
 *
 * @param {Injector} injector
 */
export default function BpmnEditorActions(injector) {
  injector.invoke(EditorActions, this);
}

inherits(BpmnEditorActions, EditorActions);

BpmnEditorActions.$inject = ["injector"];

/**
 * Register default actions.
 *
 * @param {Injector} injector
 */
BpmnEditorActions.prototype._registerDefaultActions = function (injector) {
  // (0) invoke super method

  EditorActions.prototype._registerDefaultActions.call(this, injector);

  // (1) retrieve optional components to integrate with

  let canvas = injector.get("canvas", false);
  let elementRegistry = injector.get("elementRegistry", false);
  let selection = injector.get("selection", false);
  let spaceTool = injector.get("spaceTool", false);
  let lassoTool = injector.get("lassoTool", false);
  let handTool = injector.get("handTool", false);
  let globalConnect = injector.get("globalConnect", false);
  let distributeElements = injector.get("distributeElements", false);
  let alignElements = injector.get("alignElements", false);
  let directEditing = injector.get("directEditing", false);
  let searchPad = injector.get("searchPad", false);
  let modeling = injector.get("modeling", false);

  // (2) check components and register actions

  if (canvas && elementRegistry && selection) {
    this._registerAction("selectElements", function () {
      // select all elements except for the invisible
      // root element
      let rootElement = canvas.getRootElement();

      let elements = elementRegistry.filter(function (element) {
        return element !== rootElement;
      });

      selection.select(elements);

      return elements;
    });
  }

  if (spaceTool) {
    this._registerAction("spaceTool", function () {
      spaceTool.toggle();
    });
  }

  if (lassoTool) {
    this._registerAction("lassoTool", function () {
      lassoTool.toggle();
    });
  }

  if (handTool) {
    this._registerAction("handTool", function () {
      handTool.toggle();
    });
  }

  if (globalConnect) {
    this._registerAction("globalConnectTool", function () {
      globalConnect.toggle();
    });
  }

  if (selection && distributeElements) {
    this._registerAction("distributeElements", function (opts) {
      let currentSelection = selection.get(),
        type = opts.type;

      if (currentSelection.length) {
        distributeElements.trigger(currentSelection, type);
      }
    });
  }

  if (selection && alignElements) {
    this._registerAction("alignElements", function (opts) {
      let currentSelection = selection.get(),
        aligneableElements = [],
        type = opts.type;

      if (currentSelection.length) {
        aligneableElements = filter(currentSelection, function (element) {
          return !is(element, "bpmn:Lane");
        });

        alignElements.trigger(aligneableElements, type);
      }
    });
  }

  if (selection && modeling) {
    this._registerAction("setColor", function (opts) {
      let currentSelection = selection.get();

      if (currentSelection.length) {
        modeling.setColor(currentSelection, opts);
      }
    });
  }

  if (selection && directEditing) {
    this._registerAction("directEditing", function () {
      let currentSelection = selection.get();

      if (currentSelection.length) {
        directEditing.activate(currentSelection[0]);
      }
    });
  }

  if (searchPad) {
    this._registerAction("find", function () {
      searchPad.toggle();
    });
  }

  if (canvas && modeling) {
    this._registerAction("moveToOrigin", function () {
      let rootElement = canvas.getRootElement(),
        boundingBox,
        elements;

      if (is(rootElement, "bpmn:Collaboration")) {
        elements = elementRegistry.filter(function (element) {
          return is(element.parent, "bpmn:Collaboration");
        });
      } else {
        elements = elementRegistry.filter(function (element) {
          return element !== rootElement && !is(element.parent, "bpmn:Loop");
        });
      }

      boundingBox = getBBox(elements);

      modeling.moveElements(
        elements,
        { x: -boundingBox.x, y: -boundingBox.y },
        rootElement
      );
    });
  }
};
