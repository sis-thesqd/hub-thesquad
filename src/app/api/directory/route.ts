import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// GET /api/directory - Fetch all directory data in one request
export async function GET() {
    try {
        const supabase = await createClient();

        const [
            { data: departments, error: deptError },
            { data: entries, error: entriesError },
            { data: frames, error: framesError },
            { data: navigationPagesConfig, error: navError },
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
        ]);

        if (deptError || entriesError || framesError || navError) {
            console.error("Directory fetch errors:", { deptError, entriesError, framesError, navError });
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
        });
    } catch (error) {
        console.error("Directory API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
