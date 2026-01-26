"use server";

import { headers } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import type { DirectoryEntry, Frame } from "@/utils/supabase/types";

// Check if running on localhost
async function isLocalhost(): Promise<boolean> {
    const headersList = await headers();
    const host = headersList.get("host") || "";
    return host.startsWith("localhost") || host.startsWith("127.0.0.1");
}

const DEV_EMAIL = process.env.DEV_EMAIL || "jacob@churchmediasquad.com";

// Get authenticated user email
async function getAuthenticatedEmail(): Promise<string | null> {
    const supabase = await createClient();
    const localhost = await isLocalhost();

    if (localhost) {
        return DEV_EMAIL;
    }

    const { data: { user } } = await supabase.auth.getUser();
    return user?.email ?? null;
}

// Get worker ID from email
async function getWorkerId(email: string): Promise<string | null> {
    const supabase = await createClient();
    const { data: worker } = await supabase
        .from("rippling_workers")
        .select("id")
        .or(`work_email.eq.${email},personal_email.eq.${email}`)
        .eq("status", "ACTIVE")
        .single();

    return worker?.id ?? null;
}

// ============ FOLDER OPERATIONS ============

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

        return { success: true };
    } catch (err) {
        console.error("Delete entry error:", err);
        return { success: false, error: "An unexpected error occurred" };
    }
}

// ============ PAGE/FRAME OPERATIONS ============

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
}): Promise<{ success: boolean; frameId?: string; error?: string }> {
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

        const { error: entriesError } = await supabase
            .from("sh_directory")
            .insert(directoryEntries);

        if (entriesError) {
            console.error("Failed to create directory entries:", entriesError);
            // Rollback: delete the frame
            await supabase.from("sh_frames").delete().eq("id", frame.id);
            return { success: false, error: entriesError.message };
        }

        return { success: true, frameId: frame.id };
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

        return { success: true };
    } catch (err) {
        console.error("Update placements error:", err);
        return { success: false, error: "An unexpected error occurred" };
    }
}

// ============ FAVORITES OPERATIONS ============

export async function toggleFavorite(
    userId: string,
    entryId?: string,
    departmentId?: string
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
        } else {
            return { success: false, error: "Must provide entryId or departmentId" };
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

// ============ DIRECTORY ENTRY OPERATIONS ============

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

        return { success: true };
    } catch (err) {
        console.error("Delete directory entries error:", err);
        return { success: false, error: "An unexpected error occurred" };
    }
}

export async function getPagePlacements(
    frameId: string
): Promise<{ success: boolean; data?: { id: string; parent_id: string | null }[]; error?: string }> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from("sh_directory")
            .select("id,parent_id")
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

        return { success: true };
    } catch (err) {
        console.error("Update directory entries error:", err);
        return { success: false, error: "An unexpected error occurred" };
    }
}

export async function createFrame(data: {
    name: string;
    iframe_url: string;
    description: string | null;
    department_ids: string[];
}): Promise<{ success: boolean; data?: Frame; error?: string }> {
    try {
        const email = await getAuthenticatedEmail();
        if (!email) return { success: false, error: "Not authenticated" };

        const workerId = await getWorkerId(email);
        const supabase = await createClient();

        const { data: result, error } = await supabase
            .from("sh_frames")
            .insert({
                ...data,
                created_by: workerId,
                updated_by: workerId,
            })
            .select()
            .single();

        if (error) {
            console.error("Failed to create frame:", error);
            return { success: false, error: error.message };
        }

        return { success: true, data: result };
    } catch (err) {
        console.error("Create frame error:", err);
        return { success: false, error: "An unexpected error occurred" };
    }
}

export async function updateFrame(
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
            console.error("Failed to update frame:", error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (err) {
        console.error("Update frame error:", err);
        return { success: false, error: "An unexpected error occurred" };
    }
}
