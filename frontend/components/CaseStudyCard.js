import Link from "next/link";
import Image from "next/image";
import styles from "./CaseStudyCard.module.css";

function getSymbol(title) {
	const words = title.trim().split(/\s+/).filter(Boolean);

	if (words.length > 1) {
		return `${words[0][0].toUpperCase()}${words[1][0].toLowerCase()}`;
	}

	return words[0]?.slice(0, 2).replace(/^./, (letter) => letter.toUpperCase()) || "CS";
}

export default function CaseStudyCard({
	entry,
	number,
	symbol,
	brandLogo,
	brandLogoAlt = "",
	brandName,
	size = "case-study",
	showSubtitle = size === "case-study",
	selected = false,
	accent = "cyan",
}) {
	const image = size === "case-study" ? entry.featuredImage?.node?.sourceUrl : null;
	const title = entry.title || "Untitled case study";

	return (
		<Link
			className={styles.card}
			data-accent={accent}
			data-size={size}
			data-selected={selected}
			href={entry.uri || "#"}
		>
			{image && (
				<Image
					className={styles.image}
					 src={image}
					alt=""
					aria-hidden="true"
					fill
					sizes="230px"
					unoptimized
				/>
			)}

			<span className={styles.topRow}>
				<span className={styles.brand}>
					{brandLogo ? (
						<Image
							src={brandLogo}
							alt={brandLogoAlt}
							width={102}
							height={27}
							unoptimized
						/>
					) : (
						brandName
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
		</Link>
	);
}