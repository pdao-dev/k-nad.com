import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

/** @type {import("next").NextConfig} */
const nextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "picsum.photos",
			},
			{
				protocol: "https",
				hostname: "**.r2.dev",
			},
		],
	},
	// Disable source maps in production
	productionBrowserSourceMaps: false,
	// Minimal configuration to reduce bundle size
	experimental: {
		optimizePackageImports: ["lucide-react"],
	},
	// Turbopack configuration (empty to allow webpack)
	turbopack: {},
};

if (
	process.env.NODE_ENV === "development" &&
	!process.env.SKIP_CLOUDFLARE_DEV
) {
	initOpenNextCloudflareForDev();
}

export default nextConfig;
