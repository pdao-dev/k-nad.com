import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getRuntimeEnv } from "@/lib/runtime";

const SESSION_COOKIE = "k_nad_admin_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 6; // 6 hours

function toBuffer(value: string) {
	return Buffer.from(value, "utf-8");
}

function safeCompare(a: string, b: string) {
	const aBuf = toBuffer(a);
	const bBuf = toBuffer(b);
	if (aBuf.length !== bBuf.length) {
		return false;
	}
	return timingSafeEqual(aBuf, bBuf);
}

async function getRequiredSecret(key: keyof CloudflareEnv | string) {
	const env = await getRuntimeEnv();
	const value = env[key];
	if (!value || typeof value !== "string") {
		throw new Error(`${key} is not configured`);
	}
	return value;
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
		safeCompare(username, storedUsername) &&
		safeCompare(password, storedPassword)
	);
}

async function signPayload(payload: string) {
	const secret = await getRequiredSecret("ADMIN_SESSION_SECRET");
	return createHmac("sha256", secret).update(payload).digest("hex");
}

async function createSessionToken() {
	const payload = `${Date.now()}|${randomBytes(16).toString("hex")}`;
	const signature = await signPayload(payload);
	return `${payload}.${signature}`;
}

async function verifySessionToken(token: string) {
	const [payload, signature] = token.split(".");
	if (!payload || !signature) {
		return false;
	}

	const expectedSignature = await signPayload(payload);
	if (!safeCompare(signature, expectedSignature)) {
		return false;
	}

	const [issuedAt] = payload.split("|");
	const issuedTime = Number.parseInt(issuedAt, 10);
	if (Number.isNaN(issuedTime)) {
		return false;
	}

	return Date.now() - issuedTime <= SESSION_DURATION_MS;
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
		sameSite: "lax",
		secure: true,
		path: "/",
		maxAge: SESSION_DURATION_MS / 1000,
	});
}

export function clearAdminSession(response: NextResponse) {
	response.cookies.set({
		name: SESSION_COOKIE,
		value: "",
		httpOnly: true,
		sameSite: "lax",
		secure: true,
		path: "/",
		maxAge: 0,
	});
}
