import CustomPalette from "./CustomPalette";
import CustomContextPadProvider from "./CustomContextPadProvider";
import CustomRules from "./CustomRules";

export default {
  __init__: ["contextPadProvider", "customRules", "paletteProvider"],
  contextPadProvider: ["type", CustomContextPadProvider],
  paletteProvider: ["type", CustomPalette],
  customRules: ["type", CustomRules],
};
