import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
	const authenticated = await isAdminRequest(request);
	return NextResponse.json({ authenticated });
}
