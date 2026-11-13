import RedactedContent from "../RedactedImageButton/RedactedContent";
import styles from "./PageSidebar.module.css";

export default function PageSidebar({ content, onUnlock }) {
	if (!content?.trim()) return null;

	return (
		<aside className={styles.sidebar} aria-label="Case study highlights">
			<RedactedContent html={content} onUnlock={onUnlock} />
		</aside>
	);
}