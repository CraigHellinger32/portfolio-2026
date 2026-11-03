import Link from "next/link";
import Image from "next/image";
import styles from "./ContentCard.module.css";

function getSymbol(title) {
	const words = title.trim().split(/\s+/).filter(Boolean);

	if (words.length > 1) {
		return `${words[0][0].toUpperCase()}${words[1][0].toLowerCase()}`;
	}

	return words[0]?.slice(0, 2).replace(/^./, (letter) => letter.toUpperCase()) || "CS";
}

export default function ContentCard({
	entry,
	number,
	symbol,
	brandLogo,
	brandLogoAlt = "",
	brandName,
	size = "case-study",
	showSubtitle = size === "case-study",
	hoverEffect = size === "case-study",
	selected = false,
	accent = "cyan",
	onClick,
	panelId,
}) {
	const image = size === "case-study" ? entry.featuredImage?.node?.sourceUrl : null;
	const linkedClient = size === "case-study" ? entry.caseStudies?.client?.nodes?.[0] : null;
	const resolvedBrandLogo = brandLogo || linkedClient?.featuredImage?.node?.sourceUrl;
	const resolvedBrandLogoAlt = brandLogoAlt || linkedClient?.featuredImage?.node?.altText || "";
	const configuredLogoSize = (linkedClient || entry).clientBranding?.logoSize;
	const logoSizeValue = Array.isArray(configuredLogoSize) ? configuredLogoSize[0] : configuredLogoSize;
	const logoSize = ["compact", "standard", "wide"].includes(logoSizeValue) ? logoSizeValue : "standard";
	const lightLogo = linkedClient?.clientBranding?.lightLogo?.node;
	const useLightLogo = size === "case-study" && selected && accent !== "yellow";
	const displayedLogo = useLightLogo && lightLogo?.sourceUrl ? lightLogo.sourceUrl : resolvedBrandLogo;
	const displayedLogoAlt = useLightLogo && lightLogo?.sourceUrl ? lightLogo.altText || resolvedBrandLogoAlt : resolvedBrandLogoAlt;
	const resolvedBrandName = brandName || linkedClient?.title;
	const title = entry.title || "Untitled case study";
	const Card = onClick ? "button" : Link;

	return (
		<Card
			className={styles.card}
			data-accent={accent}
			data-size={size}
			data-logo-size={logoSize}
			data-hover-effect={hoverEffect}
			data-selected={selected}
			{...(onClick
				? { type: "button", onClick, "aria-expanded": selected, "aria-controls": panelId }
				: { href: entry.uri || "#" })}
		>
			{image && (
				<Image
					className={styles.image}
					 src={image}
					alt=""
					aria-hidden="true"
					fill
					sizes="(max-width: 767px) 169px, 230px"
				/>
			)}

			<span className={styles.topRow}>
				<span className={styles.brand}>
					{displayedLogo ? (
						<Image
							src={displayedLogo}
							alt={displayedLogoAlt}
							data-reversed={useLightLogo && !lightLogo?.sourceUrl}
							width={102}
							height={27}
							unoptimized
						/>
					) : (
						resolvedBrandName
					)}
				</span>
				<span className={styles.number} aria-hidden="true">
					{number}
				</span>
			</span>

			<span className={styles.content}>
				<span className={styles.symbol} aria-hidden="true">
					{symbol || getSymbol(title)}
				</span>
				<span className={styles.title}>{title}</span>
				{showSubtitle && entry.caseStudies?.subtitle && (
					<span className={styles.subtitle}>{entry.caseStudies.subtitle}</span>
				)}
			</span>
		</Card>
	);
}