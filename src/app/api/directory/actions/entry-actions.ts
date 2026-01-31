"use server";

import { createClient } from "@/utils/supabase/server";
import type { DirectoryEntry } from "@/utils/supabase/types";
import { getAuthenticatedEmail, getWorkerId } from "./auth";
import { revalidateDirectory } from "./constants";

export async function updateDirectoryEntry(
    id: string,
    data: {
        name?: string;
        slug?: string;
        emoji?: string | null;
        parent_id?: string | null;
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
            console.error("Failed to update directory entry:", error);
            return { success: false, error: error.message };
        }

        revalidateDirectory();
        return { success: true };
    } catch (err) {
        console.error("Update directory entry error:", err);
        return { success: false, error: "An unexpected error occurred" };
    }
}

export async function deleteDirectoryEntries(
    ids: string[]
): Promise<{ success: boolean; error?: string }> {
    try {
        const email = await getAuthenticatedEmail();
        if (!email) return { success: false, error: "Not authenticated" };

        const supabase = await createClient();

        const { error } = await supabase
            .from("sh_directory")
            .delete()
            .in("id", ids);

        if (error) {
            console.error("Failed to delete directory entries:", error);
            return { success: false, error: error.message };
        }

        revalidateDirectory();
        return { success: true };
    } catch (err) {
        console.error("Delete directory entries error:", err);
        return { success: false, error: "An unexpected error occurred" };
    }
}

export async function getPagePlacements(
    frameId: string
): Promise<{ success: boolean; data?: { id: string; parent_id: string | null; department_id: string }[]; error?: string }> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from("sh_directory")
            .select("id,parent_id,department_id")
            .eq("frame_id", frameId);

        if (error) {
            console.error("Failed to get page placements:", error);
            return { success: false, error: error.message };
        }

        return { success: true, data: data ?? [] };
    } catch (err) {
        console.error("Get page placements error:", err);
        return { success: false, error: "An unexpected error occurred" };
    }
}

export async function getExistingSlugs(
    parentIds: string[]
): Promise<{ success: boolean; data?: { parent_id: string; slug: string }[]; error?: string }> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from("sh_directory")
            .select("parent_id,slug")
            .in("parent_id", parentIds);

        if (error) {
            console.error("Failed to get existing slugs:", error);
            return { success: false, error: error.message };
        }

        return { success: true, data: data ?? [] };
    } catch (err) {
        console.error("Get existing slugs error:", err);
        return { success: false, error: "An unexpected error occurred" };
    }
}

export async function createDirectoryEntries(
    entries: Array<{
        department_id: string;
        parent_id: string | null;
        frame_id: string | null;
        name: string;
        slug: string;
        emoji: string | null;
        type: "folder" | "frame";
    }>
): Promise<{ success: boolean; data?: DirectoryEntry[]; error?: string }> {
    try {
        const email = await getAuthenticatedEmail();
        if (!email) return { success: false, error: "Not authenticated" };

        const workerId = await getWorkerId(email);
        const supabase = await createClient();

        const entriesWithMeta = entries.map((entry) => ({
            ...entry,
            created_by: workerId,
            updated_by: workerId,
        }));

        const { data, error } = await supabase
            .from("sh_directory")
            .insert(entriesWithMeta)
            .select();

        if (error) {
            console.error("Failed to create directory entries:", error);
            return { success: false, error: error.message };
        }

        revalidateDirectory();
        return { success: true, data: data ?? [] };
    } catch (err) {
        console.error("Create directory entries error:", err);
        return { success: false, error: "An unexpected error occurred" };
    }
}

export async function updateDirectoryEntriesByFrameId(
    frameId: string,
    data: {
        name?: string;
        slug?: string;
        emoji?: string | null;
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
            .eq("frame_id", frameId);

        if (error) {
            console.error("Failed to update directory entries:", error);
            return { success: false, error: error.message };
        }

        revalidateDirectory();
        return { success: true };
    } catch (err) {
        console.error("Update directory entries error:", err);
        return { success: false, error: "An unexpected error occurred" };
    }
}
