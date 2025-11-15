"use client";

import { Upload, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

export function HeroSection() {
	const router = useRouter();

	const handleUploadClick = () => {
		router.push("/upload");
	};

	return (
		<div className="relative flex min-h-screen flex-col items-center justify-center monad-gradient-bg px-4 pt-20">
			{/* Monad Logo Pattern */}
			<div className="absolute inset-0 monad-logo-pattern pointer-events-none" />

			{/* Grid Pattern Overlay */}
			<div className="absolute inset-0 grid-pattern pointer-events-none" />

			{/* Animated Orbs - Monad + Korean Colors */}
			<div className="absolute inset-0 pointer-events-none" style={{ overflow: 'hidden' }}>
				{/* Monad Purple Orbs */}
				<div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-600 rounded-full mix-blend-screen filter blur-3xl opacity-25 float-orb" />
				<div className="absolute top-1/3 right-1/4 w-96 h-96 bg-violet-500 rounded-full mix-blend-screen filter blur-3xl opacity-30 float-orb animation-delay-2000" />
				<div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-purple-600 rounded-full mix-blend-screen filter blur-3xl opacity-20 float-orb animation-delay-4000" />

				{/* Korean Flag Inspired Accents */}
				<div className="absolute top-1/2 right-1/3 w-64 h-64 bg-red-600 rounded-full mix-blend-screen filter blur-3xl opacity-15 float-orb animation-delay-3000" />
				<div className="absolute bottom-1/3 right-1/4 w-56 h-56 bg-blue-600 rounded-full mix-blend-screen filter blur-3xl opacity-15 float-orb animation-delay-5000" />
			</div>

			{/* Main Content */}
			<div className="z-10 flex flex-col items-center text-center max-w-5xl">
				{/* Badge */}
				<div className="mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card animate-fade-in">
					<Sparkles className="w-4 h-4 text-violet-400" />
					<span className="text-sm font-semibold text-violet-300 uppercase tracking-wider">
						Powered by Monad
					</span>
				</div>

				{/* Title */}
				<h1 className="hero-title mb-4 animate-fade-in">
					K-NADS.COM
				</h1>

				{/* Subtitle */}
				<p className="hero-subtitle mb-6 max-w-3xl">
					코리아나드들의 오프라인 아카이브
				</p>

				{/* Description */}
				<p className="body-text mb-12 max-w-2xl text-base md:text-lg">
					한국의 오프라인 이벤트 순간들을 NFT로 영원히 보존하세요
					<br />
					블록체인 위에 기록되는 당신의 소중한 추억
				</p>

				{/* Upload Button */}
				<button
					type="button"
					onClick={handleUploadClick}
					className="primary-button group flex items-center gap-3"
				>
					<Upload className="w-5 h-5 group-hover:rotate-12 transition-transform" />
					<span>Upload Memory</span>
				</button>

				{/* Stats */}
				<div className="mt-16 grid grid-cols-3 gap-8 md:gap-16">
					<div className="text-center">
						<div className="text-3xl md:text-4xl font-bold text-white mb-2">
							∞
						</div>
						<div className="text-sm text-gray-400 uppercase tracking-wide">
							Forever
						</div>
					</div>
					<div className="text-center">
						<div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent mb-2">
							Web3
						</div>
						<div className="text-sm text-gray-400 uppercase tracking-wide">
							On-Chain
						</div>
					</div>
					<div className="text-center">
						<div className="text-3xl md:text-4xl font-bold text-white mb-2">
							🇰🇷
						</div>
						<div className="text-sm text-gray-400 uppercase tracking-wide">
							Korea
						</div>
					</div>
				</div>
			</div>

			{/* Scroll Indicator */}
			<div className="absolute bottom-10 z-10 flex flex-col items-center gap-2 animate-bounce">
				<p className="text-sm text-violet-300 font-medium">
					Explore Gallery
				</p>
				<svg
					className="w-6 h-6 text-violet-400"
					fill="none"
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth="2"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<title>Scroll down</title>
					<path d="M19 14l-7 7m0 0l-7-7m7 7V3" />
				</svg>
			</div>

			{/* Glow Effect at Bottom */}
			<div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-violet-600/10 to-transparent pointer-events-none" />
		</div>
	);
}
