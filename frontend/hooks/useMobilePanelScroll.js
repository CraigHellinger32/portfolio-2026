import { useEffect, useRef } from "react";

const mobileViewport = "(max-width: 767px)";
const scrollKeys = ["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "];

export default function useMobilePanelScroll() {
	const pending = useRef(null);
	useEffect(() => () => pending.current?.(), []);

	return function preparePanelScroll(panelId, focusHeading = false) {
		pending.current?.();
		if (!panelId || !window.matchMedia(mobileViewport).matches) return null;

		let cancelled = false;
		let frame;
		const cancel = () => {
			cancelled = true;
			cancelAnimationFrame(frame);
			window.removeEventListener("touchmove", cancel);
			window.removeEventListener("wheel", cancel);
			window.removeEventListener("keydown", cancelOnScrollKey);
			window.removeEventListener("popstate", cancel);
			if (pending.current === cancel) pending.current = null;
		};
		const cancelOnScrollKey = (event) => {
			if (scrollKeys.includes(event.key)) cancel();
		};
		pending.current = cancel;
		window.addEventListener("touchmove", cancel, { passive: true });
		window.addEventListener("wheel", cancel, { passive: true });
		window.addEventListener("keydown", cancelOnScrollKey);
		window.addEventListener("popstate", cancel);

		return (navigated) => {
			if (!navigated || cancelled) {
				cancel();
				return;
			}

			const start = performance.now();
			let lastPanel;
			let lastTop;
			let stableSince = start;

			const measure = (now) => {
				const panel = document.querySelector(`[id^="${panelId}-row-"][aria-hidden="false"]`);
				const rect = panel?.getBoundingClientRect();
				const documentTop = rect ? rect.top + window.scrollY : undefined;
				if (panel !== lastPanel || Math.abs(documentTop - lastTop) > 1) {
					lastPanel = panel;
					lastTop = documentTop;
					stableSince = now;
				}

				// A closing panel above this one can move its document position.
				if (now - start < 900 && (!rect?.height || now - stableSince < 100)) {
					frame = requestAnimationFrame(measure);
					return;
				}

				cancel();
				if (!rect?.height || !window.matchMedia(mobileViewport).matches) return;
				const heading = document.getElementById(`${panel.id}-title`);
				if (focusHeading) heading?.focus({ preventScroll: true });
				const anchor = heading?.getBoundingClientRect() ?? rect;
				const viewportTop = window.visualViewport?.offsetTop ?? 0;
				const viewportBottom = viewportTop + (window.visualViewport?.height ?? window.innerHeight);
				if (anchor.top >= viewportTop && anchor.bottom <= viewportBottom) return;

				window.scrollTo({
					top: Math.max(0, documentTop - viewportTop - 8),
					behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
				});
			};
			frame = requestAnimationFrame(measure);
		};
	};
}
