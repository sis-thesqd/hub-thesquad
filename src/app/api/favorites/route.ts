import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// GET /api/favorites?userId=xxx - Fetch user's favorites
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");

        if (!userId) {
            return NextResponse.json(
                { error: "userId is required" },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        const { data: favorites, error } = await supabase
            .from("sh_favorites")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Favorites fetch error:", error);
            return NextResponse.json(
                { error: "Failed to fetch favorites" },
                { status: 500 }
            );
        }

        return NextResponse.json({ favorites: favorites ?? [] });
    } catch (error) {
        console.error("Favorites API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
