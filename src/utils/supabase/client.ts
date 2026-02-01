"use client";

import { createBrowserClient } from "@supabase/ssr";

export const createClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // During static generation, env vars may not be available
    // Return a placeholder client that will be replaced at runtime
    if (!supabaseUrl || !supabaseAnonKey) {
        return createBrowserClient(
            "https://placeholder.supabase.co",
            "placeholder-key"
        );
    }

    return createBrowserClient(supabaseUrl, supabaseAnonKey);
};
