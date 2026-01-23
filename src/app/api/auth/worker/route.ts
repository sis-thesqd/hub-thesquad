import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// GET /api/auth/worker?email=xxx - Fetch worker by email
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get("email");

        if (!email) {
            return NextResponse.json(
                { error: "email is required" },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        const { data: worker, error } = await supabase
            .from("rippling_workers")
            .select("*")
            .or(`work_email.eq.${email},personal_email.eq.${email}`)
            .eq("status", "ACTIVE")
            .single();

        if (error) {
            // Not found is not an error for this endpoint
            if (error.code === "PGRST116") {
                return NextResponse.json({ worker: null });
            }
            console.error("Worker fetch error:", error);
            return NextResponse.json(
                { error: "Failed to fetch worker" },
                { status: 500 }
            );
        }

        return NextResponse.json({ worker });
    } catch (error) {
        console.error("Worker API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
