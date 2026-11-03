import { useSyncExternalStore } from "react";

export function subscribeTheme(onChange) {
	const media = window.matchMedia("(prefers-color-scheme: dark)");
	window.addEventListener("storage", onChange);
	window.addEventListener("pf2026-theme-change", onChange);
	media.addEventListener("change", onChange);
	return () => {
		window.removeEventListener("storage", onChange);
		window.removeEventListener("pf2026-theme-change", onChange);
		media.removeEventListener("change", onChange);
	};
}

export function getTheme() {
	try {
		const saved = window.localStorage.getItem("pf2026-theme");
		if (saved === "light" || saved === "dark") return saved === "dark";
	} catch {
		const preference = document.documentElement.dataset.themePreference;
		if (preference === "light" || preference === "dark") return preference === "dark";
	}
	return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export default function useDarkMode() {
	return useSyncExternalStore(subscribeTheme, getTheme, () => false);
}