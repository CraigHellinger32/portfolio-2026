import styles from "./PageHeader.module.css";

export default function BurgerMenuButton({ open, onToggle, controls }) {
	return (
		<button
			type="button"
			className={`${styles.control} ${styles.menuButton}`}
			onClick={onToggle}
			aria-expanded={controls ? open : undefined}
			aria-pressed={controls ? undefined : open}
			aria-controls={controls}
		>
			<span className={styles.menuIcon} data-open={open} aria-hidden="true" />
			<span>{open ? "Close" : "Menu"}</span>
		</button>
	);
}