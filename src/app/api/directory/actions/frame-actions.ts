"use server";

import { createClient } from "@/utils/supabase/server";
import type { Frame } from "@/utils/supabase/types";
import { getAuthenticatedEmail, getWorkerId } from "./auth";
import { revalidateDirectory } from "./constants";

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
                name: data.name,
                iframe_url: data.iframe_url,
                description: data.description,
                department_ids: data.department_ids,
                created_by: workerId,
                updated_by: workerId,
            })
            .select()
            .single();

        if (error) {
            console.error("Failed to create frame:", error);
            return { success: false, error: error.message };
        }

        revalidateDirectory();
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

        revalidateDirectory();
        return { success: true };
    } catch (err) {
        console.error("Update frame error:", err);
        return { success: false, error: "An unexpected error occurred" };
    }
}
