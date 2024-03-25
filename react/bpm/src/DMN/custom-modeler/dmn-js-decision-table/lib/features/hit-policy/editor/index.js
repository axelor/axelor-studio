import ContextMenu from "table-js/lib/features/context-menu";
import HitPolicyEditingProvider from "./HitPolicyEditingProvider";
const init = {
  __depends__: [ContextMenu],
  __init__: ["hitPolicyProvider"],
  hitPolicyProvider: ["type", HitPolicyEditingProvider],
};
export default init;
