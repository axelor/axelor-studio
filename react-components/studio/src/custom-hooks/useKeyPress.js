import { useEffect, useRef, useCallback } from "react";

export const useKeyPress = (key, callback, allowCaps = true, node = null) => {
	// implement the callback ref pattern
	const callbackRef = useRef(callback);
	useEffect(() => {
		callbackRef.current = callback;
	});

	// handle what happens on key press
	const handleKeyPress = useCallback(
		async (event) => {
			// check if one of the key is part of the ones we want
			if (
				(allowCaps ? event.key?.toLowerCase() : event.key) === key &&
				event.ctrlKey
			) {
				event.preventDefault();
				if (event.target?.tagName === "INPUT" && (key === "s" || key === "S")) {
					event.target.blur();
					await new Promise((resolve) => {
						setTimeout(() => {
							resolve();
						}, 500);
					});
				}
				callbackRef.current(event);
			}
		},
		[key, allowCaps]
	);

	useEffect(() => {
		// target is either the provided node or the document
		const targetNode = node ?? document;
		// attach the event listener
		targetNode && targetNode.addEventListener("keydown", handleKeyPress);

		// remove the event listener
		return () =>
			targetNode && targetNode.removeEventListener("keydown", handleKeyPress);
	}, [handleKeyPress, node]);
};
