import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

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
        console.error("Children API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
