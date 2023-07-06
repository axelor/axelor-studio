import { isString, isFunction, assign } from "min-dash";
import { Moddle } from "../moddle";
import { Reader, Writer } from "../moddle-xml";

/**
 * A sub class of {@link Moddle} with support for import and export of BPMN 2.0 xml files.
 *
 * @class BpmnModdle
 * @extends Moddle
 *
 * @param {Object|Array} packages to use for instantiating the model
 * @param {Object} [options] additional options to pass over
 */
function BpmnModdle(packages, options) {
  Moddle.call(this, packages, options);
}

BpmnModdle.prototype = Object.create(Moddle.prototype);

/**
 * Instantiates a BPMN model tree from a given xml string.
 *
 * @param {String}   xmlStr
 * @param {String}   [typeName='bpmn:Process-actions'] name of the root element
 * @param {Object}   [options]  options to pass to the underlying reader
 * @param {Function} done       callback that is invoked with (err, result, parseContext)
 *                              once the import completes
 */
BpmnModdle.prototype.fromXML = function (xmlStr, typeName, options, done) {
  if (!isString(typeName)) {
    done = options;
    options = typeName;
    typeName = "bpmn:Process-actions";
  }

  if (isFunction(options)) {
    done = options;
    options = {};
  }

  let reader = new Reader(assign({ model: this, lax: true }, options));
  let rootHandler = reader.handler(typeName);

  reader.fromXML(xmlStr, rootHandler, done);
};

/**
 * Serializes a BPMN 2.0 object tree to XML.
 *
 * @param {String}   element    the root element, typically an instance of `bpmn:Process-actions`
 * @param {Object}   [options]  to pass to the underlying writer
 * @param {Function} done       callback invoked with (err, xmlStr) once the import completes
 */
BpmnModdle.prototype.toXML = function (element, options, done) {
  if (isFunction(options)) {
    done = options;
    options = {};
  }

  let writer = new Writer(options);

  let result;
  let err;

  try {
    result = writer.toXML(element);
  } catch (e) {
    err = e;
  }

  return done(err, result);
};

let name = "BPMN20";
let uri = "http://www.omg.org/spec/BPMN/20100524/MODEL";
let associations = [];
let types = [
  {
    name: "Interface",
    superClass: ["RootElement"],
    properties: [
      {
        name: "name",
        isAttr: true,
        type: "String",
      },
      {
        name: "operations",
        type: "Operation",
        isMany: true,
      },
      {
        name: "implementationRef",
        type: "String",
        isAttr: true,
      },
    ],
  },
  {
    name: "Operation",
    superClass: ["BaseElement"],
    properties: [
      {
        name: "name",
        isAttr: true,
        type: "String",
      },
      {
        name: "inMessageRef",
        type: "Message",
        isReference: true,
      },
      {
        name: "outMessageRef",
        type: "Message",
        isReference: true,
      },
      {
        name: "errorRef",
        type: "Error",
        isMany: true,
        isReference: true,
      },
      {
        name: "implementationRef",
        type: "String",
        isAttr: true,
      },
    ],
  },
  {
    name: "EndPoint",
    superClass: ["RootElement"],
  },
  {
    name: "Auditing",
    superClass: ["BaseElement"],
  },
  {
    name: "GlobalTask",
    superClass: ["CallableElement"],
    properties: [
      {
        name: "resources",
        type: "ResourceRole",
        isMany: true,
      },
    ],
  },
  {
    name: "Monitoring",
    superClass: ["BaseElement"],
  },
  {
    name: "Performer",
    superClass: ["ResourceRole"],
  },
  {
    name: "Process-action",
    superClass: ["FlowElementsContainer", "CallableElement"],
    properties: [
      {
        name: "targetModel",
        isAttr: true,
        type: "String",
      },
      {
        name: "sourceModel",
        isAttr: true,
        type: "String",
      },
      // {
      //   name: "staticCompile",
      //   isAttr: true,
      //   type: "Boolean",
      //   default: true,
      // },
    ],
  },
  {
    name: "Gateway",
    isAbstract: true,
    superClass: ["FlowNode"],
    properties: [
      {
        name: "gatewayDirection",
        type: "GatewayDirection",
        default: "Unspecified",
        isAttr: true,
      },
    ],
  },
  {
    name: "EventBasedGateway",
    superClass: ["Gateway"],
    properties: [
      {
        name: "instantiate",
        default: false,
        isAttr: true,
        type: "Boolean",
      },
      {
        name: "eventGatewayType",
        type: "EventBasedGatewayType",
        isAttr: true,
        default: "Exclusive",
      },
    ],
  },
  {
    name: "Parameter",
    superClass: ["Element"],
    meta: {
      allowedIn: ["bpmn:Function", "bpmn:Query"],
    },
    properties: [
      {
        name: "id",
        isAttr: true,
        type: "String",
      },
      {
        name: "target",
        isAttr: true,
        type: "String",
      },
      {
        name: "expression",
        isAttr: true,
        type: "String",
      },
    ],
  },
  {
    name: "Query",
    superClass: ["Gateway"],
    properties: [
      {
        name: "target",
        isAttr: true,
        type: "String",
      },
      {
        name: "expression",
        isAttr: true,
        type: "String",
      },
      {
        name: "expressionValue",
        isAttr: true,
        type: "String",
      },
      {
        name: "model",
        isAttr: true,
        type: "String",
      },
      {
        name: "isJson",
        isAttr: true,
        type: "Boolean",
        default: false,
      },
      {
        name: "returnType",
        isAttr: true,
        type: "String",
      },
      {
        name: "values",
        type: "Element",
        isMany: true,
      },
    ],
  },
  {
    name: "RootElement",
    isAbstract: true,
    superClass: ["BaseElement"],
  },
  {
    name: "Relationship",
    superClass: ["BaseElement"],
    properties: [
      {
        name: "type",
        isAttr: true,
        type: "String",
      },
      {
        name: "direction",
        type: "RelationshipDirection",
        isAttr: true,
      },
      {
        name: "source",
        isMany: true,
        isReference: true,
        type: "Element",
      },
      {
        name: "target",
        isMany: true,
        isReference: true,
        type: "Element",
      },
    ],
  },
  {
    name: "BaseElement",
    isAbstract: true,
    properties: [
      {
        name: "id",
        isAttr: true,
        type: "String",
        isId: true,
      },
      {
        name: "documentation",
        type: "Documentation",
        isMany: true,
      },
      {
        name: "extensionDefinitions",
        type: "ExtensionDefinition",
        isMany: true,
        isReference: true,
      },
      {
        name: "assignElements",
        type: "AssignElements",
      },
      {
        name: "parameters",
        type: "Parameters",
      },
    ],
  },
  {
    name: "Extension",
    properties: [
      {
        name: "mustUnderstand",
        default: false,
        isAttr: true,
        type: "Boolean",
      },
      {
        name: "definition",
        type: "ExtensionDefinition",
        isAttr: true,
        isReference: true,
      },
    ],
  },
  {
    name: "ExtensionDefinition",
    properties: [
      {
        name: "name",
        isAttr: true,
        type: "String",
      },
      {
        name: "extensionAttributeDefinitions",
        type: "ExtensionAttributeDefinition",
        isMany: true,
      },
    ],
  },
  {
    name: "ExtensionAttributeDefinition",
    properties: [
      {
        name: "name",
        isAttr: true,
        type: "String",
      },
      {
        name: "type",
        isAttr: true,
        type: "String",
      },
      {
        name: "isReference",
        default: false,
        isAttr: true,
        type: "Boolean",
      },
      {
        name: "extensionDefinition",
        type: "ExtensionDefinition",
        isAttr: true,
        isReference: true,
      },
    ],
  },
  {
    name: "AssignElements",
    properties: [
      {
        name: "valueRef",
        isAttr: true,
        isReference: true,
        type: "Element",
      },
      {
        name: "values",
        type: "Element",
        isMany: true,
      },
      {
        name: "extensionAttributeDefinition",
        type: "ExtensionAttributeDefinition",
        isAttr: true,
        isReference: true,
      },
    ],
  },
  {
    name: "Parameters",
    properties: [
      {
        name: "values",
        type: "Element",
        isMany: true,
      },
    ],
  },
  {
    name: "FlowElement",
    isAbstract: true,
    superClass: ["BaseElement"],
    properties: [
      {
        name: "name",
        isAttr: true,
        type: "String",
      },
      {
        name: "auditing",
        type: "Auditing",
      },
      {
        name: "monitoring",
        type: "Monitoring",
      },
      {
        name: "categoryValueRef",
        type: "CategoryValue",
        isMany: true,
        isReference: true,
      },
    ],
  },
  {
    name: "SequenceFlow",
    superClass: ["FlowElement"],
    properties: [
      {
        name: "isImmediate",
        isAttr: true,
        type: "Boolean",
      },
      {
        name: "conditionExpression",
        type: "Expression",
        xml: {
          serialize: "xsi:type",
        },
      },
      {
        name: "sourceRef",
        type: "FlowNode",
        isAttr: true,
        isReference: true,
      },
      {
        name: "targetRef",
        type: "FlowNode",
        isAttr: true,
        isReference: true,
      },
    ],
  },
  {
    name: "FlowElementsContainer",
    isAbstract: true,
    superClass: ["BaseElement"],
    properties: [
      {
        name: "laneSets",
        type: "LaneSet",
        isMany: true,
      },
      {
        name: "flowElements",
        type: "FlowElement",
        isMany: true,
      },
    ],
  },
  {
    name: "CallableElement",
    isAbstract: true,
    superClass: ["RootElement"],
    properties: [
      {
        name: "name",
        isAttr: true,
        type: "String",
      },
      {
        name: "ioSpecification",
        type: "InputOutputSpecification",
        xml: {
          serialize: "property",
        },
      },
      {
        name: "supportedInterfaceRef",
        type: "Interface",
        isMany: true,
        isReference: true,
      },
      {
        name: "ioBinding",
        type: "InputOutputBinding",
        isMany: true,
        xml: {
          serialize: "property",
        },
      },
    ],
  },
  {
    name: "FlowNode",
    isAbstract: true,
    superClass: ["FlowElement"],
    properties: [
      // {
      //   name: "incoming",
      //   type: "SequenceFlow",
      //   isMany: true,
      //   isReference: true,
      // },
      // {
      //   name: "outgoing",
      //   type: "SequenceFlow",
      //   isMany: true,
      //   isReference: true,
      // },
      {
        name: "lanes",
        type: "Lane",
        isVirtual: true,
        isMany: true,
        isReference: true,
      },
    ],
  },
  {
    name: "CorrelationPropertyRetrievalExpression",
    superClass: ["BaseElement"],
    properties: [
      {
        name: "messagePath",
        type: "FormalExpression",
      },
      {
        name: "messageRef",
        type: "Message",
        isAttr: true,
        isReference: true,
      },
    ],
  },
  {
    name: "CorrelationPropertyBinding",
    superClass: ["BaseElement"],
    properties: [
      {
        name: "dataPath",
        type: "FormalExpression",
      },
      {
        name: "correlationPropertyRef",
        type: "CorrelationProperty",
        isAttr: true,
        isReference: true,
      },
    ],
  },
  {
    name: "Resource",
    superClass: ["RootElement"],
    properties: [
      {
        name: "name",
        isAttr: true,
        type: "String",
      },
      {
        name: "resourceParameters",
        type: "ResourceParameter",
        isMany: true,
      },
    ],
  },
  {
    name: "ResourceParameter",
    superClass: ["BaseElement"],
    properties: [
      {
        name: "name",
        isAttr: true,
        type: "String",
      },
      {
        name: "isRequired",
        isAttr: true,
        type: "Boolean",
      },
      {
        name: "type",
        type: "ItemDefinition",
        isAttr: true,
        isReference: true,
      },
    ],
  },
  {
    name: "CorrelationSubscription",
    superClass: ["BaseElement"],
    properties: [
      {
        name: "correlationKeyRef",
        type: "CorrelationKey",
        isAttr: true,
        isReference: true,
      },
      {
        name: "correlationPropertyBinding",
        type: "CorrelationPropertyBinding",
        isMany: true,
      },
    ],
  },
  {
    name: "MessageFlow",
    superClass: ["BaseElement"],
    properties: [
      {
        name: "name",
        isAttr: true,
        type: "String",
      },
      {
        name: "sourceRef",
        type: "InteractionNode",
        isAttr: true,
        isReference: true,
      },
      {
        name: "targetRef",
        type: "InteractionNode",
        isAttr: true,
        isReference: true,
      },
      {
        name: "messageRef",
        type: "Message",
        isAttr: true,
        isReference: true,
      },
    ],
  },
  {
    name: "MessageFlowAssociation",
    superClass: ["BaseElement"],
    properties: [
      {
        name: "innerMessageFlowRef",
        type: "MessageFlow",
        isAttr: true,
        isReference: true,
      },
      {
        name: "outerMessageFlowRef",
        type: "MessageFlow",
        isAttr: true,
        isReference: true,
      },
    ],
  },
  {
    name: "InteractionNode",
    isAbstract: true,
    properties: [
      {
        name: "incomingConversationLinks",
        type: "ConversationLink",
        isVirtual: true,
        isMany: true,
        isReference: true,
      },
      {
        name: "outgoingConversationLinks",
        type: "ConversationLink",
        isVirtual: true,
        isMany: true,
        isReference: true,
      },
    ],
  },
  {
    name: "Participant",
    superClass: ["InteractionNode", "BaseElement"],
    properties: [
      {
        name: "name",
        isAttr: true,
        type: "String",
      },
      {
        name: "interfaceRef",
        type: "Interface",
        isMany: true,
        isReference: true,
      },
      {
        name: "participantMultiplicity",
        type: "ParticipantMultiplicity",
      },
      {
        name: "endPointRefs",
        type: "EndPoint",
        isMany: true,
        isReference: true,
      },
      {
        name: "processRef",
        type: "Process-action",
        isAttr: true,
        isReference: true,
      },
    ],
  },
  {
    name: "ParticipantAssociation",
    superClass: ["BaseElement"],
    properties: [
      {
        name: "innerParticipantRef",
        type: "Participant",
        isAttr: true,
        isReference: true,
      },
      {
        name: "outerParticipantRef",
        type: "Participant",
        isAttr: true,
        isReference: true,
      },
    ],
  },
  {
    name: "ParticipantMultiplicity",
    properties: [
      {
        name: "minimum",
        default: 0,
        isAttr: true,
        type: "Integer",
      },
      {
        name: "maximum",
        default: 1,
        isAttr: true,
        type: "Integer",
      },
    ],
    superClass: ["BaseElement"],
  },
  {
    name: "Collaboration",
    superClass: ["RootElement"],
    properties: [
      {
        name: "name",
        isAttr: true,
        type: "String",
      },
      {
        name: "isClosed",
        isAttr: true,
        type: "Boolean",
      },
      {
        name: "participants",
        type: "Participant",
        isMany: true,
      },
      {
        name: "messageFlows",
        type: "MessageFlow",
        isMany: true,
      },
      {
        name: "artifacts",
        type: "Artifact",
        isMany: true,
      },
      {
        name: "conversations",
        type: "ConversationNode",
        isMany: true,
      },
      {
        name: "conversationAssociations",
        type: "ConversationAssociation",
      },
      {
        name: "participantAssociations",
        type: "ParticipantAssociation",
        isMany: true,
      },
      {
        name: "messageFlowAssociations",
        type: "MessageFlowAssociation",
        isMany: true,
      },
      {
        name: "correlationKeys",
        type: "CorrelationKey",
        isMany: true,
      },
      {
        name: "choreographyRef",
        type: "Choreography",
        isMany: true,
        isReference: true,
      },
      {
        name: "conversationLinks",
        type: "ConversationLink",
        isMany: true,
      },
    ],
  },
  {
    name: "ChoreographyActivity",
    isAbstract: true,
    superClass: ["FlowNode"],
    properties: [
      {
        name: "participantRef",
        type: "Participant",
        isMany: true,
        isReference: true,
      },
      {
        name: "initiatingParticipantRef",
        type: "Participant",
        isAttr: true,
        isReference: true,
      },
      {
        name: "correlationKeys",
        type: "CorrelationKey",
        isMany: true,
      },
      {
        name: "loopType",
        type: "ChoreographyLoopType",
        default: "None",
        isAttr: true,
      },
    ],
  },
  {
    name: "CallChoreography",
    superClass: ["ChoreographyActivity"],
    properties: [
      {
        name: "calledChoreographyRef",
        type: "Choreography",
        isAttr: true,
        isReference: true,
      },
      {
        name: "participantAssociations",
        type: "ParticipantAssociation",
        isMany: true,
      },
    ],
  },
  {
    name: "SubChoreography",
    superClass: ["ChoreographyActivity", "FlowElementsContainer"],
    properties: [
      {
        name: "artifacts",
        type: "Artifact",
        isMany: true,
      },
    ],
  },
  {
    name: "ChoreographyTask",
    superClass: ["ChoreographyActivity"],
    properties: [
      {
        name: "messageFlowRef",
        type: "MessageFlow",
        isMany: true,
        isReference: true,
      },
    ],
  },
  {
    name: "Choreography",
    superClass: ["Collaboration", "FlowElementsContainer"],
  },
  {
    name: "GlobalChoreographyTask",
    superClass: ["Choreography"],
    properties: [
      {
        name: "initiatingParticipantRef",
        type: "Participant",
        isAttr: true,
        isReference: true,
      },
    ],
  },
  {
    name: "TextAnnotation",
    superClass: ["Artifact"],
    properties: [
      {
        name: "text",
        type: "String",
      },
      {
        name: "textFormat",
        default: "text/plain",
        isAttr: true,
        type: "String",
      },
    ],
  },
  {
    name: "Activity",
    isAbstract: true,
    superClass: ["FlowNode"],
    properties: [
      {
        name: "isForCompensation",
        default: false,
        isAttr: true,
        type: "Boolean",
      },
      {
        name: "ioSpecification",
        type: "InputOutputSpecification",
        xml: {
          serialize: "property",
        },
      },
      {
        name: "boundaryEventRefs",
        type: "BoundaryEvent",
        isMany: true,
        isReference: true,
      },
      {
        name: "properties",
        type: "Property",
        isMany: true,
      },
      {
        name: "dataInputAssociations",
        type: "DataInputAssociation",
        isMany: true,
      },
      {
        name: "dataOutputAssociations",
        type: "DataOutputAssociation",
        isMany: true,
      },
      {
        name: "startQuantity",
        default: 1,
        isAttr: true,
        type: "Integer",
      },
      {
        name: "resources",
        type: "ResourceRole",
        isMany: true,
      },
      {
        name: "completionQuantity",
        default: 1,
        isAttr: true,
        type: "Integer",
      },
    ],
  },
  {
    name: "Conditional",
    superClass: ["Activity", "FlowElementsContainer", "InteractionNode"],
    properties: [
      {
        name: "triggeredByEvent",
        default: false,
        isAttr: true,
        type: "Boolean",
      },
      {
        name: "artifacts",
        type: "Artifact",
        isMany: true,
      },
      {
        name: "expression",
        isAttr: true,
        type: "String",
      },
      {
        name: "expressionValue",
        isAttr: true,
        type: "String",
      },
    ],
  },
  {
    name: "Loop",
    superClass: ["Activity", "FlowElementsContainer", "InteractionNode"],
    properties: [
      {
        name: "triggeredByEvent",
        default: false,
        isAttr: true,
        type: "Boolean",
      },
      {
        name: "artifacts",
        type: "Artifact",
        isMany: true,
      },
      {
        name: "target",
        isAttr: true,
        type: "String",
      },
      {
        name: "expression",
        isAttr: true,
        type: "String",
      },
      {
        name: "expressionValue",
        isAttr: true,
        type: "String",
      },
    ],
  },
  {
    name: "Task",
    superClass: ["Activity", "InteractionNode"],
  },
  {
    name: "Mapper",
    superClass: ["Task"],
    properties: [
      {
        name: "script",
        type: "Script",
      },
      {
        name: "scriptMeta",
        type: "ScriptMeta",
      },
      {
        name: "sourceField",
        isAttr: true,
        type: "String",
      },
      {
        name: "targetField",
        isAttr: true,
        type: "String",
      },
    ],
  },
  {
    name: "Script",
    superClass: ["BaseElement"],
    properties: [
      {
        name: "value",
        isBody: true,
        type: "String",
      },
    ],
  },
  {
    name: "ScriptMeta",
    superClass: ["BaseElement"],
    properties: [
      {
        name: "value",
        isBody: true,
        type: "String",
      },
    ],
  },
  {
    name: "Function",
    superClass: ["Task"],
    properties: [
      {
        name: "returnType",
        isAttr: true,
        type: "String",
      },
      {
        name: "functionName",
        isAttr: true,
        type: "String",
      },
      {
        name: "values",
        type: "Element",
        isMany: true,
      },
    ],
  },
  {
    name: "GlobalScriptTask",
    superClass: ["GlobalTask"],
    properties: [
      {
        name: "scriptLanguage",
        isAttr: true,
        type: "String",
      },
      {
        name: "script",
        isAttr: true,
        type: "String",
      },
    ],
  },
  {
    name: "GlobalBusinessRuleTask",
    superClass: ["GlobalTask"],
    properties: [
      {
        name: "implementation",
        isAttr: true,
        type: "String",
      },
    ],
  },
  {
    name: "ComplexBehaviorDefinition",
    superClass: ["BaseElement"],
    properties: [
      {
        name: "condition",
        type: "FormalExpression",
      },
      {
        name: "event",
        type: "ImplicitThrowEvent",
      },
    ],
  },
  {
    name: "ResourceRole",
    superClass: ["BaseElement"],
    properties: [
      {
        name: "resourceRef",
        type: "Resource",
        isReference: true,
      },
      {
        name: "resourceParameterBindings",
        type: "ResourceParameterBinding",
        isMany: true,
      },
      {
        name: "resourceAssignmentExpression",
        type: "ResourceAssignmentExpression",
      },
      {
        name: "name",
        isAttr: true,
        type: "String",
      },
    ],
  },
  {
    name: "ResourceParameterBinding",
    properties: [
      {
        name: "expression",
        type: "Expression",
        xml: {
          serialize: "xsi:type",
        },
      },
      {
        name: "parameterRef",
        type: "ResourceParameter",
        isAttr: true,
        isReference: true,
      },
    ],
    superClass: ["BaseElement"],
  },
  {
    name: "ResourceAssignmentExpression",
    properties: [
      {
        name: "expression",
        type: "Expression",
        xml: {
          serialize: "xsi:type",
        },
      },
    ],
    superClass: ["BaseElement"],
  },
  {
    name: "Import",
    properties: [
      {
        name: "importType",
        isAttr: true,
        type: "String",
      },
      {
        name: "location",
        isAttr: true,
        type: "String",
      },
      {
        name: "namespace",
        isAttr: true,
        type: "String",
      },
    ],
  },
  {
    name: "Process-actions",
    superClass: ["BaseElement"],
    properties: [
      {
        name: "name",
        isAttr: true,
        type: "String",
      },
      {
        name: "targetNamespace",
        isAttr: true,
        type: "String",
      },
      {
        name: "expressionLanguage",
        default: "http://www.w3.org/1999/XPath",
        isAttr: true,
        type: "String",
      },
      {
        name: "typeLanguage",
        default: "http://www.w3.org/2001/XMLSchema",
        isAttr: true,
        type: "String",
      },
      {
        name: "imports",
        type: "Import",
        isMany: true,
      },
      {
        name: "extensions",
        type: "Extension",
        isMany: true,
      },
      {
        name: "rootElements",
        type: "RootElement",
        isMany: true,
      },
      {
        name: "diagrams",
        isMany: true,
        type: "bpmndi:BPMNDiagram",
      },
      {
        name: "exporter",
        isAttr: true,
        type: "String",
      },
      {
        name: "relationships",
        type: "Relationship",
        isMany: true,
      },
      {
        name: "exporterVersion",
        isAttr: true,
        type: "String",
      },
    ],
  },
];
let enumerations = [
  {
    name: "ProcessType",
    literalValues: [
      {
        name: "None",
      },
      {
        name: "Public",
      },
      {
        name: "Private",
      },
    ],
  },
  {
    name: "GatewayDirection",
    literalValues: [
      {
        name: "Unspecified",
      },
      {
        name: "Converging",
      },
      {
        name: "Diverging",
      },
      {
        name: "Mixed",
      },
    ],
  },
  {
    name: "EventBasedGatewayType",
    literalValues: [
      {
        name: "Parallel",
      },
      {
        name: "Exclusive",
      },
    ],
  },
  {
    name: "RelationshipDirection",
    literalValues: [
      {
        name: "None",
      },
      {
        name: "Forward",
      },
      {
        name: "Backward",
      },
      {
        name: "Both",
      },
    ],
  },
  {
    name: "ItemKind",
    literalValues: [
      {
        name: "Physical",
      },
      {
        name: "Information",
      },
    ],
  },
  {
    name: "ChoreographyLoopType",
    literalValues: [
      {
        name: "None",
      },
      {
        name: "Standard",
      },
      {
        name: "MultiInstanceSequential",
      },
      {
        name: "MultiInstanceParallel",
      },
    ],
  },
  {
    name: "AssociationDirection",
    literalValues: [
      {
        name: "None",
      },
      {
        name: "One",
      },
      {
        name: "Both",
      },
    ],
  },
  {
    name: "MultiInstanceBehavior",
    literalValues: [
      {
        name: "None",
      },
      {
        name: "One",
      },
      {
        name: "All",
      },
      {
        name: "Complex",
      },
    ],
  },
  {
    name: "AdHocOrdering",
    literalValues: [
      {
        name: "Parallel",
      },
      {
        name: "Sequential",
      },
    ],
  },
];
let prefix = "bpmn";
let xml = {
  tagAlias: "lowerCase",
  typePrefix: "t",
};
let BpmnPackage = {
  name: name,
  uri: uri,
  associations: associations,
  types: types,
  enumerations: enumerations,
  prefix: prefix,
  xml: xml,
};

let name$1 = "BPMNDI";
let uri$1 = "http://www.omg.org/spec/BPMN/20100524/DI";
let types$1 = [
  {
    name: "BPMNDiagram",
    properties: [
      {
        name: "plane",
        type: "BPMNPlane",
        redefines: "di:Diagram#rootElement",
      },
      {
        name: "labelStyle",
        type: "BPMNLabelStyle",
        isMany: true,
      },
    ],
    superClass: ["di:Diagram"],
  },
  {
    name: "BPMNPlane",
    properties: [
      {
        name: "bpmnElement",
        isAttr: true,
        isReference: true,
        type: "bpmn:BaseElement",
        redefines: "di:DiagramElement#modelElement",
      },
    ],
    superClass: ["di:Plane"],
  },
  {
    name: "BPMNShape",
    properties: [
      {
        name: "bpmnElement",
        isAttr: true,
        isReference: true,
        type: "bpmn:BaseElement",
        redefines: "di:DiagramElement#modelElement",
      },
      {
        name: "isHorizontal",
        isAttr: true,
        type: "Boolean",
      },
      {
        name: "isExpanded",
        isAttr: true,
        type: "Boolean",
      },
      {
        name: "isMarkerVisible",
        isAttr: true,
        type: "Boolean",
      },
      {
        name: "label",
        type: "BPMNLabel",
      },
      {
        name: "isMessageVisible",
        isAttr: true,
        type: "Boolean",
      },
      {
        name: "participantBandKind",
        type: "ParticipantBandKind",
        isAttr: true,
      },
      {
        name: "choreographyActivityShape",
        type: "BPMNShape",
        isAttr: true,
        isReference: true,
      },
    ],
    superClass: ["di:LabeledShape"],
  },
  {
    name: "BPMNEdge",
    properties: [
      {
        name: "label",
        type: "BPMNLabel",
      },
      {
        name: "bpmnElement",
        isAttr: true,
        isReference: true,
        type: "bpmn:BaseElement",
        redefines: "di:DiagramElement#modelElement",
      },
      {
        name: "sourceElement",
        isAttr: true,
        isReference: true,
        type: "di:DiagramElement",
        redefines: "di:Edge#source",
      },
      {
        name: "targetElement",
        isAttr: true,
        isReference: true,
        type: "di:DiagramElement",
        redefines: "di:Edge#target",
      },
      {
        name: "messageVisibleKind",
        type: "MessageVisibleKind",
        isAttr: true,
        default: "initiating",
      },
    ],
    superClass: ["di:LabeledEdge"],
  },
  {
    name: "BPMNLabel",
    properties: [
      {
        name: "labelStyle",
        type: "BPMNLabelStyle",
        isAttr: true,
        isReference: true,
        redefines: "di:DiagramElement#style",
      },
    ],
    superClass: ["di:Label"],
  },
  {
    name: "BPMNLabelStyle",
    properties: [
      {
        name: "font",
        type: "dc:Font",
      },
    ],
    superClass: ["di:Style"],
  },
];
let enumerations$1 = [
  {
    name: "ParticipantBandKind",
    literalValues: [
      {
        name: "top_initiating",
      },
      {
        name: "middle_initiating",
      },
      {
        name: "bottom_initiating",
      },
      {
        name: "top_non_initiating",
      },
      {
        name: "middle_non_initiating",
      },
      {
        name: "bottom_non_initiating",
      },
    ],
  },
  {
    name: "MessageVisibleKind",
    literalValues: [
      {
        name: "initiating",
      },
      {
        name: "non_initiating",
      },
    ],
  },
];
let associations$1 = [];
let prefix$1 = "bpmndi";
let BpmnDiPackage = {
  name: name$1,
  uri: uri$1,
  types: types$1,
  enumerations: enumerations$1,
  associations: associations$1,
  prefix: prefix$1,
};

let name$2 = "DC";
let uri$2 = "http://www.omg.org/spec/DD/20100524/DC";
let types$2 = [
  {
    name: "Boolean",
  },
  {
    name: "Integer",
  },
  {
    name: "Real",
  },
  {
    name: "String",
  },
  {
    name: "Font",
    properties: [
      {
        name: "name",
        type: "String",
        isAttr: true,
      },
      {
        name: "size",
        type: "Real",
        isAttr: true,
      },
      {
        name: "isBold",
        type: "Boolean",
        isAttr: true,
      },
      {
        name: "isItalic",
        type: "Boolean",
        isAttr: true,
      },
      {
        name: "isUnderline",
        type: "Boolean",
        isAttr: true,
      },
      {
        name: "isStrikeThrough",
        type: "Boolean",
        isAttr: true,
      },
    ],
  },
  {
    name: "Point",
    properties: [
      {
        name: "x",
        type: "Real",
        default: "0",
        isAttr: true,
      },
      {
        name: "y",
        type: "Real",
        default: "0",
        isAttr: true,
      },
    ],
  },
  {
    name: "Bounds",
    properties: [
      {
        name: "x",
        type: "Real",
        default: "0",
        isAttr: true,
      },
      {
        name: "y",
        type: "Real",
        default: "0",
        isAttr: true,
      },
      {
        name: "width",
        type: "Real",
        isAttr: true,
      },
      {
        name: "height",
        type: "Real",
        isAttr: true,
      },
    ],
  },
];
let prefix$2 = "dc";
let associations$2 = [];
let DcPackage = {
  name: name$2,
  uri: uri$2,
  types: types$2,
  prefix: prefix$2,
  associations: associations$2,
};

let name$3 = "DI";
let uri$3 = "http://www.omg.org/spec/DD/20100524/DI";
let types$3 = [
  {
    name: "DiagramElement",
    isAbstract: true,
    properties: [
      {
        name: "id",
        type: "String",
        isAttr: true,
        isId: true,
      },
      {
        name: "extension",
        type: "Extension",
      },
      {
        name: "owningDiagram",
        type: "Diagram",
        isReadOnly: true,
        isVirtual: true,
        isReference: true,
      },
      {
        name: "owningElement",
        type: "DiagramElement",
        isReadOnly: true,
        isVirtual: true,
        isReference: true,
      },
      {
        name: "modelElement",
        isReadOnly: true,
        isVirtual: true,
        isReference: true,
        type: "Element",
      },
      {
        name: "style",
        type: "Style",
        isReadOnly: true,
        isVirtual: true,
        isReference: true,
      },
      {
        name: "ownedElement",
        type: "DiagramElement",
        isReadOnly: true,
        isVirtual: true,
        isMany: true,
      },
    ],
  },
  {
    name: "Node",
    isAbstract: true,
    superClass: ["DiagramElement"],
  },
  {
    name: "Edge",
    isAbstract: true,
    superClass: ["DiagramElement"],
    properties: [
      {
        name: "source",
        type: "DiagramElement",
        isReadOnly: true,
        isVirtual: true,
        isReference: true,
      },
      {
        name: "target",
        type: "DiagramElement",
        isReadOnly: true,
        isVirtual: true,
        isReference: true,
      },
      {
        name: "waypoint",
        isUnique: false,
        isMany: true,
        type: "dc:Point",
        xml: {
          serialize: "xsi:type",
        },
      },
    ],
  },
  {
    name: "Diagram",
    isAbstract: true,
    properties: [
      {
        name: "id",
        type: "String",
        isAttr: true,
        isId: true,
      },
      {
        name: "rootElement",
        type: "DiagramElement",
        isReadOnly: true,
        isVirtual: true,
      },
      {
        name: "name",
        isAttr: true,
        type: "String",
      },
      {
        name: "documentation",
        isAttr: true,
        type: "String",
      },
      {
        name: "resolution",
        isAttr: true,
        type: "Real",
      },
      {
        name: "ownedStyle",
        type: "Style",
        isReadOnly: true,
        isVirtual: true,
        isMany: true,
      },
    ],
  },
  {
    name: "Shape",
    isAbstract: true,
    superClass: ["Node"],
    properties: [
      {
        name: "bounds",
        type: "dc:Bounds",
      },
    ],
  },
  {
    name: "Plane",
    isAbstract: true,
    superClass: ["Node"],
    properties: [
      {
        name: "planeElement",
        type: "DiagramElement",
        subsettedProperty: "DiagramElement-ownedElement",
        isMany: true,
      },
    ],
  },
  {
    name: "LabeledEdge",
    isAbstract: true,
    superClass: ["Edge"],
    properties: [
      {
        name: "ownedLabel",
        type: "Label",
        isReadOnly: true,
        subsettedProperty: "DiagramElement-ownedElement",
        isVirtual: true,
        isMany: true,
      },
    ],
  },
  {
    name: "LabeledShape",
    isAbstract: true,
    superClass: ["Shape"],
    properties: [
      {
        name: "ownedLabel",
        type: "Label",
        isReadOnly: true,
        subsettedProperty: "DiagramElement-ownedElement",
        isVirtual: true,
        isMany: true,
      },
    ],
  },
  {
    name: "Label",
    isAbstract: true,
    superClass: ["Node"],
    properties: [
      {
        name: "bounds",
        type: "dc:Bounds",
      },
    ],
  },
  {
    name: "Style",
    isAbstract: true,
    properties: [
      {
        name: "id",
        type: "String",
        isAttr: true,
        isId: true,
      },
    ],
  },
  {
    name: "Extension",
    properties: [
      {
        name: "values",
        type: "Element",
        isMany: true,
      },
    ],
  },
];
let associations$3 = [];
let prefix$3 = "di";
let xml$1 = {
  tagAlias: "lowerCase",
};
let DiPackage = {
  name: name$3,
  uri: uri$3,
  types: types$3,
  associations: associations$3,
  prefix: prefix$3,
  xml: xml$1,
};

let name$4 = "bpmn.io colors for BPMN";
let uri$4 = "http://bpmn.io/schema/bpmn/biocolor/1.0";
let prefix$4 = "bioc";
let types$4 = [
  {
    name: "ColoredShape",
    extends: ["bpmndi:BPMNShape"],
    properties: [
      {
        name: "stroke",
        isAttr: true,
        type: "String",
      },
      {
        name: "fill",
        isAttr: true,
        type: "String",
      },
    ],
  },
  {
    name: "ColoredEdge",
    extends: ["bpmndi:BPMNEdge"],
    properties: [
      {
        name: "stroke",
        isAttr: true,
        type: "String",
      },
      {
        name: "fill",
        isAttr: true,
        type: "String",
      },
    ],
  },
];
let enumerations$2 = [];
let associations$4 = [];
let BiocPackage = {
  name: name$4,
  uri: uri$4,
  prefix: prefix$4,
  types: types$4,
  enumerations: enumerations$2,
  associations: associations$4,
};

let packages = {
  bpmn: BpmnPackage,
  bpmndi: BpmnDiPackage,
  dc: DcPackage,
  di: DiPackage,
  bioc: BiocPackage,
};

function simple(additionalPackages, options) {
  let pks = assign({}, packages, additionalPackages);

  return new BpmnModdle(pks, options);
}

export default simple;
