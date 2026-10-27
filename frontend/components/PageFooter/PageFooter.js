import { useSyncExternalStore } from "react";
import Image from "next/image";
import styles from "./PageFooter.module.css";

const tileColors = ["#007db5", "#de0087", "#fff200", "#fff"];
const colorTiles = Array.from({ length: 40 }, (_, index) => ({
	color: tileColors[Math.floor(index / 10)],
	opacity: 1 - (index % 10) / 10,
}));

function getCurrentYear() {
	return new Date().getFullYear();
}

function subscribeToYear(onChange) {
	let timeoutId;

	function scheduleCheck() {
		const now = new Date();
		const nextYear = new Date(now.getFullYear() + 1, 0, 1);
		const delay = Math.min(nextYear.getTime() - now.getTime(), 2147480000);

		timeoutId = window.setTimeout(() => {
			onChange();
			scheduleCheck();
		}, delay);
	}

	scheduleCheck();
	return () => window.clearTimeout(timeoutId);
}

function FooterLink({ href, icon, label, external = false }) {
	const content = (
		<>
			<Image
				className={styles.icon}
				src={icon}
				alt=""
				aria-hidden="true"
				width={24}
				height={24}
				unoptimized
			/>
			<span>{label}</span>
		</>
	);

	if (!href) {
		return <span className={styles.contactLink}>{content}</span>;
	}

	return (
		<a
			className={styles.contactLink}
			href={href}
			target={external ? "_blank" : undefined}
			rel={external ? "noreferrer" : undefined}
		>
			{content}
		</a>
	);
}

export default function PageFooter({ email, linkedInUrl }) {
	const year = useSyncExternalStore(subscribeToYear, getCurrentYear, () => null);

	return (
		<footer className={styles.footer}>
			<p className={styles.copyright}>
				© <time className={styles.year}>{year}</time> Craig Hellinger. All rights reserved
			</p>

			<nav className={styles.contactLinks} aria-label="Contact links">
				<FooterLink
					href={email ? `mailto:${email}` : undefined}
					icon="/footer/imgIcon.svg"
					label="Get in touch"
				/>
				<FooterLink
					href={linkedInUrl}
					icon="/footer/imgIconLinkedIn.svg"
					label="Connect"
					external
				/>
			</nav>

			<div className={styles.colorMark} aria-hidden="true">
				{colorTiles.map((tile, index) => (
					<span
						key={index}
						className={styles.colorTile}
						style={{
							"--tile-color": tile.color,
							"--tile-opacity": tile.opacity,
						}}
					/>
				))}
			</div>
		</footer>
	);
}