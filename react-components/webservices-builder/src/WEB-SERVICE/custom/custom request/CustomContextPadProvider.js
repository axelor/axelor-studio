import inherits from 'inherits';

import ContextPadProvider from '../../main/baml-js/lib/features/context-pad/ContextPadProvider';

export default function CustomContextPadProvider(config, injector) {
  injector.invoke(ContextPadProvider, this);

  this.getContextPadEntries = function(element) {
    const actions = {};
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
