"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImageUploader } from "@/modules/upload/components/ImageUploader";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function UploadPage() {
	const router = useRouter();
	const [selectedImage, setSelectedImage] = useState<File | null>(null);
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [isUploading, setIsUploading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!selectedImage) {
			toast.error("이미지를 선택해주세요");
			return;
		}

		setIsUploading(true);

		try {
			// TODO: Implement actual upload logic
			// 1. Upload to R2
			// 2. Mint NFT
			// 3. Save to D1

			await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate upload

			toast.success("업로드 성공!");
			router.push("/");
		} catch (error) {
			console.error("Upload error:", error);
			toast.error("업로드 실패. 다시 시도해주세요.");
		} finally {
			setIsUploading(false);
		}
	};

	return (
		<div className="min-h-screen gradient-bg">
			<div className="container mx-auto px-4 py-12">
				{/* Header */}
				<div className="mb-8">
					<Link
						href="/"
						className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
					>
						<ArrowLeft className="w-4 h-4" />
						<span>홈으로 돌아가기</span>
					</Link>
					<h1 className="text-4xl font-bold text-white mb-2">
						추억을 NFT로 영원히
					</h1>
					<p className="text-gray-400">
						이벤트 사진을 업로드하고 블록체인에 기록하세요
					</p>
				</div>

				{/* Upload Form */}
				<form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">
					{/* Image Uploader */}
					<ImageUploader
						onImageSelect={setSelectedImage}
						selectedImage={selectedImage}
						onClear={() => setSelectedImage(null)}
					/>

					{/* Title Input */}
					<div>
						<label
							htmlFor="title"
							className="block text-sm font-medium text-gray-300 mb-2"
						>
							제목 (선택)
						</label>
						<input
							type="text"
							id="title"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="예: BTS 콘서트 2024"
							className="w-full px-4 py-3 bg-black/30 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
						/>
					</div>

					{/* Description Input */}
					<div>
						<label
							htmlFor="description"
							className="block text-sm font-medium text-gray-300 mb-2"
						>
							설명
						</label>
						<textarea
							id="description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="이 순간에 대해 설명해주세요..."
							rows={4}
							className="w-full px-4 py-3 bg-black/30 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
						/>
					</div>

					{/* Submit Button */}
					<button
						type="submit"
						disabled={!selectedImage || isUploading}
						className="w-full primary-button disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
					>
						{isUploading ? (
							<>
								<Loader2 className="w-5 h-5 animate-spin" />
								<span>업로드 중...</span>
							</>
						) : (
							<span>업로드 & NFT 민팅</span>
						)}
					</button>

					{/* Info Text */}
					<p className="text-sm text-gray-500 text-center">
						업로드된 이미지는 Monad Testnet에 NFT로 민팅되며, 이 과정은 되돌릴
						수 없습니다.
					</p>
				</form>
			</div>
		</div>
	);
}
