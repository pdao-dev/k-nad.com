import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export async function getDb() {
	const { env } = await getCloudflareContext();
	if (!env?.k_nad) {
		throw new Error("D1 database binding k_nad is not configured");
	}

	return drizzle(env.k_nad, { schema });
}

export * from "./schema";
