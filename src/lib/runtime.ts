import { getCloudflareContext } from "@opennextjs/cloudflare";

export type RuntimeEnv =
	| (CloudflareEnv & NodeJS.ProcessEnv)
	| Record<string, any>;

/**
 * Returns the Cloudflare worker bindings when running on Workers and
 * gracefully falls back to process.env when running locally without Wrangler.
 */
export async function getRuntimeEnv(): Promise<RuntimeEnv> {
	try {
		const context = await getCloudflareContext();
		if (context?.env) {
			return context.env as RuntimeEnv;
		}
	} catch (error) {
		// Cloudflare context is unavailable (most likely running locally via next dev).
		if (process.env.NODE_ENV !== "production") {
			console.warn(
				"Cloudflare bindings unavailable, falling back to process.env",
				error,
			);
		}
	}

	return process.env as RuntimeEnv;
}
