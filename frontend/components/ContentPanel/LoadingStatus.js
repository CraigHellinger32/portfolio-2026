import styles from "./ContentPanel.module.css";

export default function LoadingStatus() {
	return (
		<p className={styles.loadingStatus} role="status">
			<svg className={styles.loader} viewBox="0 70 200 60" width="50" height="15" aria-hidden="true">
				<rect className={styles.loaderFirst} x="25" y="85" width="30" height="30" />
				<rect className={styles.loaderSecond} x="85" y="85" width="30" height="30" />
				<rect className={styles.loaderThird} x="145" y="85" width="30" height="30" />
			</svg>
			Loading content...
		</p>
	);
}
