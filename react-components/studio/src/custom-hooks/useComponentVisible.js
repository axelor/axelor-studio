import { useState, useEffect, useRef } from "react";
import { useStore } from "../store/context";

export function useComponentVisible(initialIsVisible) {
	const [isComponentVisible, setIsComponentVisible] =
		useState(initialIsVisible);
	const { update } = useStore();
	const ref = useRef(null);

	const handleHideDropdown = (event) => {
		if (event.key === "Escape") {
			setIsComponentVisible(false);
			update((draft) => {
				draft.highlightedOption = null;
			});
		}
	};

	const handleClickOutside = (event) => {
		if (ref.current && !ref.current.contains(event.target)) {
			setIsComponentVisible(false);
		}
	};

	useEffect(() => {
		document.addEventListener("keydown", handleHideDropdown, true);
		document.addEventListener("click", handleClickOutside, true);
		return () => {
			document.removeEventListener("keydown", handleHideDropdown, true);
			document.removeEventListener("click", handleClickOutside, true);
		};
	});

	return { ref, isComponentVisible, setIsComponentVisible };
}
