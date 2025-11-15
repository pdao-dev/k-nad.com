import Link from "next/link";
import { and, desc, eq, isNotNull } from "drizzle-orm";
import { getDb, images, users } from "@/db";
import { GalleryGrid } from "@/components/gallery/GalleryGrid";
import { HeroSection } from "@/components/hero/HeroSection";
import type { NFTImage } from "@/types/nft";

const DEFAULT_ADDRESS = "0x0000000000000000000000000000000000000000";
const GALLERY_LIMIT = 60;

async function fetchGalleryImages(): Promise<NFTImage[]> {
	const db = await getDb();

	const records = await db
		.select({
			image: images,
			uploader: users,
		})
		.from(images)
		.leftJoin(users, eq(images.userId, users.id))
		.where(and(isNotNull(images.tokenId), eq(images.isApproved, true)))
		.orderBy(desc(images.mintedAt))
		.limit(GALLERY_LIMIT);

	return records.map(({ image, uploader }) => {
		const createdAt = image.createdAt ?? new Date();
		const mintedAt = image.mintedAt ?? createdAt;

		return {
			id: image.id,
			imageUrl: image.imageUrl,
			thumbnailUrl: image.thumbnailUrl || image.imageUrl,
			title: image.title ?? "",
			description: image.description ?? "",
			uploader: {
				address: uploader?.walletAddress ?? DEFAULT_ADDRESS,
				username: uploader?.username ?? undefined,
				profileImage: uploader?.profileImage ?? undefined,
			},
			nftMetadata: {
				tokenId: image.tokenId ?? "",
				contractAddress: image.contractAddress ?? "",
				transactionHash: image.transactionHash ?? "",
				mintedAt: mintedAt.toISOString(),
			},
			createdAt: createdAt.toISOString(),
		};
	});
}

function EmptyGalleryState() {
	return (
		<div className="glass-card border border-dashed border-violet-500/40 p-10 text-center space-y-4">
			<h3 className="text-2xl font-semibold text-white">
				아직 업로드된 작품이 없습니다.
			</h3>
			<p className="text-violet-200">
				첫 번째 Monad Testnet NFT 사진을 업로드해 커뮤니티의 역사를
				만들어보세요.
			</p>
			<Link href="/upload" className="inline-flex primary-button">
				첫 작품 업로드하기
			</Link>
		</div>
	);
}

export default async function HomePage() {
	const galleryImages = await fetchGalleryImages();

	return (
		<main>
			<HeroSection />
			<section className="relative monad-gradient-bg py-20">
				<div className="absolute inset-0 monad-logo-pattern opacity-50 pointer-events-none" />
				<div className="container mx-auto relative z-10">
					<div className="text-center mb-12">
						<h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
							Community Archive
						</h2>
						<p className="text-violet-300 text-lg">
							한국나드들이 공유한 소중한 순간들
						</p>
					</div>

					{galleryImages.length > 0 ? (
						<GalleryGrid images={galleryImages} />
					) : (
						<EmptyGalleryState />
					)}
				</div>
			</section>
		</main>
	);
}
