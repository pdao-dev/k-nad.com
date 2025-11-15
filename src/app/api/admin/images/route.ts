import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, isNotNull } from "drizzle-orm";
import { getDb, images, users } from "@/db";
import { isAdminRequest } from "@/lib/admin-auth";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
	const authenticated = await isAdminRequest(request);
	if (!authenticated) {
		return NextResponse.json(
			{ success: false, error: "관리자 인증이 필요합니다." },
			{ status: 401 },
		);
	}

	const db = await getDb();
	const pendingImages = await db
		.select({
			image: images,
			uploader: users,
		})
		.from(images)
		.leftJoin(users, eq(images.userId, users.id))
		.where(
			and(
				isNotNull(images.tokenId),
				eq(images.isApproved, false),
			),
		)
		.orderBy(desc(images.createdAt));

	return NextResponse.json({
		success: true,
		images: pendingImages.map(({ image, uploader }) => ({
			id: image.id,
			title: image.title ?? "",
			description: image.description ?? "",
			imageUrl: image.imageUrl,
			metadataUrl: image.metadataUrl,
			tokenId: image.tokenId,
			mintedAt: image.mintedAt?.toISOString() ?? null,
			uploader: {
				id: uploader?.id ?? "",
				address: uploader?.walletAddress ?? "",
				username: uploader?.username ?? null,
			},
		})),
	});
}
