import { NextResponse } from "next/server";
import { getAllMarkdownFiles, getFileContent, searchFiles } from "@/utils/wiki/github";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get("q")?.trim();

        if (!query) {
            return NextResponse.json({ results: [] });
        }

        const fileResults = await searchFiles(query);
        const allFiles = await getAllMarkdownFiles();
        const contentResults: Array<{
            name: string;
            path: string;
            type: "file" | "dir";
        }> = [];

        for (const file of allFiles) {
            try {
                const { content } = await getFileContent(file.path);
                const lowerContent = content.toLowerCase();
                const queryIndex = lowerContent.indexOf(query.toLowerCase());
                if (queryIndex !== -1) {
                    contentResults.push({
                        ...file,
                        type: "file",
                    });
                }
            } catch (error) {
                console.error(`Could not read file ${file.path}:`, error);
            }
        }

        const results = [
            ...fileResults.map((file) => ({ ...file, type: "file" as const })),
            ...contentResults,
        ];

        return NextResponse.json({ results }, {
            headers: {
                "Cache-Control": "private, no-store",
            },
        });
    } catch (error) {
        console.error("Error in /api/search:", error);
        return NextResponse.json({ error: "Search failed" }, { status: 500 });
    }
}
