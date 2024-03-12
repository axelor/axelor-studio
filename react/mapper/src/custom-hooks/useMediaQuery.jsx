import { useCallback, useEffect, useMemo, useState } from "react";

export function useMediaQuery(query) {
  const media = useMemo(() => window.matchMedia(query), [query]);
  const [state, setState] = useState(media.matches);
  const handleChange = useCallback(() => setState(media.matches), [media]);

  useEffect(() => {
    const listener = () => handleChange();
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [handleChange, media]);

  return state;
}
