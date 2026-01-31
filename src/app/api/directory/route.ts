import { NextResponse } from "next/server";
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

const getDirectoryData = unstable_cache(async () => {
    const supabase = createCacheClient();

    const [
        { data: departments, error: deptError },
        { data: entries, error: entriesError },
        { data: frames, error: framesError },
        { data: navigationPagesConfig, error: navError },
        { data: divisionOrderConfig, error: divisionOrderError },
    ] = await Promise.all([
        supabase
            .from("rippling_departments")
            .select("id,name")
            .order("name", { ascending: true }),
        supabase
            .from("sh_directory")
            .select("id,department_id,parent_id,frame_id,name,slug,sort_order,emoji")
            .order("name", { ascending: true }),
        supabase
            .from("sh_frames")
            .select("id,name,description,iframe_url,department_ids,created_at")
            .order("name", { ascending: true }),
        supabase
            .from("sh_config")
            .select("value")
            .eq("key", "navigation_pages")
            .single(),
        supabase
            .from("sh_config")
            .select("value")
            .eq("key", "division_order")
            .single(),
    ]);

    if (deptError || entriesError || framesError || navError || divisionOrderError) {
        console.error("Directory fetch errors:", { deptError, entriesError, framesError, navError, divisionOrderError });
        throw new Error("Failed to fetch directory data");
    }

    return {
        departments: departments ?? [],
        entries: entries ?? [],
        frames: frames ?? [],
        navigationPages: navigationPagesConfig?.value ?? [],
        divisionOrder: divisionOrderConfig?.value ?? [],
    };
}, ["directory"], { revalidate: 60, tags: ["directory"] });

// GET /api/directory - Fetch all directory data in one request
export async function GET() {
    try {
        const data = await getDirectoryData();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Directory API error:", error);
    }

    try {
        const supabase = await createClient();

        const [
            { data: departments, error: deptError },
            { data: entries, error: entriesError },
            { data: frames, error: framesError },
            { data: navigationPagesConfig, error: navError },
            { data: divisionOrderConfig, error: divisionOrderError },
        ] = await Promise.all([
            supabase
                .from("rippling_departments")
                .select("id,name")
                .order("name", { ascending: true }),
            supabase
                .from("sh_directory")
                .select("id,department_id,parent_id,frame_id,name,slug,sort_order,emoji")
                .order("name", { ascending: true }),
            supabase
                .from("sh_frames")
                .select("id,name,description,iframe_url,department_ids,created_at")
                .order("name", { ascending: true }),
            supabase
                .from("sh_config")
                .select("value")
                .eq("key", "navigation_pages")
                .single(),
            supabase
                .from("sh_config")
                .select("value")
                .eq("key", "division_order")
                .single(),
        ]);

        if (deptError || entriesError || framesError || navError || divisionOrderError) {
            console.error("Directory fetch errors:", { deptError, entriesError, framesError, navError, divisionOrderError });
            return NextResponse.json(
                { error: "Failed to fetch directory data" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            departments: departments ?? [],
            entries: entries ?? [],
            frames: frames ?? [],
            navigationPages: navigationPagesConfig?.value ?? [],
            divisionOrder: divisionOrderConfig?.value ?? [],
        });
    } catch (error) {
        console.error("Directory API fallback error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
