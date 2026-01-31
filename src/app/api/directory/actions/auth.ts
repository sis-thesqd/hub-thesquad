"use server";

import { headers } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { DEV_EMAIL } from "./constants";

export async function isLocalhost(): Promise<boolean> {
    const headersList = await headers();
    const host = headersList.get("host") || "";
    return host.startsWith("localhost") || host.startsWith("127.0.0.1");
}

export async function getAuthenticatedEmail(): Promise<string | null> {
    const supabase = await createClient();
    const localhost = await isLocalhost();

    if (localhost) {
        return DEV_EMAIL;
    }

    const { data: { user } } = await supabase.auth.getUser();
    return user?.email ?? null;
}

export async function getWorkerId(email: string): Promise<string | null> {
    const supabase = await createClient();
    const { data: worker } = await supabase
        .from("rippling_workers")
        .select("id")
        .or(`work_email.eq.${email},personal_email.eq.${email}`)
        .eq("status", "ACTIVE")
        .single();

    return worker?.id ?? null;
}
