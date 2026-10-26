import { gql } from "@apollo/client";
import CaseStudyCard from "../components/CaseStudyCard";
import styles from "../components/CaseStudyCard.module.css";

export default function FrontPageTemplate(props) {
	const { title, description } = props.data.generalSettings;
	const caseStudies = props.data.caseStudies.nodes;
	const visibleCaseStudies = caseStudies.slice(0, 4);
	const clients = props.data.clients.nodes.filter(
		(client) => client.clients?.hideOnFrontPage !== true
	);
	const skills = props.data.skills.nodes;
	const clientNumberStart = visibleCaseStudies.length + 1;
	const skillNumberStart = clientNumberStart + clients.length;

	return (
		<main className={styles.page}>
			<header className="site-header">
				<h1 className="site-title">{title}</h1>
				<p className="site-description">{description}</p>
			</header>

			<section className={styles.section}>
				<h2 className={styles.sectionTitle}>Case studies</h2>
				<ul
					className={styles.caseStudyGrid}
					style={{
						"--case-study-columns": String(Math.max(visibleCaseStudies.length, 1)),
					}}
				>
					{visibleCaseStudies.map((entry, index) => (
						<li key={entry.id}>
							<CaseStudyCard
								entry={entry}
								number={index + 1}
								symbol={entry.caseStudies?.chemicalSymbol}
							/>
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
		caseStudies(first: 4) {
			nodes {
				id
				title
				uri
				caseStudies {
					subtitle
					chemicalSymbol: chemicalsymbol
					client {
						nodes {
							... on Client {
								title
								featuredImage {
									node {
										sourceUrl
										altText
									}
								}
							}
						}
					}
				}
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
				clients {
					hideOnFrontPage
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