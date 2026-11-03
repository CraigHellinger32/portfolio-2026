import { useState } from "react";
import Link from "next/link";
import useDarkMode from "../../hooks/useDarkMode";
import DarkModeButton from "./DarkModeButton";
import BurgerMenuButton from "./BurgerMenuButton";
import styles from "./PageHeader.module.css";

export default function PageHeader({ title, description }) {
	const dark = useDarkMode();
	const [menuOpen, setMenuOpen] = useState(false);

	function toggleTheme() {
		document.documentElement.dataset.theme = dark ? "light" : "dark";
		document.documentElement.dataset.themePreference = dark ? "light" : "dark";
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
			<Link href="/" className={styles.brand}>
				<h1 className={styles.title}>{title}</h1>
				<p className={styles.description}>{description}</p>
			</Link>
			<div className={styles.menuControl}>
				<BurgerMenuButton open={menuOpen} onToggle={() => setMenuOpen(!menuOpen)} />
			</div>
		</header>
	);
}