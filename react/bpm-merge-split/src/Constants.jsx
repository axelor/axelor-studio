import { translate } from "./utils";

export const LOADING_TEXT = [
    "Analyzing BPMN models...",
    "Processing elements...",
    "Identifying duplicate tasks...",
    "Optimizing process flow...",
    "Resolving conflicts...",
    "Validating model...",
    "Generating documentation...",
    "Ensuring compliance...",
    "Testing integration...",
    "Deploying process...",
    "Monitoring performance...",
    "Implementing feedback...",
    "Finalizing integration...",
    "Completing process...",
  ]

export const MODEL_GRID_COLUMNS = [
  { name: "name", title: translate("Name"), type: "String", width: 400 },
  { name: "code", title: translate("Code"), type: "String", width: 400 },
];
