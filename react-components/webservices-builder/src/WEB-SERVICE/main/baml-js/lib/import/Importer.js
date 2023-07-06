import BpmnTreeWalker from "./BpmnTreeWalker";

import { isFunction } from "min-dash";

/**
 * Import the definitions into a diagram.
 *
 * Errors and warnings are reported through the specified callback.
 *
 * @param  {djs.Diagram} diagram
 * @param  {ModdleElement<Process-actions>} definitions
 * @param  {ModdleElement<BPMNDiagram>} [bpmnDiagram] the diagram to be rendered
 * (if not provided, the first one will be rendered)
 * @param  {Function} done the callback, invoked with (err, [ warning ]) once the import is done
 */
export function importBpmnDiagram(diagram, definitions, bpmnDiagram, done) {
  if (isFunction(bpmnDiagram)) {
    done = bpmnDiagram;
    bpmnDiagram = null;
  }

  let importer, eventBus, translate;

  let error,
    warnings = [];

  /**
   * Walk the diagram semantically, importing (=drawing)
   * all elements you encounter.
   *
   * @param {ModdleElement<Process-actions>} definitions
   * @param {ModdleElement<BPMNDiagram>} bpmnDiagram
   */
  function render(definitions, bpmnDiagram) {
    let visitor = {
      root: function (element) {
        return importer.add(element);
      },

      element: function (element, parentShape) {
        return importer.add(element, parentShape);
      },

      error: function (message, context) {
        warnings.push({ message: message, context: context });
      },
    };

    let walker = new BpmnTreeWalker(visitor, translate);

    // traverse BPMN 2.0 document model,
    // starting at definitions
    walker.handleDefinitions(definitions, bpmnDiagram);
  }

  try {
    importer = diagram.get("bpmnImporter");
    eventBus = diagram.get("eventBus");
    translate = diagram.get("translate");

    eventBus.fire("import.render.start", { definitions: definitions });

    render(definitions, bpmnDiagram);

    eventBus.fire("import.render.complete", {
      error: error,
      warnings: warnings,
    });
  } catch (e) {
    error = e;
  }

  done(error, warnings);
}
