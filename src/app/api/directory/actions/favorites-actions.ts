"use server";

import { createClient } from "@/utils/supabase/server";
import { getAuthenticatedEmail } from "./auth";

export async function toggleFavorite(
    userId: string,
    entryId?: string,
    departmentId?: string,
    articlePath?: string
): Promise<{ success: boolean; isFavorite?: boolean; error?: string }> {
    try {
        const email = await getAuthenticatedEmail();
        if (!email) return { success: false, error: "Not authenticated" };

        const supabase = await createClient();

        // Check if favorite exists
        let query = supabase
            .from("sh_favorites")
            .select("id")
            .eq("user_id", userId);

        if (entryId) {
            query = query.eq("entry_id", entryId);
        } else if (departmentId) {
            query = query.eq("department_id", departmentId);
        } else if (articlePath) {
            query = query.eq("article_path", articlePath);
        } else {
            return { success: false, error: "Must provide entryId, departmentId, or articlePath" };
        }

        const { data: existing } = await query.maybeSingle();

        if (existing) {
            // Remove favorite
            const { error } = await supabase
                .from("sh_favorites")
                .delete()
                .eq("id", existing.id);

            if (error) {
                return { success: false, error: error.message };
            }
            return { success: true, isFavorite: false };
        } else {
            // Add favorite
            const { error } = await supabase
                .from("sh_favorites")
                .insert({
                    user_id: userId,
                    entry_id: entryId ?? null,
                    department_id: departmentId ?? null,
                    article_path: articlePath ?? null,
                });

            if (error) {
                return { success: false, error: error.message };
            }
            return { success: true, isFavorite: true };
        }
    } catch (err) {
        console.error("Toggle favorite error:", err);
        return { success: false, error: "An unexpected error occurred" };
    }
}
