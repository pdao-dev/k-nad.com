"use client";

import { X, Copy, Flag } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import copy from "copy-to-clipboard";
import toast from "react-hot-toast";
import type { NFTImage } from "@/types/nft";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

interface ImageDetailModalProps {
	image: NFTImage;
	onClose: () => void;
}

export function ImageDetailModal({ image, onClose }: ImageDetailModalProps) {
	const [isReporting, setIsReporting] = useState(false);

	const handleCopyLink = () => {
		const url = `${window.location.origin}/gallery/${image.id}`;
		copy(url);
		toast.success("링크가 복사되었습니다");
	};

	const handleCopyImage = () => {
		copy(image.imageUrl);
		toast.success("이미지 URL이 복사되었습니다");
	};

	const handleReport = async () => {
		setIsReporting(true);
		// TODO: Implement report functionality
		toast.success("신고가 접수되었습니다");
		setIsReporting(false);
	};

	return (
		<Dialog open onOpenChange={onClose}>
			<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#1a1a1a] border-gray-800">
				<DialogHeader>
					<DialogTitle className="sr-only">이미지 상세 정보</DialogTitle>
					<button
						type="button"
						onClick={onClose}
						className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
					>
						<X className="h-4 w-4 text-white" />
						<span className="sr-only">Close</span>
					</button>
				</DialogHeader>

				<div className="space-y-6">
					{/* Image */}
					<div className="relative w-full rounded-lg overflow-hidden">
						<Image
							src={image.imageUrl}
							alt={image.title || "Gallery image"}
							width={1200}
							height={800}
							className="w-full h-auto object-contain"
						/>
					</div>

					{/* Uploader Info */}
					<div className="flex items-start justify-between">
						<div className="flex items-center gap-3">
							{image.uploader.profileImage ? (
								<Image
									src={image.uploader.profileImage}
									alt={image.uploader.username || "Uploader"}
									width={48}
									height={48}
									className="w-12 h-12 rounded-full"
								/>
							) : (
								<div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-lg font-bold">
									{image.uploader.username?.[0] || "?"}
								</div>
							)}
							<div>
								<p className="text-white font-semibold">
									{image.uploader.username || "Anonymous"}
								</p>
								<p className="text-gray-400 text-sm font-mono">
									{image.uploader.address.slice(0, 8)}...
									{image.uploader.address.slice(-6)}
								</p>
							</div>
						</div>

						{/* NFT Info */}
						{image.nftMetadata.tokenId && (
							<div className="text-right">
								<p className="text-gray-400 text-sm">Token ID</p>
								<p className="text-white font-mono">
									#{image.nftMetadata.tokenId}
								</p>
							</div>
						)}
					</div>

					{/* Title & Description */}
					{image.title && (
						<h2 className="text-2xl font-bold text-white">{image.title}</h2>
					)}
					{image.description && (
						<p className="text-gray-300 leading-relaxed">{image.description}</p>
					)}

					{/* Metadata */}
					<div className="grid grid-cols-2 gap-4 p-4 bg-black/30 rounded-lg">
						<div>
							<p className="text-gray-400 text-sm">Minted At</p>
							<p className="text-white">
								{new Date(image.nftMetadata.mintedAt).toLocaleDateString(
									"ko-KR",
								)}
							</p>
						</div>
						<div>
							<p className="text-gray-400 text-sm">Contract</p>
							<p className="text-white font-mono text-sm">
								{image.nftMetadata.contractAddress.slice(0, 6)}...
								{image.nftMetadata.contractAddress.slice(-4)}
							</p>
						</div>
					</div>

					{/* Action Buttons */}
					<div className="flex gap-3">
						<button
							type="button"
							onClick={handleCopyLink}
							className="flex-1 glass-card px-4 py-3 flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
						>
							<Copy className="w-4 h-4 text-white" />
							<span className="text-white">링크 복사</span>
						</button>
						<button
							type="button"
							onClick={handleCopyImage}
							className="flex-1 glass-card px-4 py-3 flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
						>
							<Copy className="w-4 h-4 text-white" />
							<span className="text-white">이미지 URL 복사</span>
						</button>
						<button
							type="button"
							onClick={handleReport}
							disabled={isReporting}
							className="glass-card px-4 py-3 flex items-center justify-center gap-2 hover:bg-red-500/20 transition-colors disabled:opacity-50"
						>
							<Flag className="w-4 h-4 text-red-400" />
							<span className="text-red-400">신고</span>
						</button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
