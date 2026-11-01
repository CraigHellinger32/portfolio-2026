import { useEffect, useLayoutEffect, useRef, useState } from "react";
import styles from "./CaseStudyPanel.module.css";

export default function CaseStudyPanel({ entry, accent, open, id, retainWhenClosed = false }) {
	const panelRef = useRef(null);
	const contentRef = useRef(null);
	const [displayed, setDisplayed] = useState({ entry, accent });
	const updateContent = !retainWhenClosed || open;

	useEffect(() => {
		if (!updateContent) return;
		let cancelled = false;
		const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		const animation = contentRef.current.animate(
			{ opacity: [1, 0] },
			{ duration: reducedMotion ? 0 : 200, easing: "ease", fill: "forwards" }
		);
		animation.finished.then(() => {
			if (!cancelled) setDisplayed({ entry, accent });
		}).catch(() => {});
		return () => {
			cancelled = true;
			animation.cancel();
		};
	}, [entry, accent, updateContent]);

	useEffect(() => {
		const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		const animation = contentRef.current.animate(
			{ opacity: [0, 1] },
			{ duration: reducedMotion ? 0 : 250, easing: "ease", fill: "forwards" }
		);
		return () => animation.cancel();
	}, [displayed]);

	useLayoutEffect(() => {
		const content = contentRef.current;
		const updateHeight = () => {
			panelRef.current.style.setProperty("--panel-height", `${content.getBoundingClientRect().height}px`);
		};
		updateHeight();
		const observer = new ResizeObserver(updateHeight);
		observer.observe(content);
		return () => observer.disconnect();
	}, [displayed]);

	return (
		<section
			ref={panelRef}
			id={id}
			className={`${styles.panel} ${styles[displayed.accent]} ${open ? styles.open : ""}`}
			aria-labelledby={`${id}-title`}
			aria-hidden={!open}
			inert={!open}
		>
			<div className={styles.clip}>
				<div ref={contentRef} className={styles.inner}>
					<h1 id={`${id}-title`}>{displayed.entry?.title}</h1>
					<div dangerouslySetInnerHTML={{ __html: displayed.entry?.content || "" }} />
				</div>
			</div>
		</section>
	);
}