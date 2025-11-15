"use client";

import { useWeb3 } from "@/providers/Web3Provider";
import { Wallet, LogOut } from "lucide-react";

export function WalletButton() {
	const { account, isConnected, connect, disconnect } = useWeb3();

	if (isConnected && account) {
		return (
			<div className="flex items-center gap-2">
				<div className="glass-card px-4 py-2 flex items-center gap-2">
					<div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
					<span className="text-white text-sm font-mono">
						{account.slice(0, 6)}...{account.slice(-4)}
					</span>
				</div>
				<button
					type="button"
					onClick={disconnect}
					className="glass-card p-2 hover:bg-red-500/20 transition-colors"
					title="Disconnect"
				>
					<LogOut className="w-5 h-5 text-white" />
				</button>
			</div>
		);
	}

	return (
		<button
			type="button"
			onClick={connect}
			className="primary-button flex items-center gap-2"
		>
			<Wallet className="w-5 h-5" />
			<span>지갑 연결</span>
		</button>
	);
}
