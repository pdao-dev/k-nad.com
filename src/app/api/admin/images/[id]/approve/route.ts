import { NextRequest, NextResponse } from "next/server";
import { eq, isNotNull } from "drizzle-orm";
import { z } from "zod";
import { getDb, images } from "@/db";
import { isAdminRequest } from "@/lib/admin-auth";
import handleApiError from "@/lib/api-error";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const paramsSchema = z.object({
	id: z.string().uuid(),
});

export async function POST(
	request: NextRequest,
	{ params }: { params: { id: string } },
) {
	try {
		if (!(await isAdminRequest(request))) {
			return NextResponse.json(
				{ success: false, error: "관리자 인증이 필요합니다." },
				{ status: 401 },
			);
		}

		const { id } = paramsSchema.parse(params);
		const db = await getDb();

		const [existing] = await db
			.select({
				id: images.id,
				isApproved: images.isApproved,
				tokenId: images.tokenId,
			})
			.from(images)
			.where(eq(images.id, id))
			.limit(1);

		if (!existing) {
			return NextResponse.json(
				{ success: false, error: "이미지를 찾을 수 없습니다." },
				{ status: 404 },
			);
		}

		if (!existing.tokenId) {
			return NextResponse.json(
				{ success: false, error: "아직 민팅되지 않은 이미지입니다." },
				{ status: 400 },
			);
		}

		if (existing.isApproved) {
			return NextResponse.json({ success: true, message: "이미 승인되었습니다." });
		}

		await db
			.update(images)
			.set({
				isApproved: true,
				approvedAt: new Date(),
				updatedAt: new Date(),
			})
			.where(eq(images.id, id));

		return NextResponse.json({ success: true });
	} catch (error) {
		return handleApiError(error);
	}
}
