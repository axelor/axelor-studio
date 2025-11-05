import React from "react";
import { ThemeProvider } from "@axelor/ui";
import BAML from "./BAML";
import { useAppTheme } from "./Theme/hooks/useAopTheme";

function App() {
  const { theme, options } = useAppTheme();
    useEffect(() => {
        // Console warnings
        console.warn('%c⚠️ BAML DEPRECATED', 'color: orange; font-size: 16px; font-weight: bold;');
        console.warn('BAML functionality is deprecated and will be removed in version 4.0.');
        console.warn('Please migrate to BPM Studio for business process modeling.');
    }, []);
  return (
    <div className="App">
      <ThemeProvider theme={theme} options={options}>
        <BAML />
      </ThemeProvider>
    </div>
  );
}

export default App;