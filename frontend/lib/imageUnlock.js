import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const COOKIE_NAME = "pf2026-image-access";
export const ACCESS_SECONDS = 30 * 24 * 60 * 60;

function configuration() {
	const password = process.env.IMAGE_UNLOCK_PASSWORD;
	const secret = process.env.IMAGE_UNLOCK_COOKIE_SECRET;
	if (!password || !secret || secret.length < 32) {
		throw new Error("Image unlock requires a password and a cookie secret of at least 32 characters.");
	}
	return { password, secret };
}

function signature(expires) {
	const { password, secret } = configuration();
	return createHmac("sha256", secret).update(`${expires}:${password}`).digest("hex");
}

export function passwordMatches(input) {
	const { password } = configuration();
	return timingSafeEqual(
		createHash("sha256").update(input).digest(),
		createHash("sha256").update(password).digest()
	);
}

export function createAccessToken(now = Date.now()) {
	const expires = String(Math.floor(now / 1000) + ACCESS_SECONDS);
	return { token: `${expires}.${signature(expires)}`, expiresAt: Number(expires) * 1000 };
}

export function accessExpiresAt(token, now = Date.now()) {
	configuration();
	if (typeof token !== "string" || !/^\d{10}\.[a-f0-9]{64}$/.test(token)) return null;
	const [expires, supplied] = token.split(".");
	const expiry = Number(expires) * 1000;
	if (expiry <= now || expiry > now + ACCESS_SECONDS * 1000) return null;
	return timingSafeEqual(Buffer.from(supplied, "hex"), Buffer.from(signature(expires), "hex"))
		? expiry
		: null;
}

export function accessCookie(token, secure) {
	return `${COOKIE_NAME}=${token}; Path=/; Max-Age=${ACCESS_SECONDS}; HttpOnly; SameSite=Lax${secure ? "; Secure" : ""}`;
}
