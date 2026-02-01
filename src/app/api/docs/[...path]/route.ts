import { NextResponse } from "next/server";
import { getFileContent } from "@/utils/wiki/github";

export async function GET(
    request: Request,
    { params }: { params?: { path?: string[] } },
) {
    try {
        const filePath =
            params?.path?.join("/") ??
            decodeURIComponent(new URL(request.url).pathname.replace(/^\/api\/docs\//, ""));
        const file = await getFileContent(filePath);
        return NextResponse.json(file, {
            headers: {
                "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
            },
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to fetch file content";
        const status = typeof message === "string" && message.includes("GitHub API error (404)") ? 404 : 500;
        console.error("Error in /api/docs/[...path]:", error);
        return NextResponse.json(
            { error: "Failed to fetch file content", details: message },
            { status },
        );
    }
}
