import React from "react";

export function useDebounceEffect(handler, interval, initializer) {
	const isMounted = React.useRef(false);
	const hasStarted = React.useRef(false);
	React.useEffect(() => {
		if (isMounted.current) {
			if (!hasStarted.current) {
				initializer && initializer();
				hasStarted.current = true;
			}
			const timer = setTimeout(() => {
				hasStarted.current = false;
				handler();
			}, interval);
			return () => clearTimeout(timer);
		}
		isMounted.current = true;
	}, [handler, interval, initializer]);
}
