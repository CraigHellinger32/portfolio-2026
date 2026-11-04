import { useEffect, useLayoutEffect, useRef, useState } from "react";
import PageSidebar from "../PageSidebar/PageSidebar";
import styles from "./ContentPanel.module.css";

export default function ContentPanel({ entry, accent, open, id, retainWhenClosed = false, loading = false, error, onRetry }) {
	const panelRef = useRef(null);
	const contentRef = useRef(null);
	const [displayed, setDisplayed] = useState(() => open ? { entry, accent } : null);
	const updateContent = !retainWhenClosed || open;
	const currentEntry = displayed?.entry || entry;
	const sidebar = displayed?.entry?.caseStudies?.pageSidebar || "";
	const startYear = currentEntry?.caseStudies?.startYear;
	const endYear = currentEntry?.caseStudies?.endYear;
	const renderContent = open || displayed !== null;

	useEffect(() => {
		if (!updateContent || !open || loading || error || !contentRef.current) return;
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
	}, [entry, accent, updateContent, open, loading, error]);

	useEffect(() => {
		if (open) return;
		const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		const timeout = window.setTimeout(() => setDisplayed(null), reducedMotion ? 0 : 600);
		return () => window.clearTimeout(timeout);
	}, [open]);

	useEffect(() => {
		if (!contentRef.current) return;
		const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		const animation = contentRef.current.animate(
			{ opacity: [0, 1] },
			{ duration: reducedMotion ? 0 : 250, easing: "ease", fill: "forwards" }
		);
		return () => animation.cancel();
	}, [displayed]);

	useLayoutEffect(() => {
		const content = contentRef.current;
		if (!content) return;
		const updateHeight = () => {
			panelRef.current.style.setProperty("--panel-height", `${content.getBoundingClientRect().height}px`);
		};
		updateHeight();
		const observer = new ResizeObserver(updateHeight);
		observer.observe(content);
		return () => observer.disconnect();
	}, [displayed, open, loading, error]);

	return (
		<section
			ref={panelRef}
			id={id}
			className={`${styles.panel} ${styles[displayed?.accent || accent]} ${open ? styles.open : ""}`}
			aria-labelledby={renderContent ? `${id}-title` : undefined}
			aria-hidden={!open}
			aria-busy={open && loading}
			inert={!open}
		>
			<div className={styles.clip}>
				{renderContent && (
				<div ref={contentRef} className={styles.inner}>
					<header className={styles.heading}>
						<div className={styles.titleBlock} data-has-year={!!startYear}>
							<h1 id={`${id}-title`}>{currentEntry?.title}</h1>
							{currentEntry?.caseStudies?.subtitle && (
								<p className={styles.subtitle}>{currentEntry.caseStudies.subtitle}</p>
							)}
						</div>
						{startYear && (
							<p className={styles.years}>
								<time dateTime={String(startYear)}>{startYear}</time>
								{endYear && endYear !== startYear && (
									<> &ndash; <time dateTime={String(endYear)}>{endYear}</time></>
								)}
							</p>
						)}
					</header>
					{!error && (loading || displayed?.entry?.content === undefined) && !displayed?.entry?.content && (
						<p role="status">Loading content...</p>
					)}
					{error ? (
						<div role="alert">
								<p>Unable to load this content.</p>
							<button type="button" onClick={onRetry}>Retry</button>
						</div>
					) : (
					<div className={sidebar.trim() ? styles.columns : undefined}>
						<div
							className={styles.mainContent}
							dangerouslySetInnerHTML={{ __html: displayed?.entry?.content || "" }}
						/>
						<PageSidebar content={sidebar} />
					</div>
					)}
				</div>
				)}
			</div>
		</section>
	);
}