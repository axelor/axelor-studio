import CustomContextPadProvider from './CustomContextPadProvider';
import CustomRules from './CustomRules';

export default {
  __init__: ['contextPadProvider', 'customRules', 'paletteProvider'],
  contextPadProvider: ['type', CustomContextPadProvider],
  customRules: ['type', CustomRules],
};
