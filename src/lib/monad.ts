// Monad Testnet Configuration
export const MONAD_TESTNET = {
	chainId: 10143,
	chainName: "Monad Testnet",
	rpcUrl: process.env.NEXT_PUBLIC_MONAD_RPC_URL || "https://testnet.monad.xyz",
	blockExplorer: "https://explorer.testnet.monad.xyz",
	nativeCurrency: {
		name: "Monad",
		symbol: "MON",
		decimals: 18,
	},
};

export const NFT_CONTRACT_ADDRESS =
	process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS || "";
