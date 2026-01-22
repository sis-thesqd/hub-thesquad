import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/";

    if (!code) {
        return NextResponse.redirect(`${origin}/login?error=No+code+provided`);
    }

    const cookieStore = await cookies();
    
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            cookieStore.set(name, value, options);
                        });
                    } catch (error) {
                        console.error("Error setting cookies:", error);
                    }
                },
            },
        }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
        console.error("Code exchange error:", error);
        return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
    }

    console.log("Session created:", {
        hasSession: !!data.session,
        hasUser: !!data.user,
        email: data.user?.email,
    });

    // Validate user against rippling_workers
    if (data.user?.email) {
        console.log("Validating user email:", data.user.email);

        const { data: worker, error: workerError } = await supabase
            .from("rippling_workers")
            .select("id, work_email, personal_email, status, display_name")
            .or(`work_email.eq.${data.user.email},personal_email.eq.${data.user.email}`)
            .eq("status", "ACTIVE")
            .single();

        console.log("Worker lookup result:", { worker, workerError });

        if (workerError || !worker) {
            console.error("Authorization failed for email:", data.user.email);
            await supabase.auth.signOut();
            return NextResponse.redirect(
                `${origin}/login?error=${encodeURIComponent("You are not authorized. Email: " + data.user.email)}`
            );
        }

        console.log("User authorized successfully:", worker.display_name);
    }

    return NextResponse.redirect(`${origin}${next}`);
}
