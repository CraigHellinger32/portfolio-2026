import { gql, useQuery } from "@apollo/client";
import { useState } from "react";
import { useRouter } from "next/router";
import ContentCard from "../components/ContentCard/ContentCard";
import ContentPanel from "../components/ContentPanel/ContentPanel";
import PageFooter from "../components/PageFooter/PageFooter";
import PageHeader from "../components/PageHeader/PageHeader";
import styles from "../components/ContentCard/ContentCard.module.css";

const CASE_STUDY_DETAILS_QUERY = gql`
	query GetCaseStudyDetails($uri: ID!) {
		caseStudy(id: $uri, idType: URI) {
			id
			title
			content
			caseStudies {
				subtitle
				startYear
				endYear
				pageSidebar
			}
		}
	}
`;

const CLIENT_DETAILS_QUERY = gql`
	query GetClientDetails($uri: ID!) {
		client(id: $uri, idType: URI) {
			id
			title
			content
		}
	}
`;

export default function FrontPageTemplate(props) {
	const router = useRouter();
	const [lastIndex, setLastIndex] = useState(0);
	const [lastClientIndex, setLastClientIndex] = useState(0);
	const accents = ["cyan", "magenta", "yellow", "monochrome"];
	const { title, description } = props.data.generalSettings;
	const caseStudies = props.data.caseStudies.nodes;
	const visibleCaseStudies = caseStudies.slice(0, 4);
	const selectedPath = router.asPath.split(/[?#]/)[0].replace(/\/$/, "");
	const selectedIndex = visibleCaseStudies.findIndex(
		(entry) => entry.uri?.replace(/\/$/, "") === selectedPath
	);
	const panelOpen = selectedIndex !== -1;
	const activeIndex = panelOpen ? selectedIndex : lastIndex;
	const activeEntry = visibleCaseStudies[activeIndex];
	const { data: detailData, loading: detailLoading, error: detailError, refetch } = useQuery(
		CASE_STUDY_DETAILS_QUERY,
		{
			variables: { uri: activeEntry?.uri || "/" },
			skip: !panelOpen || !activeEntry,
			ssr: false,
			fetchPolicy: "no-cache",
		}
	);
	const detailEntry = detailData?.caseStudy?.id === activeEntry?.id ? detailData.caseStudy : null;
	const panelEntry = detailEntry || activeEntry;
	const clients = props.data.clients.nodes.filter(
		(client) => client.clients?.hideOnFrontPage !== true
	);
	const skills = props.data.skills.nodes;
	const selectedClientIndex = clients.findIndex(
		(entry) => entry.uri?.replace(/\/$/, "") === selectedPath
	);
	const clientPanelOpen = selectedClientIndex !== -1;
	const activeClientIndex = clientPanelOpen ? selectedClientIndex : lastClientIndex;
	const activeClient = clients[activeClientIndex];
	const { data: clientData, loading: clientLoading, error: clientError, refetch: refetchClient } = useQuery(
		CLIENT_DETAILS_QUERY,
		{
			variables: { uri: activeClient?.uri || "/" },
			skip: !clientPanelOpen || !activeClient,
			ssr: false,
			fetchPolicy: "no-cache",
		}
	);
	const clientDetail = clientData?.client?.id === activeClient?.id ? clientData.client : null;
	const clientNumberStart = visibleCaseStudies.length + 1;
	const skillNumberStart = clientNumberStart + clients.length;

	return (
		<>
			<PageHeader title={title} description={description} />
			<main className={styles.page}>

			<div
				id="case-studies"
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
			<ContentPanel
				id="case-study-panel"
				entry={panelEntry}
				accent={accents[activeIndex]}
				open={panelOpen}
				loading={detailLoading && !detailEntry}
				error={detailError}
				onRetry={() => void refetch().catch(() => {})}
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
						<ContentPanel
							id={`case-study-panel-row-${row}`}
							entry={rowActive ? panelEntry : visibleCaseStudies[entryIndex]}
							accent={accents[entryIndex]}
							open={panelOpen && rowActive}
							retainWhenClosed
							loading={detailLoading && !detailEntry}
							error={detailError}
							onRetry={() => void refetch().catch(() => {})}
						/>
					</div>
				);
			})}
			</section>
			</div>

			<div id="clients" className={styles.clientSection}>
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
								accent={accents[index % accents.length]}
								selected={clientPanelOpen && activeClientIndex === index}
								panelId="client-content-panel"
								onClick={() => {
									setLastClientIndex(index);
									const path = clientPanelOpen && activeClientIndex === index ? "/" : entry.uri;
									void router.push(
										{ pathname: router.pathname, query: router.query },
										path,
										{ shallow: true, scroll: false }
									);
								}}
								brandLogo={entry.featuredImage?.node?.sourceUrl}
								brandLogoAlt={entry.featuredImage?.node?.altText || ""}
								brandName={entry.title}
							/>
						</li>
					))}
				</ul>
			</section>
			<ContentPanel
				id="client-content-panel"
				entry={clientDetail || activeClient}
				accent={accents[activeClientIndex % accents.length]}
				open={clientPanelOpen}
				loading={clientLoading && !clientDetail}
				error={clientError}
				onRetry={() => void refetchClient().catch(() => {})}
			/>
			</div>

			<section id="skills" className={styles.section}>
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
			<section className={styles.cvSection} aria-label="Curriculum Vitae">
				<ContentCard
					entry={{ title: "Curriculum Vitae", uri: props.data.cvUrl }}
					number={skillNumberStart + skills.length}
					symbol="Cv"
					size="medium"
					nativeLink
					target="_blank"
				/>
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
		cvUrl
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