import inherits from "inherits";

import CommandInterceptor from "diagram-js/lib/command/CommandInterceptor";

import { getBusinessObject } from "../../../util/ModelUtil";

import { isAny } from "../util/ModelingUtil";

import { isLabel } from "../../../util/LabelUtil";

let LOW_PRIORITY = 500;

/**
 * Replace intermediate event with boundary event when creating or moving results in attached event.
 */
export default function AttachEventBehavior(bpmnReplace, injector) {
  injector.invoke(CommandInterceptor, this);

  this._bpmnReplace = bpmnReplace;

  let self = this;

  this.postExecuted(
    "elements.create",
    LOW_PRIORITY,
    function (context) {
      let elements = context.elements;

      elements = elements.filter(function (shape) {
        let host = shape.host;

        return shouldReplace(shape, host);
      });

      if (elements.length !== 1) {
        return;
      }

      elements
        .map(function (element) {
          return elements.indexOf(element);
        })
        .forEach(function (index) {
          let host = elements[index];

          context.elements[index] = self.replaceShape(elements[index], host);
        });
    },
    true
  );

  this.preExecute(
    "elements.move",
    LOW_PRIORITY,
    function (context) {
      let shapes = context.shapes,
        host = context.newHost;

      if (shapes.length !== 1) {
        return;
      }

      let shape = shapes[0];

      if (shouldReplace(shape, host)) {
        context.shapes = [self.replaceShape(shape, host)];
      }
    },
    true
  );
}

AttachEventBehavior.$inject = ["bpmnReplace", "injector"];

inherits(AttachEventBehavior, CommandInterceptor);

AttachEventBehavior.prototype.replaceShape = function (shape, host) {
  let eventDefinition = getEventDefinition(shape);

  let boundaryEvent = {
    type: "bpmn:BoundaryEvent",
    host: host,
  };

  if (eventDefinition) {
    boundaryEvent.eventDefinitionType = eventDefinition.$type;
  }

  return this._bpmnReplace.replaceElement(shape, boundaryEvent, {
    layoutConnection: false,
  });
};

// helpers //////////

function getEventDefinition(element) {
  let businessObject = getBusinessObject(element),
    eventDefinitions = businessObject.eventDefinitions;

  return eventDefinitions && eventDefinitions[0];
}

function shouldReplace(shape, host) {
  return (
    !isLabel(shape) &&
    isAny(shape, [
      "bpmn:IntermediateThrowEvent",
      "bpmn:IntermediateCatchEvent",
    ]) &&
    !!host
  );
}
