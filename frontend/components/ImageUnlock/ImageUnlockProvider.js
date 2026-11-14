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
	const unlocked = expiresAt !== null;

	useEffect(() => {
		const controller = new AbortController();
		fetch("/api/image-unlock", { cache: "no-store", signal: controller.signal })
			.then(async (response) => {
				const result = await response.json();
				if (!response.ok) throw new Error(result.error || "Unable to check image access.");
				if (result.unlocked) setExpiresAt(result.expiresAt);
			})
			.catch((error) => {
				if (error.name !== "AbortError") console.error("Unable to restore image access:", error);
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
