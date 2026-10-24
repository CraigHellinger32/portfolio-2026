import { gql } from "@apollo/client";
import CaseStudyCard from "../components/CaseStudyCard";
import styles from "../components/CaseStudyCard.module.css";

export default function FrontPageTemplate(props) {
	const { title, description } = props.data.generalSettings;
	const caseStudies = props.data.caseStudies.nodes;
	const clients = props.data.clients.nodes;
	const skills = props.data.skills.nodes;
	const clientNumberStart = caseStudies.length + 1;
	const skillNumberStart = clientNumberStart + clients.length;

	return (
		<main className={styles.page}>
			<header className="site-header">
				<h1 className="site-title">{title}</h1>
				<p className="site-description">{description}</p>
			</header>

			<section className={styles.section}>
				<h2 className={styles.sectionTitle}>Case studies</h2>
				<ul className={styles.caseStudyGrid}>
					{caseStudies.map((entry, index) => (
						<li key={entry.id}>
							<CaseStudyCard entry={entry} number={index + 1} />
						</li>
					))}
				</ul>
			</section>

			<section className={styles.section}>
				<h2 className={styles.sectionTitle}>Clients</h2>
				<ul className={styles.clientGrid}>
					{clients.map((entry, index) => (
						<li key={entry.id}>
							<CaseStudyCard
								entry={entry}
								number={clientNumberStart + index}
								size="client"
								brandLogo={entry.featuredImage?.node?.sourceUrl}
								brandLogoAlt={entry.featuredImage?.node?.altText || ""}
								brandName={entry.title}
							/>
						</li>
					))}
				</ul>
			</section>

			<section className={styles.section}>
				<h2 className={styles.sectionTitle}>Skills</h2>
				<ul className={styles.skillGrid}>
					{skills.map((entry, index) => (
						<li key={entry.id}>
							<CaseStudyCard
								entry={entry}
								number={skillNumberStart + index}
								size="skill"
								showExcerpt={false}
							/>
						</li>
					))}
				</ul>
			</section>
		</main>
	);
}

FrontPageTemplate.query = gql`
	query GetFrontPage {
		generalSettings {
			title
			description
		}
		caseStudies(first: 20) {
			nodes {
				id
				title
				uri
				excerpt
				featuredImage {
					node {
						sourceUrl
					}
				}
			}
		}
		clients(first: 20) {
			nodes {
				id
				title
				uri
				excerpt
				featuredImage {
					node {
						sourceUrl
						altText
					}
				}
			}
		}
		skills(first: 40) {
			nodes {
				id
				title
				uri
				excerpt
			}
		}
	}
`;