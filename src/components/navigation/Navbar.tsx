"use client";

import Link from "next/link";
import Image from "next/image";
import { WalletButton } from "@/components/wallet/WalletButton";

export function Navbar() {
	return (
		<nav className="fixed top-0 left-0 right-0 z-50 glass-card mx-4 mt-4 rounded-2xl border-violet-500/20">
			<div className="container mx-auto px-6 py-4">
				<div className="flex items-center justify-between">
					{/* Logo */}
					<Link href="/" className="flex items-center gap-3 group">
						<div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-violet-500/30 group-hover:shadow-violet-500/50 transition-all relative">
							<Image
								src="/logo.PNG"
								alt="K-NADS Logo"
								width={40}
								height={40}
								className="object-cover"
							/>
						</div>
						<div className="flex flex-col">
							<span className="text-white font-bold text-lg leading-none">
								K-NADS
							</span>
							<span className="text-violet-400 text-xs font-medium uppercase tracking-wider">
								Archive
							</span>
						</div>
					</Link>

					{/* Navigation Links */}
					<div className="flex items-center gap-6">
						<Link
							href="/"
							className="text-gray-300 hover:text-violet-400 transition-colors font-medium"
						>
							Gallery
						</Link>
						<Link
							href="/upload"
							className="text-gray-300 hover:text-violet-400 transition-colors font-medium"
						>
							Upload
						</Link>
						<Link
							href="/admin"
							className="text-gray-300 hover:text-violet-400 transition-colors font-medium"
						>
							Admin
						</Link>
						<WalletButton />
					</div>
				</div>
			</div>
		</nav>
	);
}
