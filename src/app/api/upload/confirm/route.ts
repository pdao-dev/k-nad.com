import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import type { Address, Hash } from "viem";
import handleApiError from "@/lib/api-error";
import { getDb, images, users } from "@/db";
import { verifyMintTransaction } from "@/lib/nft";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const confirmSchema = z.object({
	imageId: z.string().uuid({ message: "유효하지 않은 이미지 ID입니다." }),
	transactionHash: z.string().regex(/^0x([A-Fa-f0-9]{64})$/, {
		message: "유효한 트랜잭션 해시를 입력해주세요.",
	}),
});

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { imageId, transactionHash } = confirmSchema.parse(body);
		const db = await getDb();

		const [record] = await db
			.select({
				image: images,
				uploader: users,
			})
			.from(images)
			.leftJoin(users, eq(images.userId, users.id))
			.where(eq(images.id, imageId));

		if (!record?.image) {
			return NextResponse.json(
				{ success: false, error: "이미지 정보를 찾을 수 없습니다." },
				{ status: 404 },
			);
		}

		if (record.image.tokenId) {
			return NextResponse.json(
				{ success: true, message: "이미 민팅이 완료된 업로드입니다." },
				{ status: 200 },
			);
		}

		if (!record.image.metadataUrl) {
			throw new Error("저장된 메타데이터 정보를 찾을 수 없습니다.");
		}

		const verification = await verifyMintTransaction(transactionHash as Hash);

		const uploaderAddress = (record.uploader?.walletAddress || "") as Address;

		if (
			!uploaderAddress ||
			uploaderAddress.toLowerCase() !== verification.minter.toLowerCase()
		) {
			throw new Error("민팅 지갑 주소가 업로더 정보와 일치하지 않습니다.");
		}

		if (
			record.image.metadataUrl.replace(/\/$/, "") !==
			verification.metadataUrl.replace(/\/$/, "")
		) {
			throw new Error(
				"메타데이터 URL이 일치하지 않습니다. 새로고침 후 다시 시도해주세요.",
			);
		}

		await db
			.update(images)
			.set({
				tokenId: verification.tokenId,
				contractAddress: verification.contractAddress,
				transactionHash: verification.transactionHash,
				mintedAt: verification.mintedAt,
				updatedAt: new Date(),
			})
			.where(eq(images.id, imageId));

		return NextResponse.json({
			success: true,
			image: {
				id: imageId,
				tokenId: verification.tokenId,
				transactionHash: verification.transactionHash,
				contractAddress: verification.contractAddress,
				mintedAt: verification.mintedAt.toISOString(),
			},
		});
	} catch (error) {
		return handleApiError(error);
	}
}
