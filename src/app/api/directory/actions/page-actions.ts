"use server";

import { createClient } from "@/utils/supabase/server";
import type { DirectoryEntry, Frame } from "@/utils/supabase/types";
import { getAuthenticatedEmail, getWorkerId } from "./auth";
import { revalidateDirectory } from "./constants";

export async function createPage(data: {
    name: string;
    iframe_url: string;
    description: string | null;
    department_ids: string[];
    placements: Array<{
        department_id: string;
        parent_id: string | null;
        slug: string;
        emoji: string | null;
    }>;
}): Promise<{ success: boolean; frame?: Frame; entries?: DirectoryEntry[]; error?: string }> {
    try {
        const email = await getAuthenticatedEmail();
        if (!email) return { success: false, error: "Not authenticated" };

        const workerId = await getWorkerId(email);
        const supabase = await createClient();

        // Create the frame
        const { data: frame, error: frameError } = await supabase
            .from("sh_frames")
            .insert({
                name: data.name,
                iframe_url: data.iframe_url,
                description: data.description,
                department_ids: data.department_ids,
                created_by: workerId,
                updated_by: workerId,
            })
            .select()
            .single();

        if (frameError || !frame) {
            console.error("Failed to create frame:", frameError);
            return { success: false, error: frameError?.message ?? "Failed to create frame" };
        }

        // Create directory entries for each placement
        const directoryEntries = data.placements.map((placement) => ({
            department_id: placement.department_id,
            parent_id: placement.parent_id,
            frame_id: frame.id,
            name: data.name,
            slug: placement.slug,
            emoji: placement.emoji,
            type: "frame",
            created_by: workerId,
            updated_by: workerId,
        }));

        const { data: entries, error: entriesError } = await supabase
            .from("sh_directory")
            .insert(directoryEntries)
            .select();

        if (entriesError) {
            console.error("Failed to create directory entries:", entriesError);
            // Rollback: delete the frame
            await supabase.from("sh_frames").delete().eq("id", frame.id);
            return { success: false, error: entriesError.message };
        }

        revalidateDirectory();
        return { success: true, frame, entries: entries ?? [] };
    } catch (err) {
        console.error("Create page error:", err);
        return { success: false, error: "An unexpected error occurred" };
    }
}

export async function updatePage(
    frameId: string,
    data: {
        name?: string;
        iframe_url?: string;
        description?: string | null;
        department_ids?: string[];
    }
): Promise<{ success: boolean; error?: string }> {
    try {
        const email = await getAuthenticatedEmail();
        if (!email) return { success: false, error: "Not authenticated" };

        const workerId = await getWorkerId(email);
        const supabase = await createClient();

        const { error } = await supabase
            .from("sh_frames")
            .update({
                ...data,
                updated_by: workerId,
            })
            .eq("id", frameId);

        if (error) {
            console.error("Failed to update page:", error);
            return { success: false, error: error.message };
        }

        // Update directory entry names if name changed
        if (data.name) {
            await supabase
                .from("sh_directory")
                .update({ name: data.name, updated_by: workerId })
                .eq("frame_id", frameId);
        }

        revalidateDirectory();
        return { success: true };
    } catch (err) {
        console.error("Update page error:", err);
        return { success: false, error: "An unexpected error occurred" };
    }
}

export async function deletePage(frameId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const email = await getAuthenticatedEmail();
        if (!email) return { success: false, error: "Not authenticated" };

        const supabase = await createClient();

        // Delete all directory entries first
        const { error: entriesError } = await supabase
            .from("sh_directory")
            .delete()
            .eq("frame_id", frameId);

        if (entriesError) {
            console.error("Failed to delete directory entries:", entriesError);
            return { success: false, error: entriesError.message };
        }

        // Delete the frame
        const { error: frameError } = await supabase
            .from("sh_frames")
            .delete()
            .eq("id", frameId);

        if (frameError) {
            console.error("Failed to delete frame:", frameError);
            return { success: false, error: frameError.message };
        }

        revalidateDirectory();
        return { success: true };
    } catch (err) {
        console.error("Delete page error:", err);
        return { success: false, error: "An unexpected error occurred" };
    }
}

export async function updatePagePlacements(
    frameId: string,
    frameName: string,
    placements: Array<{
        department_id: string;
        parent_id: string | null;
        slug: string;
        emoji: string | null;
    }>
): Promise<{ success: boolean; error?: string }> {
    try {
        const email = await getAuthenticatedEmail();
        if (!email) return { success: false, error: "Not authenticated" };

        const workerId = await getWorkerId(email);
        const supabase = await createClient();

        // Get existing placements
        const { data: existing } = await supabase
            .from("sh_directory")
            .select("id, parent_id")
            .eq("frame_id", frameId);

        const existingParentIds = new Set(existing?.map((e) => e.parent_id) ?? []);
        const newParentIds = new Set(placements.map((p) => p.parent_id));

        // Find placements to remove
        const toRemove = existing?.filter((e) => !newParentIds.has(e.parent_id)) ?? [];

        // Find placements to add
        const toAdd = placements.filter((p) => !existingParentIds.has(p.parent_id));

        // Remove old placements
        if (toRemove.length > 0) {
            const ids = toRemove.map((e) => e.id);
            await supabase
                .from("sh_directory")
                .delete()
                .in("id", ids);
        }

        // Add new placements
        if (toAdd.length > 0) {
            const entries = toAdd.map((p) => ({
                department_id: p.department_id,
                parent_id: p.parent_id,
                frame_id: frameId,
                name: frameName,
                slug: p.slug,
                emoji: p.emoji,
                type: "frame",
                created_by: workerId,
                updated_by: workerId,
            }));

            await supabase.from("sh_directory").insert(entries);
        }

        revalidateDirectory();
        return { success: true };
    } catch (err) {
        console.error("Update placements error:", err);
        return { success: false, error: "An unexpected error occurred" };
    }
}
