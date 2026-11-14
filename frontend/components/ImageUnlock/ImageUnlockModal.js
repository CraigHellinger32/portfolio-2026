import { useEffect, useRef, useState } from "react";
import styles from "./ImageUnlockModal.module.css";

export default function ImageUnlockModal({ onClose, onSuccess }) {
	const dialogRef = useRef(null);
	const inputRef = useRef(null);
	const requestRef = useRef(null);
	const closeActionRef = useRef(null);
	const [closing, setClosing] = useState(false);
	const [password, setPassword] = useState("");
	const [pending, setPending] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		const dialog = dialogRef.current;
		dialog.showModal();
		inputRef.current.focus();
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			requestRef.current?.abort();
			dialog.close();
			document.body.style.overflow = previousOverflow;
		};
	}, []);

	useEffect(() => {
		if (!closing) return;
		const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		const timeout = window.setTimeout(() => closeActionRef.current(), reducedMotion ? 0 : 250);
		return () => window.clearTimeout(timeout);
	}, [closing]);

	function close(action = onClose) {
		if (closeActionRef.current) return;
		closeActionRef.current = action;
		requestRef.current?.abort();
		setClosing(true);
	}

	async function submit(event) {
		event.preventDefault();
		if (pending || closing) return;
		setPending(true);
		setError("");
		const controller = new AbortController();
		requestRef.current = controller;
		try {
			const response = await fetch("/api/image-unlock", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ password }),
				signal: controller.signal,
			});
			const result = await response.json();
			if (!response.ok) throw new Error(result.error || "Unable to unlock images. Please try again.");
			if (result.unlocked !== true || !Number.isFinite(result.expiresAt)) {
				throw new Error("Unable to confirm access. Please try again.");
			}
			close(() => onSuccess(result.expiresAt));
		} catch (failure) {
			if (failure.name === "AbortError") return;
			setError(failure instanceof Error ? failure.message : "Unable to unlock images. Please try again.");
			setPassword("");
			inputRef.current.focus();
		} finally {
			if (!controller.signal.aborted) setPending(false);
		}
	}

	return (
		<dialog
			ref={dialogRef}
			className={styles.dialog}
			data-closing={closing}
			inert={closing}
			aria-labelledby="image-unlock-title"
			aria-describedby="image-unlock-description"
			onCancel={(event) => { event.preventDefault(); close(); }}
			onClick={(event) => {
				if (event.target !== event.currentTarget) return;
				const rect = event.currentTarget.getBoundingClientRect();
				if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close();
			}}
		>
			<button className={styles.close} type="button" aria-label="Close password form" onClick={() => close()}>
				<span aria-hidden="true" />
			</button>
			<h2 id="image-unlock-title">Take a closer look</h2>
			<p id="image-unlock-description">Enter the password to view full-resolution images across the portfolio. Access will be remembered for 30 days on this browser.</p>
			<form onSubmit={submit} aria-busy={pending}>
				<label htmlFor="image-unlock-password">Password</label>
				<input
					ref={inputRef}
					id="image-unlock-password"
					name="password"
					type="password"
					autoComplete="current-password"
					required
					maxLength={256}
					value={password}
					onChange={(event) => setPassword(event.target.value)}
					aria-invalid={!!error}
					aria-describedby={error ? "image-unlock-error" : undefined}
				/>
				{error && <p className={styles.error} id="image-unlock-error" role="alert">{error}</p>}
				<button className={styles.submit} type="submit" disabled={pending}>
					{pending ? "Checking password..." : "Unlock images"}
				</button>
			</form>
		</dialog>
	);
}
