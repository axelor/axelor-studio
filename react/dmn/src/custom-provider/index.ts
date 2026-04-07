import CustomPaletteProvider from "./providers/CustomPaletteProvider";

interface DmnJsModule {
  __init__: string[];
  paletteProvider: [string, typeof CustomPaletteProvider];
}

const init: DmnJsModule = {
  __init__: ["paletteProvider"],
  paletteProvider: ["type", CustomPaletteProvider],
};
export default init;
