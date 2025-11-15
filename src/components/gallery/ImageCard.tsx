"use client";

import { useState } from "react";
import Image from "next/image";
import type { NFTImage } from "@/types/nft";

interface ImageCardProps {
	image: NFTImage;
	onClick: () => void;
}

export function ImageCard({ image, onClick }: ImageCardProps) {
	const [isHovered, setIsHovered] = useState(false);

	return (
		<div
			className="mb-4 cursor-pointer group relative overflow-hidden rounded-xl transition-all hover:scale-[1.02]"
			onClick={onClick}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					onClick();
				}
			}}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			<div className="relative aspect-auto">
				<Image
					src={image.thumbnailUrl || image.imageUrl}
					alt={image.title || "Gallery image"}
					width={400}
					height={600}
					className="w-full h-auto object-cover rounded-xl"
					loading="lazy"
				/>

				{/* Hover Overlay */}
				{isHovered && (
					<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent rounded-xl flex flex-col justify-end p-4 animate-fade-in">
						<div className="flex items-center gap-2 mb-2">
							{image.uploader.profileImage ? (
								<Image
									src={image.uploader.profileImage}
									alt={image.uploader.username || "Uploader"}
									width={32}
									height={32}
									className="w-8 h-8 rounded-full"
								/>
							) : (
								<div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
									{image.uploader.username?.[0] || "?"}
								</div>
							)}
							<div>
								<p className="text-white text-sm font-medium">
									{image.uploader.username || "Anonymous"}
								</p>
								<p className="text-gray-300 text-xs">
									{image.uploader.address.slice(0, 6)}...
									{image.uploader.address.slice(-4)}
								</p>
							</div>
						</div>
						{image.title && (
							<p className="text-white font-semibold text-sm">{image.title}</p>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
