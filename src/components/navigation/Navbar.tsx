"use client";

import Link from "next/link";
import { WalletButton } from "@/components/wallet/WalletButton";

export function Navbar() {
	return (
		<nav className="fixed top-0 left-0 right-0 z-50 glass-card mx-4 mt-4 rounded-2xl border-violet-500/20">
			<div className="container mx-auto px-6 py-4">
				<div className="flex items-center justify-between">
					{/* Logo */}
					<Link href="/" className="flex items-center gap-3 group">
						<div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30 group-hover:shadow-violet-500/50 transition-all">
							<span className="text-white font-black text-xl">K</span>
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
						<WalletButton />
					</div>
				</div>
			</div>
		</nav>
	);
}
