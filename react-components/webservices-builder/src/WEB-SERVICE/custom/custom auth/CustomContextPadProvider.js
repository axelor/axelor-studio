import inherits from 'inherits';
import ContextPadProvider from '../../main/baml-js/lib/features/context-pad/ContextPadProvider';
import {is} from '../../main/baml-js/lib/util/ModelUtil';
import {assign} from 'min-dash';

export default function CustomContextPadProvider(
    config,
    injector,
    connect,
    create,
    translate,
) {
  injector.invoke(ContextPadProvider, this);

  this.getContextPadEntries = function(element) {
    const modeling = this._modeling;
    const elementFactory = this._elementFactory;
    const autoPlace = this._autoPlace;
    const create = this._create;
    const businessObject = element.businessObject;
    function removeElement(e) {
      modeling.removeElements([element]);
    }

    const actions = {};

    if (element.type === 'label') {
      return actions;
    }

    function appendAction(type, className, title, options) {
      if (typeof title !== 'string') {
        options = title;
        title = 'Append ' + type.replace(/^bpmn:/, '');
      }

      function appendStart(event, element) {
        // if (shouldConnectNode(element)) {
        const shape = elementFactory.createShape(
            assign({type: type}, options),
        );
        create.start(event, shape, {
          source: element,
        });
        // }
      }

      const append = autoPlace ?
        function(event, element) {
          // if (shouldConnectNode(element)) {
          const shape = elementFactory.createShape(
              assign({type: type}, options),
          );
          autoPlace.append(element, shape);
        } : // }
        appendStart;

      return {
        group: 'model',
        className: className,
        title: title,
        action: {
          dragstart: appendStart,
          click: append,
        },
      };
    }
    if (is(businessObject, 'bpmn:FlowNode')) {
      if (!is(businessObject, 'bpmn:EndEvent')) {
        assign(actions, {
          'append.append-mapper': appendAction(
              'bpmn:Mapper',
              'bpmn-icon-task',
              'Append Mapper',
          ),
        });
        assign(actions, {
          delete: {
            group: 'edit',
            className: 'bpmn-icon-trash',
            title: 'Remove',
            action: {
              click: removeElement,
              dragstart: removeElement,
            },
          },
        });
      }
    }
    return actions;
  };
}

inherits(CustomContextPadProvider, ContextPadProvider);

CustomContextPadProvider.$inject = [
  'config.contextPad',
  'injector',
  'eventBus',
  'contextPad',
  'modeling',
  'elementFactory',
  'connect',
  'create',
  'popupMenu',
  'canvas',
  'rules',
  'translate',
];
