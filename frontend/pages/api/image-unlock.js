import { ACCESS_SECONDS, COOKIE_NAME, accessCookie, accessExpiresAt, createAccessToken, passwordMatches } from "../../lib/imageUnlock.js";

const attempts = new Map();
const ATTEMPT_WINDOW = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export default function handler(req, res) {
	res.setHeader("Cache-Control", "private, no-store");
	res.setHeader("Vary", "Cookie");
	if (req.method !== "GET" && req.method !== "POST") {
		res.setHeader("Allow", "GET, POST");
		return res.status(405).json({ error: "Method not allowed." });
	}

	try {
		if (req.method === "GET") {
			const expiresAt = accessExpiresAt(req.cookies[COOKIE_NAME]);
			return res.status(200).json({ unlocked: expiresAt !== null, expiresAt });
		}

		const origin = req.headers.origin;
		if (!origin || new URL(origin).host !== req.headers.host) {
			return res.status(403).json({ error: "Please submit this form from the portfolio website." });
		}
		if (!req.headers["content-type"]?.startsWith("application/json")) {
			return res.status(415).json({ error: "A JSON request is required." });
		}
		const password = req.body?.password;
		if (typeof password !== "string" || !password || password.length > 256) {
			return res.status(400).json({ error: "Enter a valid password." });
		}

		const now = Date.now();
		for (const [key, value] of attempts) {
			if (value.resetAt <= now) attempts.delete(key);
		}
		const address = req.socket.remoteAddress || "unknown";
		const previous = attempts.get(address);
		if (previous && previous.count >= MAX_ATTEMPTS) {
			res.setHeader("Retry-After", String(Math.ceil((previous.resetAt - now) / 1000)));
			return res.status(429).json({ error: "Too many attempts. Please try again in 15 minutes." });
		}
		if (!passwordMatches(password)) {
			if (attempts.size >= 10000 && !previous) {
				res.setHeader("Retry-After", "900");
				return res.status(429).json({ error: "Please try again in 15 minutes." });
			}
			attempts.set(address, { count: (previous?.count || 0) + 1, resetAt: previous?.resetAt || now + ATTEMPT_WINDOW });
			return res.status(401).json({ error: "That password is not correct. Please try again." });
		}
		attempts.delete(address);
		const { token, expiresAt } = createAccessToken(now);
		res.setHeader("Set-Cookie", accessCookie(token, process.env.NODE_ENV === "production"));
		return res.status(200).json({ unlocked: true, expiresAt, maxAge: ACCESS_SECONDS });
	} catch (error) {
		console.error("Image unlock request failed:", error instanceof Error ? error.message : "Unknown error");
		return res.status(500).json({ error: "Unable to unlock images right now. Please try again later." });
	}
}

export const config = { api: { bodyParser: { sizeLimit: "1kb" } } };
