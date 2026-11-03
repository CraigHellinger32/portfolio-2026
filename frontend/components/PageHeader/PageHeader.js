import { useEffect, useState } from "react";
import useDarkMode from "../../hooks/useDarkMode";
import DarkModeButton from "./DarkModeButton";
import BurgerMenuButton from "./BurgerMenuButton";
import styles from "./PageHeader.module.css";

export default function PageHeader({ title, description }) {
	const dark = useDarkMode();
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