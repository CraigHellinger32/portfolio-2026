import assert from "node:assert/strict";
import { test, beforeEach } from "node:test";
import { ACCESS_SECONDS, COOKIE_NAME, accessCookie, accessExpiresAt, createAccessToken, passwordMatches } from "../lib/imageUnlock.js";
import handler from "../pages/api/image-unlock.js";

beforeEach(() => {
	process.env.IMAGE_UNLOCK_PASSWORD = "test-password-only";
	process.env.IMAGE_UNLOCK_COOKIE_SECRET = "test-cookie-secret-not-for-production-123456";
});

function request({ method = "POST", headers = {}, body = { password: "test-password-only" }, cookies = {}, address = "test-client" } = {}) {
	const req = {
		method,
		headers: { host: "localhost:3001", origin: "http://localhost:3001", "content-type": "application/json", ...headers },
		body,
		cookies,
		socket: { remoteAddress: address },
	};
	const res = {
		headers: {},
		code: null,
		body: null,
		setHeader(name, value) { this.headers[name] = value; },
		status(code) { this.code = code; return this; },
		json(body) { this.body = body; return this; },
	};
	handler(req, res);
	return res;
}

test("password comparison accepts only the configured password", () => {
	assert.equal(passwordMatches("test-password-only"), true);
	assert.equal(passwordMatches("wrong-password"), false);
	assert.equal(passwordMatches("test-password-only "), false);
});

test("access is valid for exactly 30 days", () => {
	const now = 1800000000000;
	const { token, expiresAt } = createAccessToken(now);
	assert.equal(ACCESS_SECONDS, 30 * 24 * 60 * 60);
	assert.equal(expiresAt, now + ACCESS_SECONDS * 1000);
	assert.equal(accessExpiresAt(token, now), expiresAt);
	assert.equal(accessExpiresAt(token, expiresAt - 1), expiresAt);
	assert.equal(accessExpiresAt(token, expiresAt), null);
});

test("missing, malformed and tampered cookies do not grant access", () => {
	for (const token of [undefined, "", "true", "1.fake", "9".repeat(1000)]) {
		assert.equal(accessExpiresAt(token), null);
	}
	const { token } = createAccessToken();
	const [expiry, sig] = token.split(".");
	assert.equal(accessExpiresAt(`${expiry}.${sig[0] === "a" ? "b" : "a"}${sig.slice(1)}`), null);
	assert.equal(accessExpiresAt(`${Number(expiry) + 60}.${sig}`), null);
});

test("changing the password or signing secret invalidates cookies", () => {
	const { token } = createAccessToken();
	process.env.IMAGE_UNLOCK_PASSWORD = "changed";
	assert.equal(accessExpiresAt(token), null);
	process.env.IMAGE_UNLOCK_PASSWORD = "test-password-only";
	process.env.IMAGE_UNLOCK_COOKIE_SECRET = "another-test-cookie-secret-long-enough";
	assert.equal(accessExpiresAt(token), null);
});

test("cookies have the expected scope, lifetime and security attributes", () => {
	const cookie = accessCookie("test-token", true);
	for (const part of [`${COOKIE_NAME}=test-token`, "Path=/", "Max-Age=2592000", "HttpOnly", "SameSite=Lax", "Secure"]) {
		assert.ok(cookie.includes(part));
	}
	assert.ok(!accessCookie("test-token", false).includes("Secure"));
});

test("API grants access and restores it using the signed cookie", () => {
	const response = request();
	assert.equal(response.code, 200);
	assert.equal(response.body.unlocked, true);
	assert.equal(response.headers["Cache-Control"], "private, no-store");
	const token = response.headers["Set-Cookie"].split(";")[0].split("=")[1];
	const restored = request({ method: "GET", cookies: { [COOKIE_NAME]: token } });
	assert.equal(restored.code, 200);
	assert.equal(restored.body.unlocked, true);
	assert.equal(restored.body.expiresAt, response.body.expiresAt);
});

test("API does not unlock without a valid cookie", () => {
	assert.equal(request({ method: "GET" }).body.unlocked, false);
	assert.equal(request({ method: "GET", cookies: { [COOKIE_NAME]: "forged" } }).body.unlocked, false);
});

test("API rejects wrong passwords and invalid requests without issuing a cookie", () => {
	for (const [options, expected] of [
		[{ body: { password: "wrong" }, address: "wrong-password-client" }, 401],
		[{ body: { password: "" } }, 400],
		[{ body: { password: 123 } }, 400],
		[{ headers: { origin: "https://other.example" } }, 403],
		[{ headers: { origin: "" } }, 403],
		[{ headers: { "content-type": "text/plain" } }, 415],
		[{ method: "PUT" }, 405],
	]) {
		const response = request(options);
		assert.equal(response.code, expected);
		assert.ok(!response.headers["Set-Cookie"]);
	}
});

test("API rate limits repeated failures", () => {
	for (let i = 0; i < 5; i++) {
		assert.equal(request({ address: "rate-limit-test", body: { password: "incorrect" } }).code, 401);
	}
	const response = request({ address: "rate-limit-test" });
	assert.equal(response.code, 429);
	assert.ok(Number(response.headers["Retry-After"]) > 0);
});

test("missing configuration fails explicitly rather than granting access", () => {
	delete process.env.IMAGE_UNLOCK_COOKIE_SECRET;
	assert.throws(() => createAccessToken(), /requires a password and a cookie secret/);
	assert.throws(() => accessExpiresAt(undefined), /requires a password and a cookie secret/);
});
