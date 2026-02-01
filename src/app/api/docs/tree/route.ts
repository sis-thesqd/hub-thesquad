import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { getRepoTree } from "@/utils/wiki/github";

const getCachedTree = unstable_cache(async () => getRepoTree(), ["wiki-docs-tree"], {
    revalidate: 60,
});

export async function GET() {
    try {
        const tree = await getCachedTree();
        return NextResponse.json(tree, {
            headers: {
                "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
            },
        });
    } catch (error) {
        console.error("Error in /api/docs/tree:", error);
        return NextResponse.json(
            { error: "Failed to fetch documentation tree" },
            { status: 500 },
        );
    }
}
