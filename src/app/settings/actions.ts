"use server";

import { headers } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import type { NavigationPage } from "@/utils/supabase/types";

const SIS_DEPARTMENT_ID = process.env.SIS_DEPARTMENT_ID || "6932e7d2edd1d2e954e4264d"; // Systems Integration Squad
const DEV_EMAIL = process.env.DEV_EMAIL || "jacob@churchmediasquad.com";

// Check if running on localhost
async function isLocalhost(): Promise<boolean> {
    const headersList = await headers();
    const host = headersList.get("host") || "";
    return host.startsWith("localhost") || host.startsWith("127.0.0.1");
}

export async function updateNavigationPages(pages: NavigationPage[]): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createClient();
        const localhost = await isLocalhost();

        let userEmail: string | null = null;

        if (localhost) {
            // On localhost, use dev email
            userEmail = DEV_EMAIL;
        } else {
            // Get the current user from session
            const { data: { user }, error: userError } = await supabase.auth.getUser();

            if (userError || !user?.email) {
                return { success: false, error: "Not authenticated" };
            }
            userEmail = user.email;
        }

        // Check if user is admin by looking up their worker record
        const { data: worker, error: workerError } = await supabase
            .from("rippling_workers")
            .select("department_id, title")
            .or(`work_email.eq.${userEmail},personal_email.eq.${userEmail}`)
            .eq("status", "ACTIVE")
            .single();

        if (workerError || !worker) {
            return { success: false, error: "Worker not found" };
        }

        // Check admin status
        const isAdmin = worker.department_id === SIS_DEPARTMENT_ID ||
                       (worker.title?.toLowerCase().includes("systems") ?? false);

        if (!isAdmin) {
            return { success: false, error: "Not authorized" };
        }

        // Perform the update
        const { error: updateError } = await supabase
            .from("sh_config")
            .update({
                value: pages,
                updated_at: new Date().toISOString()
            })
            .eq("key", "navigation_pages");

        if (updateError) {
            console.error("Failed to update navigation pages:", updateError);
            return { success: false, error: updateError.message };
        }

        return { success: true };
    } catch (err) {
        console.error("Server action error:", err);
        return { success: false, error: "An unexpected error occurred" };
    }
}

export async function updateDivisionOrder(divisionOrder: string[]): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createClient();
        const localhost = await isLocalhost();

        let userEmail: string | null = null;

        if (localhost) {
            userEmail = DEV_EMAIL;
        } else {
            const { data: { user }, error: userError } = await supabase.auth.getUser();

            if (userError || !user?.email) {
                return { success: false, error: "Not authenticated" };
            }
            userEmail = user.email;
        }

        // Check if user is admin
        const { data: worker, error: workerError } = await supabase
            .from("rippling_workers")
            .select("department_id, title")
            .or(`work_email.eq.${userEmail},personal_email.eq.${userEmail}`)
            .eq("status", "ACTIVE")
            .single();

        if (workerError || !worker) {
            return { success: false, error: "Worker not found" };
        }

        const isAdmin = worker.department_id === SIS_DEPARTMENT_ID ||
                       (worker.title?.toLowerCase().includes("systems") ?? false);

        if (!isAdmin) {
            return { success: false, error: "Not authorized" };
        }

        // Update division_order config
        const { error: updateError } = await supabase
            .from("sh_config")
            .update({
                value: divisionOrder,
                updated_at: new Date().toISOString()
            })
            .eq("key", "division_order");

        if (updateError) {
            console.error("Failed to update division order:", updateError);
            return { success: false, error: updateError.message };
        }

        return { success: true };
    } catch (err) {
        console.error("Server action error:", err);
        return { success: false, error: "An unexpected error occurred" };
    }
}
