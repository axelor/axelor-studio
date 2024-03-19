import CustomPropertiesProvider from "./providers/CustomPropertiesProvider";
import CustomPaletteProvider from "./providers/CustomPaletteProvider";

const init = {
  __init__: ["propertiesProvider", "paletteProvider"],
  propertiesProvider: ["type", CustomPropertiesProvider],
  paletteProvider: ["type", CustomPaletteProvider],
};
export default init;
