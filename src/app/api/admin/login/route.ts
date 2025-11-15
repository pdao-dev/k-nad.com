import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import handleApiError from "@/lib/api-error";
import {
	createAdminSession,
	validateAdminCredentials,
} from "@/lib/admin-auth";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const loginSchema = z.object({
	username: z.string().min(1, "아이디를 입력해주세요."),
	password: z.string().min(1, "비밀번호를 입력해주세요."),
});

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { username, password } = loginSchema.parse(body);

		const isValid = await validateAdminCredentials(username, password);
		if (!isValid) {
			return NextResponse.json(
				{ success: false, error: "아이디 또는 비밀번호가 올바르지 않습니다." },
				{ status: 401 },
			);
		}

		const response = NextResponse.json({ success: true });
		await createAdminSession(response);
		return response;
	} catch (error) {
		return handleApiError(error);
	}
}
