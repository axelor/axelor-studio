import CustomPaletteProvider from "./providers/CustomPaletteProvider";

const init = {
  __init__: [ "paletteProvider"],
  paletteProvider: ["type", CustomPaletteProvider],
};
export default init;
