import styles from "./PageSidebar.module.css";

export default function PageSidebar({ content }) {
	if (!content?.trim()) return null;

	return (
		<aside
			className={styles.sidebar}
			aria-label="Case study highlights"
			dangerouslySetInnerHTML={{ __html: content }}
		/>
	);
}