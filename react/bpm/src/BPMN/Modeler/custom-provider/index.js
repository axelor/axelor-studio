import CustomReplaceMenuProvider from "./providers/ReplaceMenuProvider";
import BpmnRenderer from "./features/renderer/BpmnRenderer";

const init = {
  __init__: [ "replaceMenuProvider"],
  replaceMenuProvider: ["type", CustomReplaceMenuProvider],
  bpmnRenderer: ["type", BpmnRenderer],
};

export default init;
