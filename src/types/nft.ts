export interface NFTImage {
	id: string;
	imageUrl: string;
	thumbnailUrl: string;
	title: string;
	description: string;
	uploader: {
		address: string;
		username?: string;
		profileImage?: string;
	};
	nftMetadata: {
		tokenId: string;
		contractAddress: string;
		transactionHash: string;
		mintedAt: string;
	};
	createdAt: string;
}
