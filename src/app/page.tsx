import { GalleryGrid } from "@/components/gallery/GalleryGrid";
import { HeroSection } from "@/components/hero/HeroSection";

// Temporary mock data - will be replaced with real data from D1
const mockImages = [
	{
		id: "1",
		imageUrl: "https://picsum.photos/400/600?random=1",
		thumbnailUrl: "https://picsum.photos/400/600?random=1",
		title: "K-POP Concert 2024",
		description: "Amazing concert experience in Seoul",
		uploader: {
			address: "0x1234567890123456789012345678901234567890",
			username: "KpopFan",
		},
		nftMetadata: {
			tokenId: "1",
			contractAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
			mintedAt: new Date().toISOString(),
		},
		createdAt: new Date().toISOString(),
	},
	{
		id: "2",
		imageUrl: "https://picsum.photos/400/500?random=2",
		thumbnailUrl: "https://picsum.photos/400/500?random=2",
		title: "Korean Street Food Festival",
		description: "Delicious food and great atmosphere",
		uploader: {
			address: "0x2345678901234567890123456789012345678901",
			username: "FoodLover",
		},
		nftMetadata: {
			tokenId: "2",
			contractAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
			mintedAt: new Date().toISOString(),
		},
		createdAt: new Date().toISOString(),
	},
	{
		id: "3",
		imageUrl: "https://picsum.photos/400/700?random=3",
		thumbnailUrl: "https://picsum.photos/400/700?random=3",
		title: "Seoul Night View",
		description: "Beautiful city lights from N Seoul Tower",
		uploader: {
			address: "0x3456789012345678901234567890123456789012",
			username: "NightPhotographer",
		},
		nftMetadata: {
			tokenId: "3",
			contractAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
			mintedAt: new Date().toISOString(),
		},
		createdAt: new Date().toISOString(),
	},
	{
		id: "4",
		imageUrl: "https://picsum.photos/400/550?random=4",
		thumbnailUrl: "https://picsum.photos/400/550?random=4",
		title: "Busan Beach Party",
		description: "Summer vibes at Haeundae Beach",
		uploader: {
			address: "0x4567890123456789012345678901234567890123",
			username: "BeachVibes",
		},
		nftMetadata: {
			tokenId: "4",
			contractAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
			mintedAt: new Date().toISOString(),
		},
		createdAt: new Date().toISOString(),
	},
	{
		id: "5",
		imageUrl: "https://picsum.photos/400/650?random=5",
		thumbnailUrl: "https://picsum.photos/400/650?random=5",
		title: "Traditional Hanbok Experience",
		description: "Beautiful hanbok photoshoot at Gyeongbokgung",
		uploader: {
			address: "0x5678901234567890123456789012345678901234",
			username: "KoreaCulture",
		},
		nftMetadata: {
			tokenId: "5",
			contractAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
			mintedAt: new Date().toISOString(),
		},
		createdAt: new Date().toISOString(),
	},
	{
		id: "6",
		imageUrl: "https://picsum.photos/400/580?random=6",
		thumbnailUrl: "https://picsum.photos/400/580?random=6",
		title: "K-Drama Filming Location",
		description: "Visited the iconic filming spot from my favorite drama",
		uploader: {
			address: "0x6789012345678901234567890123456789012345",
			username: "DramaFan",
		},
		nftMetadata: {
			tokenId: "6",
			contractAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
			mintedAt: new Date().toISOString(),
		},
		createdAt: new Date().toISOString(),
	},
];

export default async function HomePage() {
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
					<GalleryGrid images={mockImages} />
				</div>
			</section>
		</main>
	);
}
