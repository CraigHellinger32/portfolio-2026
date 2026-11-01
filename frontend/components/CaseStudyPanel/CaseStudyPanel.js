import styles from "./CaseStudyPanel.module.css";

export default function CaseStudyPanel({ entry, accent, open, id }) {
	return (
		<section
			id={id}
			className={`${styles.panel} ${styles[accent]} ${open ? styles.open : ""}`}
			aria-labelledby={`${id}-title`}
			aria-hidden={!open}
			inert={!open}
		>
			<div className={styles.clip}>
				<div className={styles.inner}>
					<h1 id={`${id}-title`}>{entry?.title}</h1>
					<p>
						Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer
						vel lectus vitae erat tincidunt consequat. Nulla facilisi. Sed
						vitae mauris quis erat consectetur dignissim.
					</p>
					<p>
						Praesent commodo cursus magna, vel scelerisque nisl consectetur
						et. Donec ullamcorper nulla non metus auctor fringilla. Aenean
						lacinia bibendum nulla sed consectetur.
					</p>
				</div>
			</div>
		</section>
	);
}