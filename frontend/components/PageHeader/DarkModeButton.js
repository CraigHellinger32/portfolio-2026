import Image from "next/image";
import styles from "./PageHeader.module.css";

export default function DarkModeButton({ dark, onToggle }) {
	return (
		<button
			type="button"
			className={`${styles.control} ${styles.themeButton}`}
			onClick={onToggle}
			aria-pressed={dark}
			aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
		>
			<Image src={dark ? "/header/light-mode.svg" : "/header/dark-mode.svg"} alt="" width={24} height={24} unoptimized />
			<span className={styles.themeLabel}>{dark ? "Light" : "Dark"} <span>mode</span></span>
		</button>
	);
}