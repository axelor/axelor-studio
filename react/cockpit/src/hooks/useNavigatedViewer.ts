/**
 * React hook for bpmn-js NavigatedViewer lifecycle (D-05).
 *
 * Creates a NavigatedViewer on mount, destroys on unmount.
 * Pitfall 3: viewer.destroy() in cleanup prevents "container already in use" errors.
 */

import { useEffect, useRef, type RefObject } from "react";
import NavigatedViewer from "bpmn-js/lib/NavigatedViewer";

export function useNavigatedViewer(
  containerRef: RefObject<HTMLDivElement | null>,
) {
  const viewerRef = useRef<InstanceType<typeof NavigatedViewer> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const viewer = new NavigatedViewer({ container: containerRef.current });
    viewerRef.current = viewer;
    return () => {
      viewer.destroy();
      viewerRef.current = null;
    };
  }, [containerRef]);

  return viewerRef;
}
