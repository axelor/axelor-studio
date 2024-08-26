import { translate } from "./utils";

export const VAR_TYPES = {
  BUILT_IN: 'built-in',
  CUSTOM: 'custom',
};

export const VAR_OPTIONS = [
  {
    title: translate('Built In Variables'),
    name: 'Built In Variables',
    type: VAR_TYPES.BUILT_IN,
  },
  {
    title: translate('Custom Variables'),
    name: 'Custom Variables',
    type: VAR_TYPES.CUSTOM,
  },
];
