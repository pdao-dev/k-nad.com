"use client";

import { useState } from "react";
// import Masonry from "react-masonry-css";
import type { NFTImage } from "@/types/nft";
import { ImageCard } from "./ImageCard";
import { ImageDetailModal } from "./ImageDetailModal";

interface GalleryGridProps {
	images: NFTImage[];
}

export function GalleryGrid({ images }: GalleryGridProps) {
	const [selectedImage, setSelectedImage] = useState<NFTImage | null>(null);

	const breakpointColumns = {
		default: 4,
		1536: 3,
		1024: 2,
		640: 1,
	};

	return (
		<>
			<div className="w-full px-4 py-12">
				{/* Temporarily using simple grid instead of Masonry */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
					{images.map((image) => (
						<ImageCard
							key={image.id}
							image={image}
							onClick={() => setSelectedImage(image)}
						/>
					))}
				</div>
			</div>

			{selectedImage && (
				<ImageDetailModal
					image={selectedImage}
					onClose={() => setSelectedImage(null)}
				/>
			)}
		</>
	);
}
