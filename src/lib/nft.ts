import {
	createPublicClient,
	http,
	parseEventLogs,
	zeroAddress,
	type Address,
	type Hash,
} from "viem";
import { monadTestnet } from "viem/chains";
import { MONAD_GALLERY_NFT_ABI } from "@/lib/abi/monadGalleryNft";
import { MONAD_TESTNET } from "@/lib/monad";
import { getRuntimeEnv, type RuntimeEnv } from "@/lib/runtime";

export interface VerifiedMintResult {
	tokenId: string;
	minter: Address;
	contractAddress: Address;
	metadataUrl: string;
	transactionHash: Hash;
	mintedAt: Date;
}

function resolveContractAddress(env: RuntimeEnv): Address {
	const address =
		(env.NFT_CONTRACT_ADDRESS as string | undefined) ||
		(env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS as string | undefined);

	if (!address) {
		throw new Error("NFT_CONTRACT_ADDRESS is not configured");
	}

	return address as Address;
}

function resolveRpcUrl(env: RuntimeEnv): string {
	return (
		(env.MONAD_RPC_URL as string | undefined) ||
		(env.NEXT_PUBLIC_MONAD_RPC_URL as string | undefined) ||
		MONAD_TESTNET.rpcUrl
	);
}

export async function verifyMintTransaction(
	transactionHash: Hash,
): Promise<VerifiedMintResult> {
	const env = await getRuntimeEnv();
	const contractAddress = resolveContractAddress(env);
	const rpcUrl = resolveRpcUrl(env);
	const publicClient = createPublicClient({
		chain: monadTestnet,
		transport: http(rpcUrl),
	});

	const receipt = await publicClient.waitForTransactionReceipt({
		hash: transactionHash,
	});

	if (receipt.status !== "success") {
		throw new Error("해당 트랜잭션이 아직 확정되지 않았습니다.");
	}

	const block = await publicClient.getBlock({ blockHash: receipt.blockHash });
	const logs = parseEventLogs({
		abi: MONAD_GALLERY_NFT_ABI,
		logs: receipt.logs,
		eventName: "Transfer",
	});

	const mintedLog = logs.find(
		(log) =>
			log.address?.toLowerCase() === contractAddress.toLowerCase() &&
			log.args.from === zeroAddress,
	);

	if (!mintedLog) {
		throw new Error("해당 트랜잭션에서 민팅 이벤트를 찾을 수 없습니다.");
	}

	const tokenId = (mintedLog.args.tokenId as bigint).toString();
	const minter = mintedLog.args.to as Address;

	const metadataUrl = (await publicClient.readContract({
		abi: MONAD_GALLERY_NFT_ABI,
		address: contractAddress,
		functionName: "tokenURI",
		args: [BigInt(tokenId)],
	})) as string;

	return {
		tokenId,
		minter,
		metadataUrl,
		contractAddress,
		transactionHash,
		mintedAt: new Date(Number(block.timestamp) * 1000),
	};
}
