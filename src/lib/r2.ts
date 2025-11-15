import { getRuntimeEnv, type RuntimeEnv } from "@/lib/runtime";

export interface UploadResult {
	success: boolean;
	url?: string;
	key?: string;
	error?: string;
}

function assertBucket(
	env: RuntimeEnv,
): asserts env is RuntimeEnv & { k_nad_prod: R2Bucket } {
	if (!("k_nad_prod" in env) || !env.k_nad_prod) {
		throw new Error("R2 bucket binding k_nad_prod is not configured");
	}
}

function ensurePublicBaseUrl(env: RuntimeEnv): string {
	const base = env.CLOUDFLARE_R2_URL as string | undefined;

	if (!base) {
		throw new Error("CLOUDFLARE_R2_URL is missing");
	}

	return base.replace(/\/$/, "");
}

function normalizeFolder(folder: string) {
	return folder.replace(/^\/+|\/+$/g, "") || "uploads";
}

function sanitizeKey(key: string) {
	return key.replace(/^\/+/, "");
}

function createObjectKey(folder: string, extension: string) {
	const unique =
		typeof crypto.randomUUID === "function"
			? crypto.randomUUID()
			: Math.random().toString(36).slice(2);
	const sanitizedFolder = normalizeFolder(folder);

	return `${sanitizedFolder}/${Date.now()}_${unique}${extension ? `.${extension}` : ""}`;
}

export async function uploadToR2(
	file: File,
	folder: string = "uploads",
): Promise<UploadResult> {
	try {
		const env = await getRuntimeEnv();
		assertBucket(env);

		const extension = file.name.split(".").pop() || "bin";
		const key = createObjectKey(folder, extension);
		const buffer = await file.arrayBuffer();
		const contentType = file.type || "application/octet-stream";

		await env.k_nad_prod.put(key, buffer, {
			httpMetadata: {
				contentType,
				cacheControl: "public, max-age=31536000",
			},
			customMetadata: {
				originalName: file.name,
				uploadedAt: new Date().toISOString(),
				size: file.size.toString(),
			},
		});

		return {
			success: true,
			key,
			url: `${ensurePublicBaseUrl(env)}/${key}`,
		};
	} catch (error) {
		console.error("R2 upload error:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Upload failed",
		};
	}
}

export async function uploadJsonToR2(
	payload: unknown,
	options: { folder?: string; filename?: string } = {},
): Promise<UploadResult> {
	try {
		const env = await getRuntimeEnv();
		assertBucket(env);

		const folder = options.folder ?? "metadata";
		const key = options.filename
			? sanitizeKey(options.filename)
			: createObjectKey(folder, "json");
		const encoder = new TextEncoder();
		const data = encoder.encode(JSON.stringify(payload, null, 2));

		await env.k_nad_prod.put(key, data, {
			httpMetadata: {
				contentType: "application/json; charset=utf-8",
				cacheControl: "public, max-age=31536000",
			},
		});

		return {
			success: true,
			key,
			url: `${ensurePublicBaseUrl(env)}/${key}`,
		};
	} catch (error) {
		console.error("R2 JSON upload error:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Metadata upload failed",
		};
	}
}

export async function getFromR2(key: string): Promise<R2Object | null> {
	try {
		const env = await getRuntimeEnv();
		assertBucket(env);
		return env.k_nad_prod.get(key);
	} catch (error) {
		console.error("Error getting data from R2", error);
		return null;
	}
}

export async function listR2Files() {}

export async function deleteFromR2(key: string): Promise<void> {
	try {
		const env = await getRuntimeEnv();
		assertBucket(env);
		await env.k_nad_prod.delete(key);
	} catch (error) {
		console.error(`Failed to delete R2 object ${key}`, error);
	}
}
