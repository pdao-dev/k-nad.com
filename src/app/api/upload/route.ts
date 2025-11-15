import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import type { Address } from "viem";
import handleApiError from "@/lib/api-error";
import { uploadToR2, uploadJsonToR2, deleteFromR2 } from "@/lib/r2";
import { getDb, images, users } from "@/db";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_CONTENT_TYPES = [
	"image/jpeg",
	"image/png",
	"image/webp",
	"image/gif",
	"image/heic",
];

const uploadSchema = z.object({
	walletAddress: z
		.string()
		.regex(/^0x[a-fA-F0-9]{40}$/, {
			message: "유효한 EVM 지갑 주소를 입력해주세요.",
		})
		.transform((value) => value.toLowerCase()),
	title: z
		.string()
		.max(160, "제목은 160자 이하로 입력해주세요.")
		.optional()
		.transform((value) => value?.trim() || undefined),
	description: z
		.string()
		.max(1000, "설명은 1000자 이하로 입력해주세요.")
		.optional()
		.transform((value) => value?.trim() || undefined),
});

function ensureValidFile(file: File) {
	if (file.size === 0) {
		throw new Error("비어있는 파일은 업로드할 수 없습니다.");
	}

	if (file.size > MAX_FILE_SIZE) {
		throw new Error("10MB 이하의 이미지만 업로드할 수 있습니다.");
	}

	if (file.type && !ALLOWED_CONTENT_TYPES.includes(file.type)) {
		throw new Error("지원하지 않는 이미지 형식입니다.");
	}
}

function buildMetadataPayload({
	title,
	description,
	imageUrl,
	externalUrl,
	walletAddress,
}: {
	title?: string;
	description?: string;
	imageUrl: string;
	externalUrl: string;
	walletAddress: string;
}) {
	return {
		name: title || "K-nads Memory",
		description:
			description ||
			"한국 오프라인 이벤트의 순간을 Monad Testnet에 영원히 기록합니다.",
		image: imageUrl,
		external_url: externalUrl,
		attributes: [
			{ trait_type: "Uploader", value: walletAddress },
			{ trait_type: "Network", value: "Monad Testnet" },
		],
		properties: {
			project: "K-nads.com",
			storage: "Cloudflare R2",
		},
	};
}

export async function POST(request: NextRequest) {
	try {
		const formData = await request.formData();
		const file = formData.get("file");

		if (!(file instanceof File)) {
			return NextResponse.json(
				{ success: false, error: "이미지 파일을 첨부해주세요." },
				{ status: 400 },
			);
		}

		try {
			ensureValidFile(file);
		} catch (validationError) {
			return NextResponse.json(
				{
					success: false,
					error:
						validationError instanceof Error
							? validationError.message
							: "업로드할 수 없는 파일입니다.",
				},
				{ status: 400 },
			);
		}

		const parsed = uploadSchema.parse({
			walletAddress: formData.get("walletAddress"),
			title: formData.get("title"),
			description: formData.get("description"),
		});

		const db = await getDb();
		const normalizedAddress = parsed.walletAddress as Address;
		const now = new Date();

		let existingUser = await db.query.users.findFirst({
			where: eq(users.walletAddress, normalizedAddress),
		});

		if (!existingUser) {
			const userId = crypto.randomUUID();
			await db.insert(users).values({
				id: userId,
				walletAddress: normalizedAddress,
				createdAt: now,
				updatedAt: now,
			});

			existingUser = {
				id: userId,
				walletAddress: normalizedAddress,
				username: null,
				profileImage: null,
				createdAt: now,
				updatedAt: now,
			};
		}

		const imageId = crypto.randomUUID();
		const uploadedKeys: string[] = [];

		try {
			const imageUpload = await uploadToR2(file, `images/${normalizedAddress}`);
			if (!imageUpload.success || !imageUpload.url || !imageUpload.key) {
				throw new Error(imageUpload.error || "이미지 업로드에 실패했습니다.");
			}
			uploadedKeys.push(imageUpload.key);

			const origin = request.nextUrl.origin;
			const metadataPayload = buildMetadataPayload({
				title: parsed.title,
				description: parsed.description,
				imageUrl: imageUpload.url,
				externalUrl: `${origin}/gallery/${imageId}`,
				walletAddress: normalizedAddress,
			});

			const metadataUpload = await uploadJsonToR2(metadataPayload, {
				filename: `metadata/${imageId}.json`,
			});

			if (
				!metadataUpload.success ||
				!metadataUpload.url ||
				!metadataUpload.key
			) {
				throw new Error(
					metadataUpload.error || "메타데이터 업로드에 실패했습니다.",
				);
			}
			uploadedKeys.push(metadataUpload.key);

			await db.insert(images).values({
				id: imageId,
				userId: existingUser.id,
				title: parsed.title ?? null,
				description: parsed.description ?? null,
				imageUrl: imageUpload.url,
				thumbnailUrl: imageUpload.url,
				r2Key: imageUpload.key,
				metadataUrl: metadataUpload.url,
				metadataKey: metadataUpload.key,
				createdAt: now,
				updatedAt: now,
			});

			return NextResponse.json({
				success: true,
				upload: {
					id: imageId,
					imageUrl: imageUpload.url,
					metadataUrl: metadataUpload.url,
				},
			});
		} catch (uploadError) {
			await Promise.all(uploadedKeys.map((key) => deleteFromR2(key)));
			throw uploadError;
		}
	} catch (error) {
		return handleApiError(error);
	}
}
