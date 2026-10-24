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
	caseStudy,
	number,
	symbol,
	brandLogo,
	brandLogoAlt = "",
	brandName,
	selected = false,
	accent = "cyan",
}) {
	const image = caseStudy.featuredImage?.node?.sourceUrl;
	const title = caseStudy.title || "Untitled case study";

	return (
		<Link
			className={styles.card}
			data-accent={accent}
			data-selected={selected}
			href={caseStudy.uri}
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
				{caseStudy.excerpt && (
					<span
						className={styles.excerpt}
						dangerouslySetInnerHTML={{ __html: caseStudy.excerpt }}
					/>
				)}
			</span>
		</Link>
	);
}