import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@/utils/supabase/server";

const createCacheClient = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) {
        throw new Error("Missing Supabase env vars.");
    }

    return createServerClient(url, anonKey, {
        cookies: {
            getAll() {
                return [];
            },
            setAll() {
                // No-op: cache client is intentionally cookie-less.
            },
        },
    });
};

const getChildren = unstable_cache(async (departmentId: string) => {
    const supabase = createCacheClient();

    const { data: entries, error } = await supabase
        .from("sh_directory")
        .select("id,department_id,parent_id,frame_id,name,slug,sort_order,emoji")
        .eq("department_id", departmentId)
        .order("sort_order", { ascending: true, nullsFirst: false })
        .order("name", { ascending: true });

    if (error) {
        console.error("Children fetch error:", error);
        throw new Error("Failed to fetch directory children");
    }

    return { entries: entries ?? [] };
}, ["directory-children"], { revalidate: 60, tags: ["directory"] });

// GET /api/directory/children?departmentId=xxx - Fetch department's directory entries
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const departmentId = searchParams.get("departmentId");

        if (!departmentId) {
            return NextResponse.json(
                { error: "departmentId is required" },
                { status: 400 }
            );
        }

        const data = await getChildren(departmentId);
        return NextResponse.json(data);
    } catch (error) {
        console.error("Children API error:", error);
    }

    try {
        const { searchParams } = new URL(request.url);
        const departmentId = searchParams.get("departmentId");

        if (!departmentId) {
            return NextResponse.json(
                { error: "departmentId is required" },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        const { data: entries, error } = await supabase
            .from("sh_directory")
            .select("id,department_id,parent_id,frame_id,name,slug,sort_order,emoji")
            .eq("department_id", departmentId)
            .order("sort_order", { ascending: true, nullsFirst: false })
            .order("name", { ascending: true });

        if (error) {
            console.error("Children fetch error:", error);
            return NextResponse.json(
                { error: "Failed to fetch directory children" },
                { status: 500 }
            );
        }

        return NextResponse.json({ entries: entries ?? [] });
    } catch (error) {
        console.error("Children API fallback error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
