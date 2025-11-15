"use client";

import { Upload } from "lucide-react";
import Link from "next/link";

interface UploadButtonProps {
	className?: string;
}

export function UploadButton({ className = "" }: UploadButtonProps) {
	return (
		<Link href="/upload" className={className}>
			<button
				type="button"
				className="primary-button flex items-center gap-2 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all"
			>
				<Upload className="w-5 h-5" />
				<span>Upload</span>
			</button>
		</Link>
	);
}
