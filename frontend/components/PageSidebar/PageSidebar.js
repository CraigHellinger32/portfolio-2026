import dynamic from "next/dynamic";
import styles from "./PageSidebar.module.css";

const RedactedContent = dynamic(() => import("../RedactedImageButton/RedactedContent"));

export default function PageSidebar({ content, onUnlock }) {
	if (!content?.trim()) return null;

	return (
		<aside className={styles.sidebar} aria-label="Case study highlights">
			<RedactedContent html={content} onUnlock={onUnlock} />
		</aside>
	);
}