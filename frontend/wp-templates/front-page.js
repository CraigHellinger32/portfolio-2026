import { gql } from "@apollo/client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import ContentCard from "../components/ContentCard/ContentCard";
import ContentPanel from "../components/ContentPanel/ContentPanel";
import PageFooter from "../components/PageFooter/PageFooter";
import PageHeader from "../components/PageHeader/PageHeader";
import styles from "../components/ContentCard/ContentCard.module.css";

function useCompactColumns(sectionRef) {
	const [columns, setColumns] = useState(1);

	useEffect(() => {
		const section = sectionRef.current;
		const updateColumns = () => {
			if (window.matchMedia("(min-width: 1366px)").matches) return;
			const style = getComputedStyle(section);
			const fixedColumns = Number(style.getPropertyValue("--compact-columns"));
			const cardWidth = parseFloat(style.getPropertyValue("--compact-card-width"));
			const maxWidth = parseFloat(style.getPropertyValue("--compact-max-width"));
			setColumns(fixedColumns || Math.max(1, Math.floor(
				Math.min(section.clientWidth, maxWidth) / cardWidth
			)));
		};
		const observer = new ResizeObserver(updateColumns);
		observer.observe(section);
		window.addEventListener("resize", updateColumns);
		return () => {
			observer.disconnect();
			window.removeEventListener("resize", updateColumns);
		};
	}, [sectionRef]);

	return columns;
}

export default function FrontPageTemplate(props) {
	const router = useRouter();
	const clientSectionRef = useRef(null);
	const skillSectionRef = useRef(null);
	const clientColumns = useCompactColumns(clientSectionRef);
	const skillColumns = useCompactColumns(skillSectionRef);
	const [lastIndex, setLastIndex] = useState(0);
	const [lastClientIndex, setLastClientIndex] = useState(0);
	const [lastSkillIndex, setLastSkillIndex] = useState(0);
	const [detailData, setDetailData] = useState(null);
	const [skillData, setSkillData] = useState(null);
	const [clientData, setClientData] = useState(null);
	const [detailLoading, setDetailLoading] = useState(false);
	const [skillLoading, setSkillLoading] = useState(false);
	const [clientLoading, setClientLoading] = useState(false);
	const [detailError, setDetailError] = useState(null);
	const [skillError, setSkillError] = useState(null);
	const [clientError, setClientError] = useState(null);
	
	const accents = ["cyan", "magenta", "yellow"];
	const cmykAccents = [...accents, "monochrome"];
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
	
	// Helper function to fetch detail data
	const fetchDetailData = () => {
		if (!activeEntry) return;
		
		setDetailLoading(true);
		setDetailError(null);
		const query = JSON.stringify({
			query: `query GetCaseStudyDetails($uri: ID!) {
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
			}`,
			variables: { uri: activeEntry.uri }
		});
		
		fetch(`${process.env.NEXT_PUBLIC_WORDPRESS_URL || "http://pf2026.local"}/graphql`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: query
		})
			.then(r => r.json())
			.then(result => {
				if (result.errors) {
					setDetailError(new Error(result.errors[0].message));
					setDetailData(null);
				} else {
					const data = result.data;
					setDetailData(data);
				}
				setDetailLoading(false);
			})
			.catch(err => {
				setDetailError(err);
				setDetailData(null);
				setDetailLoading(false);
			});
	};
	
	const refetch = () => fetchDetailData();
	
	// Fetch case study details when panel opens
	useEffect(() => {
		if (!panelOpen || !activeEntry) {
			setDetailData(null);
			setDetailLoading(false);
			setDetailError(null);
			return;
		}
		
		fetchDetailData();
	}, [panelOpen, activeEntry]);
	const detailEntry = detailData?.caseStudy?.id === activeEntry?.id ? detailData.caseStudy : null;
	const panelEntry = detailEntry || activeEntry;
	const clients = props.data.clients.nodes.filter(
		(client) => client.clients?.hideOnFrontPage !== true
	);
	const skills = props.data.skills.nodes;
	const selectedSkillIndex = skills.findIndex(
		(entry) => entry.uri?.replace(/\/$/, "") === selectedPath
	);
	const skillPanelOpen = selectedSkillIndex !== -1;
	const activeSkillIndex = skillPanelOpen ? selectedSkillIndex : lastSkillIndex;
	const activeSkill = skills[activeSkillIndex];
	
	// Helper function to fetch skill data
	const fetchSkillData = () => {
		if (!activeSkill) return;
		
		const cache = sessionStorage.getItem(`skill-${activeSkill.uri}`);
		if (cache) {
			setSkillData(JSON.parse(cache));
			setSkillLoading(false);
			setSkillError(null);
			return;
		}
		
		setSkillLoading(true);
		setSkillError(null);
		const query = JSON.stringify({
			query: `query GetSkillDetails($uri: ID!) {
				skill(id: $uri, idType: URI) {
					id
					title
					content
				}
			}`,
			variables: { uri: activeSkill.uri }
		});
		
		fetch(`${process.env.NEXT_PUBLIC_WORDPRESS_URL || "http://pf2026.local"}/graphql`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: query
		})
			.then(r => r.json())
			.then(result => {
				if (result.errors) {
					setSkillError(new Error(result.errors[0].message));
					setSkillData(null);
				} else {
					const data = result.data;
					setSkillData(data);
					sessionStorage.setItem(`skill-${activeSkill.uri}`, JSON.stringify(data));
				}
				setSkillLoading(false);
			})
			.catch(err => {
				setSkillError(err);
				setSkillData(null);
				setSkillLoading(false);
			});
	};
	
	const refetchSkill = () => fetchSkillData();
	
	// Fetch skill details when panel opens
	useEffect(() => {
		if (!skillPanelOpen || !activeSkill) {
			setSkillData(null);
			setSkillLoading(false);
			setSkillError(null);
			return;
		}
		
		fetchSkillData();
	}, [skillPanelOpen, activeSkill]);
	
	const skillDetail = skillData?.skill?.id === activeSkill?.id ? skillData.skill : null;
	const selectedClientIndex = clients.findIndex(
		(entry) => entry.uri?.replace(/\/$/, "") === selectedPath
	);
	const clientPanelOpen = selectedClientIndex !== -1;
	const activeClientIndex = clientPanelOpen ? selectedClientIndex : lastClientIndex;
	const activeClient = clients[activeClientIndex];
	
	// Helper function to fetch client data
	const fetchClientData = () => {
		if (!activeClient) return;
		
		const cache = sessionStorage.getItem(`client-${activeClient.uri}`);
		if (cache) {
			setClientData(JSON.parse(cache));
			setClientLoading(false);
			setClientError(null);
			return;
		}
		
		setClientLoading(true);
		setClientError(null);
		const query = JSON.stringify({
			query: `query GetClientDetails($uri: ID!) {
				client(id: $uri, idType: URI) {
					id
					title
					content
				}
			}`,
			variables: { uri: activeClient.uri }
		});
		
		fetch(`${process.env.NEXT_PUBLIC_WORDPRESS_URL || "http://pf2026.local"}/graphql`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: query
		})
			.then(r => r.json())
			.then(result => {
				if (result.errors) {
					setClientError(new Error(result.errors[0].message));
					setClientData(null);
				} else {
					const data = result.data;
					setClientData(data);
					sessionStorage.setItem(`client-${activeClient.uri}`, JSON.stringify(data));
				}
				setClientLoading(false);
			})
			.catch(err => {
				setClientError(err);
				setClientData(null);
				setClientLoading(false);
			});
	};
	
	const refetchClient = () => fetchClientData();
	
	// Fetch client details when panel opens
	useEffect(() => {
		if (!clientPanelOpen || !activeClient) {
			setClientData(null);
			setClientLoading(false);
			setClientError(null);
			return;
		}
		
		fetchClientData();
	}, [clientPanelOpen, activeClient]);
	
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
								accent={cmykAccents[index % cmykAccents.length]}
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
				accent={cmykAccents[activeIndex % cmykAccents.length]}
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
							accent={cmykAccents[entryIndex % cmykAccents.length]}
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
			<section
				ref={clientSectionRef}
				className={styles.section}
				style={{ "--compact-row-columns": clientColumns }}
			>
				<h2 className={styles.sectionTitle}>Clients</h2>
				<ul className={styles.clientGrid} role="list">
					{clients.map((entry, index) => (
						<li
							key={entry.id}
							className={styles.compactCardItem}
							style={{
								"--compact-column": index % clientColumns + 2,
								"--compact-row": Math.floor(index / clientColumns) * 2 + 2,
							}}
						>
							<ContentCard
								entry={entry}
								number={clientNumberStart + index}
								size="client"
								symbol={entry.clients?.chemicalSymbol}
								accent={cmykAccents[index % cmykAccents.length]}
								selected={clientPanelOpen && activeClientIndex === index}
								panelId={`client-content-panel client-content-panel-row-${Math.floor(index / clientColumns)}`}
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
				{Array.from({ length: Math.ceil(clients.length / clientColumns) }, (_, row) => {
					const rowActive = Math.floor(activeClientIndex / clientColumns) === row;
					const entryIndex = rowActive ? activeClientIndex : row * clientColumns;
					return (
						<div
							key={row}
							className={styles.compactPanelSlot}
							style={{ gridRow: row * 2 + 3 }}
						>
							<ContentPanel
								id={`client-content-panel-row-${row}`}
								entry={rowActive ? clientDetail || activeClient : clients[entryIndex]}
								accent={cmykAccents[entryIndex % cmykAccents.length]}
								open={clientPanelOpen && rowActive}
								retainWhenClosed
								loading={clientLoading && !clientDetail}
								error={clientError}
								onRetry={() => void refetchClient().catch(() => {})}
							/>
						</div>
					);
				})}
			</section>
			<div className={styles.widePanelSlot}>
			<ContentPanel
				id="client-content-panel"
				entry={clientDetail || activeClient}
				accent={cmykAccents[activeClientIndex % cmykAccents.length]}
				open={clientPanelOpen}
				loading={clientLoading && !clientDetail}
				error={clientError}
				onRetry={() => void refetchClient().catch(() => {})}
			/>
			</div>
			</div>

			<div id="skills" className={styles.skillSection}>
				<section
					ref={skillSectionRef}
					className={styles.section}
					aria-labelledby="skills-title"
					style={{ "--compact-row-columns": skillColumns }}
				>
					<h2 id="skills-title" className={styles.sectionTitle}>Skills</h2>
					<ul className={styles.skillGrid} role="list">
						{skills.map((entry, index) => (
							<li
								key={entry.id}
								className={styles.compactCardItem}
								style={{
									"--compact-column": index % skillColumns + 2,
									"--compact-row": Math.floor(index / skillColumns) * 2 + 2,
								}}
							>
								<ContentCard
									entry={entry}
									number={skillNumberStart + index}
									size="skill"
									symbol={entry.skills?.chemicalSymbol}
									accent={accents[index % accents.length]}
									selected={skillPanelOpen && activeSkillIndex === index}
									panelId={`skill-content-panel skill-content-panel-row-${Math.floor(index / skillColumns)}`}
									onClick={() => {
										setLastSkillIndex(index);
										const path = skillPanelOpen && activeSkillIndex === index ? "/" : entry.uri;
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
					{Array.from({ length: Math.ceil(skills.length / skillColumns) }, (_, row) => {
						const rowActive = Math.floor(activeSkillIndex / skillColumns) === row;
						const entryIndex = rowActive ? activeSkillIndex : row * skillColumns;
						return (
							<div
								key={row}
								className={styles.compactPanelSlot}
								style={{ gridRow: row * 2 + 3 }}
							>
								<ContentPanel
									id={`skill-content-panel-row-${row}`}
									entry={rowActive ? skillDetail || activeSkill : skills[entryIndex]}
									accent={accents[entryIndex % accents.length]}
									open={skillPanelOpen && rowActive}
									retainWhenClosed
									loading={skillLoading && !skillDetail}
									error={skillError}
									onRetry={() => void refetchSkill().catch(() => {})}
								/>
							</div>
						);
					})}
				</section>
				<div className={styles.widePanelSlot}>
				<ContentPanel
					id="skill-content-panel"
					entry={skillDetail || activeSkill}
					accent={accents[activeSkillIndex % accents.length]}
					open={skillPanelOpen}
					loading={skillLoading && !skillDetail}
					error={skillError}
					onRetry={() => void refetchSkill().catch(() => {})}
				/>
				</div>
			</div>
			<section className={styles.cvSection} aria-label="Curriculum Vitae">
				<ContentCard
					entry={{ title: "Curriculum Vitae", uri: "/cv.html" }}
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