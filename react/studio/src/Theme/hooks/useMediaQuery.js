import { useCallback, useEffect, useMemo, useState } from "react";

export function useMediaQuery(query) {
  const media = useMemo(() => window.matchMedia(query), [query]);
  const [state, setState] = useState(media.matches);
  const handleChange = useCallback(() => setState(media.matches), [media]);

  useEffect(() => {
    media.addEventListener("change", handleChange);
    return () => {
      media.removeEventListener("change", handleChange);
    };
  }, [handleChange, media]);

  return state;
}
