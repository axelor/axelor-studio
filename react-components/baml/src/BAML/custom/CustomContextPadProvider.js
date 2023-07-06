import inherits from "inherits";

import ContextPadProvider from "../main/baml-js/lib/features/context-pad/ContextPadProvider";

import { isAny } from "../main/baml-js/lib/features/modeling/util/ModelingUtil";
import { is } from "../main/baml-js/lib/util/ModelUtil";
import { assign } from "min-dash";

export default function CustomContextPadProvider(
  config,
  injector,
  connect,
  create,
  translate
) {
  injector.invoke(ContextPadProvider, this);

  this.getContextPadEntries = function (element) {
    let modeling = this._modeling;
    let elementFactory = this._elementFactory;
    let autoPlace = this._autoPlace;
    let create = this._create;
    let translate = this._translate;
    let connect = this._connect;
    let businessObject = element.businessObject;

    function startConnect(event, element, autoActivate) {
      connect.start(event, element, autoActivate);
    }
    function removeElement(e) {
      modeling.removeElements([element]);
    }

    let actions = {};

    if (element.type === "label") {
      return actions;
    }

    function createParentNode(type) {
      let loop = elementFactory.createShape({
        type,
        x: 0,
        y: 0,
        isExpanded: true,
      });
      autoPlace.append(element, loop);
    }

    function appendAction(type, className, title, options) {
      if (typeof title !== "string") {
        options = title;
        title = translate("Append") + " " +type.replace(/^bpmn:/, "");
      }

      function appendStart(event, element) {
        // if (shouldConnectNode(element)) {
        let shape = elementFactory.createShape(assign({ type: type }, options));
        create.start(event, shape, {
          source: element,
        });
        // }
      }

      let append = autoPlace
        ? function (event, element) {
            // if (shouldConnectNode(element)) {
            let shape = elementFactory.createShape(
              assign({ type: type }, options)
            );
            autoPlace.append(element, shape);
          }
        : // }
          appendStart;

      return {
        group: "model",
        className: className,
        title,
        action: {
          dragstart: appendStart,
          click: append,
        },
      };
    }
    if (isAny(businessObject, ["bpmn:FlowNode", "bpmn:InteractionNode"])) {
      assign(actions, {
        connect: {
          group: "connect",
          className: "bpmn-icon-connection-multi",
          title: translate("Connect using transition"),
          action: {
            click: startConnect,
            dragstart: startConnect,
          },
        },
      });
    }
    if (is(businessObject, "bpmn:FlowNode")) {
      if (!is(businessObject, "bpmn:EndEvent")) {
        assign(
          actions,
          {
            "append.append-mapper": appendAction(
              "bpmn:Mapper",
              "bpmn-icon-task",
              translate("Append mapper")
            ),
          },
          {
            "append.query": appendAction(
              "bpmn:Query",
              "bpmn-icon-gateway-xor",
              translate("Append query")
            ),
          }
        );
      }
    }

    assign(actions, {
      "connect-conditional": {
        group: "activity",
        className: "bpmn-icon-sequential-mi-marker",
        title: translate("Create condition"),
        action: {
          dragstart: () => createParentNode("bpmn:Conditional"),
          click: () => createParentNode("bpmn:Conditional"),
        },
      },
    });

    assign(actions, {
      "connect-loop": {
        group: "activity",
        className: "bpmn-icon-loop-marker",
        title: translate("Create loop"),
        action: {
          dragstart: () => createParentNode("bpmn:Loop"),
          click: () => createParentNode("bpmn:Loop"),
        },
      },
    });

    assign(actions, {
      delete: {
        group: "edit",
        className: "bpmn-icon-trash",
        title: "Remove",
        action: {
          click: removeElement,
          dragstart: removeElement,
        },
      },
    });
    return actions;
  };
}

inherits(CustomContextPadProvider, ContextPadProvider);

CustomContextPadProvider.$inject = [
  "config.contextPad",
  "injector",
  "eventBus",
  "contextPad",
  "modeling",
  "elementFactory",
  "connect",
  "create",
  "popupMenu",
  "canvas",
  "rules",
  "translate",
];
