import { gql } from "@apollo/client";
import { useState } from "react";
import { useRouter } from "next/router";
import ContentCard from "../components/ContentCard/ContentCard";
import CaseStudyPanel from "../components/CaseStudyPanel/CaseStudyPanel";
import PageFooter from "../components/PageFooter/PageFooter";
import styles from "../components/ContentCard/ContentCard.module.css";

export default function FrontPageTemplate(props) {
	const router = useRouter();
	const [lastIndex, setLastIndex] = useState(0);
	const accents = ["cyan", "magenta", "yellow", "dark"];
	const { title, description } = props.data.generalSettings;
	const caseStudies = props.data.caseStudies.nodes;
	const visibleCaseStudies = caseStudies.slice(0, 4);
	const selectedPath = router.asPath.split(/[?#]/)[0].replace(/\/$/, "");
	const selectedIndex = visibleCaseStudies.findIndex(
		(entry) => entry.uri?.replace(/\/$/, "") === selectedPath
	);
	const panelOpen = selectedIndex !== -1;
	const activeIndex = panelOpen ? selectedIndex : lastIndex;
	const clients = props.data.clients.nodes.filter(
		(client) => client.clients?.hideOnFrontPage !== true
	);
	const skills = props.data.skills.nodes;
	const clientNumberStart = visibleCaseStudies.length + 1;
	const skillNumberStart = clientNumberStart + clients.length;

	return (
		<>
			<main className={styles.page}>
			<header className="site-header">
				<h1 className="site-title">{title}</h1>
				<p className="site-description">{description}</p>
			</header>

			<div
				className={styles.caseStudySection}
				style={{
					"--case-study-columns": String(Math.max(visibleCaseStudies.length, 1)),
				}}
			>
			<section className={styles.section}>
				<h2 className={styles.sectionTitle}>Case studies</h2>
				<ul
					className={styles.caseStudyGrid}
					role="list"
				>
					{visibleCaseStudies.map((entry, index) => (
						<li
							key={entry.id}
							className={styles.caseStudyItem}
							style={{
								"--mobile-column": index % 2 + 2,
								"--mobile-row": Math.floor(index / 2) * 2 + 2,
								"--desktop-column": index + 2,
							}}
						>
							<ContentCard
								entry={entry}
								number={index + 1}
								symbol={entry.caseStudies?.chemicalSymbol}
								accent={accents[index]}
								selected={panelOpen && activeIndex === index}
								panelId={`case-study-panel case-study-panel-row-${Math.floor(index / 2)}`}
								onClick={() => {
									setLastIndex(index);
									const path = panelOpen && activeIndex === index ? "/" : entry.uri;
									void router.push(
										{ pathname: router.pathname, query: router.query },
										path,
										{ shallow: true, scroll: false }
									);
								}}
							/>
						</li>
					))}
				</ul>
			<div className={styles.caseStudyPanelSlot}>
			<CaseStudyPanel
				id="case-study-panel"
				entry={visibleCaseStudies[activeIndex]}
				accent={accents[activeIndex]}
				open={panelOpen}
			/>
			</div>
			{[0, 1].map((row) => {
				const rowActive = Math.floor(activeIndex / 2) === row;
				const entryIndex = rowActive ? activeIndex : row * 2;
				return (
					<div
						key={row}
						className={styles.mobileCaseStudyPanelSlot}
						style={{ gridRow: row * 2 + 3 }}
					>
						<CaseStudyPanel
							id={`case-study-panel-row-${row}`}
							entry={visibleCaseStudies[entryIndex]}
							accent={accents[entryIndex]}
							open={panelOpen && rowActive}
							retainWhenClosed
						/>
					</div>
				);
			})}
			</section>
			</div>

			<section className={styles.section}>
				<h2 className={styles.sectionTitle}>Clients</h2>
				<ul className={styles.clientGrid}>
					{clients.map((entry, index) => (
						<li key={entry.id}>
							<ContentCard
								entry={entry}
								number={clientNumberStart + index}
								size="client"
								symbol={entry.clients?.chemicalSymbol}
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
							<ContentCard
								entry={entry}
								number={skillNumberStart + index}
								size="skill"
								symbol={entry.skills?.chemicalSymbol}
							/>
						</li>
					))}
				</ul>
			</section>
			</main>
			<PageFooter 
				email="mail@craighellinger.co.uk" 
				linkedInUrl="https://www.linkedin.com/in/craig-hellinger/"
			/>
		</>
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
				content
				uri
				caseStudies {
					subtitle
					pageSidebar
					chemicalSymbol: chemicalsymbol
					client {
						nodes {
							... on Client {
								title
								clientBranding {
									logoSize
									lightLogo {
										node {
											sourceUrl
											altText
										}
									}
								}
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
				clientBranding {
					logoSize
				}
				featuredImage {
					node {
						sourceUrl
						altText
					}
				}
				clients {
					hideOnFrontPage
					chemicalSymbol: chemicalsymbol
				}
			}
		}
		skills(first: 40) {
			nodes {
				id
				title
				uri
				excerpt
				skills {
					chemicalSymbol
				}
			}
		}
	}
`;