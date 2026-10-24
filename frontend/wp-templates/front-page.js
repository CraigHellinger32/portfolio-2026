import { gql } from "@apollo/client";
import CaseStudyCard from "../components/CaseStudyCard";
import styles from "../components/CaseStudyCard.module.css";

export default function FrontPageTemplate(props) {
	const { title, description } = props.data.generalSettings;
	const caseStudies = props.data.caseStudies.nodes;

	return (
		<main>
			<h1>{title}</h1>
			<p>{description}</p>

			<h2>Case studies</h2>
			{caseStudies.length === 0 && <p>No case studies yet.</p>}
			<ul className={styles.caseStudyGrid}>
				{caseStudies.map((caseStudy, index) => (
					<li key={caseStudy.id}>
						<CaseStudyCard caseStudy={caseStudy} number={index + 1} />
					</li>
				))}
			</ul>
		</main>
	);
}

FrontPageTemplate.query = gql`
	query GetFrontPage {
		generalSettings {
			title
			description
		}
		caseStudies(first: 5) {
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
	}
`;