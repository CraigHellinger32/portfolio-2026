import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import ImageUnlockModal from "./ImageUnlockModal";

const ImageUnlockContext = createContext({ unlocked: false, requestUnlock: undefined });

export function useImageUnlock() {
	return useContext(ImageUnlockContext);
}

export default function ImageUnlockProvider({ children }) {
	const [expiresAt, setExpiresAt] = useState(null);
	const [open, setOpen] = useState(false);
	const triggerRef = useRef(null);
	const accessParameterRef = useRef(null);
	const unlocked = expiresAt !== null;

	useEffect(() => {
		const controller = new AbortController();
		if (accessParameterRef.current === null) {
			const url = new URL(window.location.href);
			const hasPassword = url.searchParams.has("pw");
			accessParameterRef.current = {
				hasPassword,
				password: url.searchParams.get("pw"),
			};
			if (hasPassword) {
				url.searchParams.delete("pw");
				window.history.replaceState(
					window.history.state,
					"",
					`${url.pathname}${url.search}${url.hash}`
				);
			}
		}
		const { hasPassword, password } = accessParameterRef.current;

		fetch("/api/image-unlock", {
			...(hasPassword
				? {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ password }),
				}
				: {}),
			cache: "no-store",
			signal: controller.signal,
		})
			.then(async (response) => {
				const result = await response.json();
				if (!response.ok) throw new Error(result.error || "Unable to check image access.");
				if (result.unlocked) {
					if (!Number.isFinite(result.expiresAt)) throw new Error("Unable to confirm image access.");
					setExpiresAt(result.expiresAt);
				} else if (hasPassword) {
					throw new Error("Unable to confirm image access.");
				}
			})
			.catch((error) => {
				if (error.name !== "AbortError") {
					console.error(
						hasPassword ? "Unable to unlock image access:" : "Unable to restore image access:",
						error
					);
				}
			});
		return () => controller.abort();
	}, []);

	useEffect(() => {
		if (expiresAt === null) return;
		let timeout;
		const scheduleExpiry = () => {
			const remaining = expiresAt - Date.now();
			if (remaining <= 0) setExpiresAt(null);
			else timeout = window.setTimeout(scheduleExpiry, Math.min(remaining, 2147483647));
		};
		scheduleExpiry();
		return () => window.clearTimeout(timeout);
	}, [expiresAt]);

	const requestUnlock = useCallback((event) => {
		triggerRef.current = event.currentTarget;
		setOpen(true);
	}, []);

	const close = useCallback(() => {
		setOpen(false);
		window.requestAnimationFrame(() => {
			if (triggerRef.current?.isConnected) triggerRef.current.focus();
		});
	}, []);

	return (
		<ImageUnlockContext.Provider value={{ unlocked, requestUnlock }}>
			{children}
			{open && (
				<ImageUnlockModal
					onClose={close}
					onSuccess={(expiry) => {
						setExpiresAt(expiry);
						close();
					}}
				/>
			)}
		</ImageUnlockContext.Provider>
	);
}
