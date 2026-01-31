"use server";

import { createClient } from "@/utils/supabase/server";
import type { DirectoryEntry } from "@/utils/supabase/types";
import { getAuthenticatedEmail, getWorkerId } from "./auth";
import { revalidateDirectory } from "./constants";

export async function createFolder(data: {
    department_id: string;
    parent_id: string | null;
    name: string;
    slug: string;
    emoji: string | null;
}): Promise<{ success: boolean; data?: DirectoryEntry; error?: string }> {
    try {
        const email = await getAuthenticatedEmail();
        if (!email) return { success: false, error: "Not authenticated" };

        const workerId = await getWorkerId(email);
        const supabase = await createClient();

        const { data: result, error } = await supabase
            .from("sh_directory")
            .insert({
                department_id: data.department_id,
                parent_id: data.parent_id,
                name: data.name,
                slug: data.slug,
                emoji: data.emoji,
                type: "folder",
                created_by: workerId,
                updated_by: workerId,
            })
            .select()
            .single();

        if (error) {
            console.error("Failed to create folder:", error);
            return { success: false, error: error.message };
        }

        revalidateDirectory();
        return { success: true, data: result };
    } catch (err) {
        console.error("Create folder error:", err);
        return { success: false, error: "An unexpected error occurred" };
    }
}

export async function updateFolder(
    id: string,
    data: {
        name?: string;
        slug?: string;
        emoji?: string | null;
        parent_id?: string | null;
        sort_order?: number | null;
    }
): Promise<{ success: boolean; error?: string }> {
    try {
        const email = await getAuthenticatedEmail();
        if (!email) return { success: false, error: "Not authenticated" };

        const workerId = await getWorkerId(email);
        const supabase = await createClient();

        const { error } = await supabase
            .from("sh_directory")
            .update({
                ...data,
                updated_by: workerId,
            })
            .eq("id", id);

        if (error) {
            console.error("Failed to update folder:", error);
            return { success: false, error: error.message };
        }

        revalidateDirectory();
        return { success: true };
    } catch (err) {
        console.error("Update folder error:", err);
        return { success: false, error: "An unexpected error occurred" };
    }
}

export async function deleteEntry(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        const email = await getAuthenticatedEmail();
        if (!email) return { success: false, error: "Not authenticated" };

        const supabase = await createClient();

        const { error } = await supabase
            .from("sh_directory")
            .delete()
            .eq("id", id);

        if (error) {
            console.error("Failed to delete entry:", error);
            return { success: false, error: error.message };
        }

        revalidateDirectory();
        return { success: true };
    } catch (err) {
        console.error("Delete entry error:", err);
        return { success: false, error: "An unexpected error occurred" };
    }
}
