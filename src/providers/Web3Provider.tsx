"use client";

import { BrowserProvider, type Eip1193Provider } from "ethers";
import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useState,
} from "react";
import toast from "react-hot-toast";
import { MONAD_TESTNET } from "@/lib/monad";

interface Web3ContextType {
	account: string | null;
	isConnected: boolean;
	provider: BrowserProvider | null;
	connect: () => Promise<void>;
	disconnect: () => void;
	switchToMonad: () => Promise<void>;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export function Web3Provider({ children }: { children: ReactNode }) {
	const [account, setAccount] = useState<string | null>(null);
	const [provider, setProvider] = useState<BrowserProvider | null>(null);

	useEffect(() => {
		checkConnection();
	}, []);

	const checkConnection = async () => {
		if (typeof window !== "undefined" && window.ethereum) {
			try {
				const provider = new BrowserProvider(
					window.ethereum as unknown as Eip1193Provider,
				);
				const accounts = await provider.listAccounts();
				if (accounts.length > 0) {
					setAccount(accounts[0].address);
					setProvider(provider);
				}
			} catch (error) {
				console.error("Failed to check connection:", error);
			}
		}
	};

	const connect = async () => {
		if (!window.ethereum) {
			toast.error("MetaMask가 설치되지 않았습니다");
			window.open("https://metamask.io/download/", "_blank");
			return;
		}

		try {
			const provider = new BrowserProvider(
				window.ethereum as unknown as Eip1193Provider,
			);
			const accounts = await provider.send("eth_requestAccounts", []);

			if (accounts.length > 0) {
				setAccount(accounts[0]);
				setProvider(provider);
				toast.success("지갑이 연결되었습니다");

				// Check if on correct network
				await switchToMonad();
			}
		} catch (error: unknown) {
			console.error("Failed to connect:", error);
			if (error instanceof Error) {
				toast.error(`연결 실패: ${error.message}`);
			} else {
				toast.error("지갑 연결에 실패했습니다");
			}
		}
	};

	const disconnect = () => {
		setAccount(null);
		setProvider(null);
		toast.success("지갑 연결이 해제되었습니다");
	};

	const switchToMonad = async () => {
		if (!window.ethereum) return;

		try {
			await window.ethereum.request({
				method: "wallet_switchEthereumChain",
				params: [{ chainId: `0x${MONAD_TESTNET.chainId.toString(16)}` }],
			});
		} catch (error: unknown) {
			// Chain not added, try adding it
			if (
				error &&
				typeof error === "object" &&
				"code" in error &&
				error.code === 4902
			) {
				try {
					await window.ethereum.request({
						method: "wallet_addEthereumChain",
						params: [
							{
								chainId: `0x${MONAD_TESTNET.chainId.toString(16)}`,
								chainName: MONAD_TESTNET.chainName,
								rpcUrls: [MONAD_TESTNET.rpcUrl],
								nativeCurrency: MONAD_TESTNET.nativeCurrency,
								blockExplorerUrls: [MONAD_TESTNET.blockExplorer],
							},
						],
					});
				} catch (addError) {
					console.error("Failed to add Monad network:", addError);
					toast.error("Monad 네트워크 추가 실패");
				}
			} else {
				console.error("Failed to switch network:", error);
			}
		}
	};

	return (
		<Web3Context.Provider
			value={{
				account,
				isConnected: !!account,
				provider,
				connect,
				disconnect,
				switchToMonad,
			}}
		>
			{children}
		</Web3Context.Provider>
	);
}

export function useWeb3() {
	const context = useContext(Web3Context);
	if (context === undefined) {
		throw new Error("useWeb3 must be used within a Web3Provider");
	}
	return context;
}

// Extend Window interface for ethereum
declare global {
	interface Window {
		ethereum?: {
			isMetaMask?: boolean;
			request: (args: {
				method: string;
				params?: unknown[];
			}) => Promise<unknown>;
			on: (event: string, callback: (...args: unknown[]) => void) => void;
			removeListener: (
				event: string,
				callback: (...args: unknown[]) => void,
			) => void;
		};
	}
}
