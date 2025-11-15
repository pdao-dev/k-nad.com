export const MONAD_GALLERY_NFT_ABI = [
	{
		type: "event",
		name: "Transfer",
		inputs: [
			{ name: "from", type: "address", indexed: true },
			{ name: "to", type: "address", indexed: true },
			{ name: "tokenId", type: "uint256", indexed: true },
		],
		anonymous: false,
	},
	{
		type: "event",
		name: "MetadataUpdated",
		inputs: [
			{ name: "tokenId", type: "uint256", indexed: true },
			{ name: "metadataUrl", type: "string", indexed: false },
			{ name: "mediaUrl", type: "string", indexed: false },
		],
		anonymous: false,
	},
	{
		type: "function",
		name: "mint",
		stateMutability: "nonpayable",
		inputs: [
			{ name: "to", type: "address" },
			{
				name: "metadata",
				type: "tuple",
				components: [
					{ name: "title", type: "string" },
					{ name: "description", type: "string" },
					{ name: "mediaUrl", type: "string" },
					{ name: "metadataUrl", type: "string" },
				],
			},
		],
		outputs: [{ name: "", type: "uint256" }],
	},
	{
		type: "function",
		name: "mintWithMetadata",
		stateMutability: "nonpayable",
		inputs: [
			{
				name: "metadata",
				type: "tuple",
				components: [
					{ name: "title", type: "string" },
					{ name: "description", type: "string" },
					{ name: "mediaUrl", type: "string" },
					{ name: "metadataUrl", type: "string" },
				],
			},
		],
		outputs: [{ name: "", type: "uint256" }],
	},
	{
		type: "function",
		name: "safeMint",
		stateMutability: "nonpayable",
		inputs: [
			{ name: "to", type: "address" },
			{
				name: "metadata",
				type: "tuple",
				components: [
					{ name: "title", type: "string" },
					{ name: "description", type: "string" },
					{ name: "mediaUrl", type: "string" },
					{ name: "metadataUrl", type: "string" },
				],
			},
			{ name: "data", type: "bytes" },
		],
		outputs: [{ name: "", type: "uint256" }],
	},
	{
		type: "function",
		name: "safeMintWithMetadata",
		stateMutability: "nonpayable",
		inputs: [
			{
				name: "metadata",
				type: "tuple",
				components: [
					{ name: "title", type: "string" },
					{ name: "description", type: "string" },
					{ name: "mediaUrl", type: "string" },
					{ name: "metadataUrl", type: "string" },
				],
			},
		],
		outputs: [{ name: "", type: "uint256" }],
	},
	{
		type: "function",
		name: "updateMetadata",
		stateMutability: "nonpayable",
		inputs: [
			{ name: "tokenId", type: "uint256" },
			{
				name: "metadata",
				type: "tuple",
				components: [
					{ name: "title", type: "string" },
					{ name: "description", type: "string" },
					{ name: "mediaUrl", type: "string" },
					{ name: "metadataUrl", type: "string" },
				],
			},
		],
		outputs: [],
	},
	{
		type: "function",
		name: "tokenURI",
		stateMutability: "view",
		inputs: [{ name: "tokenId", type: "uint256" }],
		outputs: [{ name: "", type: "string" }],
	},
] as const;
