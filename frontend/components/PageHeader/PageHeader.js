import { useEffect, useState, useSyncExternalStore } from "react";
import DarkModeButton from "./DarkModeButton";
import BurgerMenuButton from "./BurgerMenuButton";
import styles from "./PageHeader.module.css";

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

export default function PageHeader({ title, description }) {
	const dark = useSyncExternalStore(subscribeTheme, getTheme, () => false);
	const [menuOpen, setMenuOpen] = useState(false);

	useEffect(() => {
		document.documentElement.dataset.theme = dark ? "dark" : "light";
	}, [dark]);

	function toggleTheme() {
		document.documentElement.dataset.theme = dark ? "light" : "dark";
		try {
			window.localStorage.setItem("pf2026-theme", dark ? "light" : "dark");
		} catch {}
		window.dispatchEvent(new Event("pf2026-theme-change"));
	}

	return (
		<header className={styles.header}>
			<div className={styles.themeControl}>
				<DarkModeButton dark={dark} onToggle={toggleTheme} />
			</div>
			<div className={styles.brand}>
				<h1 className={styles.title}>{title}</h1>
				<p className={styles.description}>{description}</p>
			</div>
			<div className={styles.menuControl}>
				<BurgerMenuButton open={menuOpen} onToggle={() => setMenuOpen(!menuOpen)} />
			</div>
		</header>
	);
}