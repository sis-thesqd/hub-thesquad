import { NextResponse } from "next/server";
import { getFileContent } from "@/utils/wiki/github";

export async function GET(
    _request: Request,
    { params }: { params: { path: string[] } },
) {
    try {
        const filePath = params.path.join("/");
        const file = await getFileContent(filePath);
        return NextResponse.json(file, {
            headers: {
                "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
            },
        });
    } catch (error) {
        console.error("Error in /api/docs/[...path]:", error);
        return NextResponse.json(
            { error: "Failed to fetch file content" },
            { status: 500 },
        );
    }
}
