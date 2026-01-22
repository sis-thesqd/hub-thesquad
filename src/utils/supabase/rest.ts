export type SupabaseFetchOptions = {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    body?: unknown;
    prefer?: string;
    headers?: Record<string, string>;
};

type SupabaseConfig = {
    url: string;
    anonKey: string;
};

const getSupabaseConfig = (): SupabaseConfig => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
        throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.");
    }

    return { url, anonKey };
};

export const supabaseFetch = async <T = unknown>(path: string, options: SupabaseFetchOptions = {}) => {
    const { url, anonKey } = getSupabaseConfig();
    const headers: Record<string, string> = {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        "Content-Type": "application/json",
        ...options.headers,
    };

    if (options.prefer) {
        headers.Prefer = options.prefer;
    }

    const res = await fetch(`${url}/rest/v1/${path}`, {
        method: options.method ?? "GET",
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        cache: "no-store",
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Supabase request failed: ${res.status}`);
    }

    if (res.status === 204) {
        return null as T;
    }

    return (await res.json()) as T;
};

export const supabaseUpsert = async <T = unknown>(path: string, body: unknown) => {
    return supabaseFetch<T>(path, {
        method: "POST",
        body,
        prefer: "return=representation,resolution=merge-duplicates",
    });
};
