import ReadOnly from "./ReadOnly";

const init = {
  __init__: ["readOnly"] as const,
  readOnly: ["type", ReadOnly] as const,
};

export default init;
