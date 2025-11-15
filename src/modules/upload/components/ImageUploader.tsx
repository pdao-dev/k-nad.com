"use client";

import { Upload, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

interface ImageUploaderProps {
	onImageSelect: (file: File) => void;
	selectedImage: File | null;
	onClear: () => void;
}

export function ImageUploader({
	onImageSelect,
	selectedImage,
	onClear,
}: ImageUploaderProps) {
	const [preview, setPreview] = useState<string | null>(null);

	const onDrop = useCallback(
		(acceptedFiles: File[]) => {
			const file = acceptedFiles[0];
			if (file) {
				onImageSelect(file);
				const reader = new FileReader();
				reader.onloadend = () => {
					setPreview(reader.result as string);
				};
				reader.readAsDataURL(file);
			}
		},
		[onImageSelect],
	);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: {
			"image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
		},
		maxFiles: 1,
	});

	const handleClear = () => {
		setPreview(null);
		onClear();
	};

	if (preview && selectedImage) {
		return (
			<div className="relative w-full">
				<div className="relative rounded-xl overflow-hidden">
					<Image
						src={preview}
						alt="Preview"
						width={800}
						height={600}
						className="w-full h-auto object-contain max-h-[500px]"
					/>
					<button
						type="button"
						onClick={handleClear}
						className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
					>
						<X className="w-5 h-5 text-white" />
					</button>
				</div>
				<p className="mt-2 text-sm text-gray-400 text-center">
					{selectedImage.name} ({(selectedImage.size / 1024 / 1024).toFixed(2)}{" "}
					MB)
				</p>
			</div>
		);
	}

	return (
		<div
			{...getRootProps()}
			className={`glass-card p-12 cursor-pointer transition-all ${
				isDragActive
					? "border-purple-500 bg-purple-500/10"
					: "hover:border-gray-600"
			}`}
		>
			<input {...getInputProps()} />
			<div className="flex flex-col items-center justify-center gap-4">
				<div className="p-6 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20">
					<Upload className="w-12 h-12 text-purple-400" />
				</div>
				<div className="text-center">
					<p className="text-xl font-semibold text-white mb-2">
						{isDragActive
							? "이미지를 여기에 놓으세요"
							: "이미지를 드래그하거나 클릭하세요"}
					</p>
					<p className="text-sm text-gray-400">
						PNG, JPG, GIF, WEBP 지원 (최대 10MB)
					</p>
				</div>
			</div>
		</div>
	);
}
