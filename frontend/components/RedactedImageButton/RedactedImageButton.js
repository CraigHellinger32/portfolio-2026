import styles from "./RedactedImageButton.module.css";

export default function RedactedImageButton({ children, alt, onUnlock }) {
	const label = alt ? `Locked image: ${alt}` : "Locked image";

	return (
		<button
			type="button"
			className={styles.button}
			aria-label={label}
			aria-disabled={!onUnlock}
			onClick={onUnlock}
		>
			{children}
			<span className={styles.lock} aria-hidden="true" />
		</button>
	);
}
