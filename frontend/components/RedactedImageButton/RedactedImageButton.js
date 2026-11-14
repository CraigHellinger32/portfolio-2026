import { useEffect, useRef } from "react";
import styles from "./RedactedImageButton.module.css";

export default function RedactedImageButton({ children, alt, onUnlock }) {
	const buttonRef = useRef(null);
	const label = alt ? `Locked image: ${alt}` : "Locked image";

	useEffect(() => {
		const observer = new ResizeObserver((entries) => {
			for (const { target, contentRect: { width, height } } of entries) {
				if (!width || !height) continue;
				target.style.setProperty("--redacted-scale-x", String((width + 5) / width));
				target.style.setProperty("--redacted-scale-y", String((height + 5) / height));
			}
		});
		buttonRef.current.querySelectorAll("img").forEach((image) => observer.observe(image));
		return () => observer.disconnect();
	}, [children]);

	return (
		<button
			ref={buttonRef}
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
