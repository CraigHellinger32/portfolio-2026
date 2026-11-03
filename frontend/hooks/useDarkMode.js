import { useSyncExternalStore } from "react";

function subscribeTheme(onChange) {
	window.addEventListener("storage", onChange);
	window.addEventListener("pf2026-theme-change", onChange);
	return () => {
		window.removeEventListener("storage", onChange);
		window.removeEventListener("pf2026-theme-change", onChange);
	};
}

function getTheme() {
	try {
		return window.localStorage.getItem("pf2026-theme") === "dark";
	} catch {
		return document.documentElement.dataset.theme === "dark";
	}
}

export default function useDarkMode() {
	return useSyncExternalStore(subscribeTheme, getTheme, () => false);
}