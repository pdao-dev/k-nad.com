"use client";

import { useState } from "react";
import Masonry from "react-masonry-css";
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
				<Masonry
					breakpointCols={breakpointColumns}
					className="flex w-full gap-4"
					columnClassName="bg-clip-padding"
				>
					{images.map((image) => (
						<ImageCard
							key={image.id}
							image={image}
							onClick={() => setSelectedImage(image)}
						/>
					))}
				</Masonry>
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
