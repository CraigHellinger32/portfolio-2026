import styles from "./CaseStudyPagination.module.css";

export default function CaseStudyPagination({ previous, next }) {
	return (
		<nav className={styles.pagination} aria-label="Case study pagination">
			<button type="button" disabled={!previous} onClick={previous}>
				<span className={`${styles.paginationIcon} ${styles.previousIcon}`} aria-hidden="true" />
				Previous<span className="visually-hidden"> case study</span>
			</button>
			<button type="button" disabled={!next} onClick={next}>
				Next case study
				<span className={`${styles.paginationIcon} ${styles.nextIcon}`} aria-hidden="true" />
			</button>
		</nav>
	);
}
