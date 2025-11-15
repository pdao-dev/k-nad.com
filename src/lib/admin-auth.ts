import { NextRequest, NextResponse } from "next/server";
import { getRuntimeEnv } from "@/lib/runtime";

const SESSION_COOKIE = "k_nad_admin_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 6; // 6 hours
const encoder = new TextEncoder();

function toUint8(value: string) {
	return encoder.encode(value);
}

function timingSafeEquals(a: string, b: string) {
	const aBytes = toUint8(a);
	const bBytes = toUint8(b);
	if (aBytes.length !== bBytes.length) {
		return false;
	}

	let result = 0;
	for (let i = 0; i < aBytes.length; i += 1) {
		result |= aBytes[i] ^ bBytes[i];
	}
	return result === 0;
}

async function getRequiredSecret(key: keyof CloudflareEnv | string) {
	const env = await getRuntimeEnv();
	const value = env[key];
	if (!value || typeof value !== "string") {
		throw new Error(`${key} is not configured`);
	}
	return value;
}

async function signPayload(payload: string) {
	const secret = await getRequiredSecret("ADMIN_SESSION_SECRET");
	const cryptoKey = await crypto.subtle.importKey(
		"raw",
		toUint8(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);

	const signature = await crypto.subtle.sign(
		"HMAC",
		cryptoKey,
		toUint8(payload),
	);

	return Array.from(new Uint8Array(signature))
		.map((byte) => byte.toString(16).padStart(2, "0"))
		.join("");
}

function randomHex(bytes = 16) {
	const array = new Uint8Array(bytes);
	crypto.getRandomValues(array);
	return Array.from(array)
		.map((byte) => byte.toString(16).padStart(2, "0"))
		.join("");
}

async function createSessionToken() {
	const payload = `${Date.now()}|${randomHex()}`;
	const signature = await signPayload(payload);
	return `${payload}.${signature}`;
}

async function verifySessionToken(token: string) {
	const [payload, signature] = token.split(".");
	if (!payload || !signature) return false;

	const expectedSignature = await signPayload(payload);
	if (!timingSafeEquals(signature, expectedSignature)) return false;

	const [issuedAtRaw] = payload.split("|");
	const issuedAt = Number.parseInt(issuedAtRaw, 10);
	if (Number.isNaN(issuedAt)) return false;

	return Date.now() - issuedAt <= SESSION_DURATION_MS;
}

export async function validateAdminCredentials(
	username: string,
	password: string,
) {
	const [storedUsername, storedPassword] = await Promise.all([
		getRequiredSecret("ADMIN_USERNAME"),
		getRequiredSecret("ADMIN_PASSWORD"),
	]);

	return (
		timingSafeEquals(username, storedUsername) &&
		timingSafeEquals(password, storedPassword)
	);
}

export async function isAdminRequest(request: NextRequest) {
	const token = request.cookies.get(SESSION_COOKIE)?.value;
	if (!token) return false;
	return verifySessionToken(token);
}

export async function createAdminSession(response: NextResponse) {
	const token = await createSessionToken();
	response.cookies.set({
		name: SESSION_COOKIE,
		value: token,
		httpOnly: true,
		secure: true,
		sameSite: "lax",
		path: "/",
		maxAge: SESSION_DURATION_MS / 1000,
	});
}

export function clearAdminSession(response: NextResponse) {
	response.cookies.set({
		name: SESSION_COOKIE,
		value: "",
		httpOnly: true,
		secure: true,
		sameSite: "lax",
		path: "/",
		maxAge: 0,
	});
}
