import { NextResponse } from "next/server";
import { clearAdminSession } from "@/lib/admin-auth";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function POST() {
	const response = NextResponse.json({ success: true });
	clearAdminSession(response);
	return response;
}
