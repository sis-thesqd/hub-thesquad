export type SupabaseFetchOptions = {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    body?: unknown;
    prefer?: string;
    headers?: Record<string, string>;
    /** Skip cache and always fetch fresh data */
    skipCache?: boolean;
};

type SupabaseConfig = {
    url: string;
    anonKey: string;
};

type CacheEntry<T> = {
    data: T;
    timestamp: number;
};

// Simple in-memory cache for GET requests
const cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL = 30 * 1000; // 30 seconds TTL
const pendingRequests = new Map<string, Promise<unknown>>();

const getSupabaseConfig = (): SupabaseConfig => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
        throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.");
    }

    return { url, anonKey };
};

/** Invalidate cache entries matching a table name pattern */
export const invalidateCache = (tablePattern?: string) => {
    if (!tablePattern) {
        cache.clear();
        return;
    }
    for (const key of cache.keys()) {
        if (key.includes(tablePattern)) {
            cache.delete(key);
        }
    }
};

export const supabaseFetch = async <T = unknown>(path: string, options: SupabaseFetchOptions = {}) => {
    const { url, anonKey } = getSupabaseConfig();
    const method = options.method ?? "GET";
    const isGet = method === "GET";
    const cacheKey = `${url}/rest/v1/${path}`;

    // For GET requests, check cache first
    if (isGet && !options.skipCache) {
        const cached = cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            return cached.data as T;
        }

        // Deduplicate in-flight requests
        const pending = pendingRequests.get(cacheKey);
        if (pending) {
            return pending as Promise<T>;
        }
    }

    const headers: Record<string, string> = {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        "Content-Type": "application/json",
        ...options.headers,
    };

    if (options.prefer) {
        headers.Prefer = options.prefer;
    }

    const fetchPromise = (async () => {
        const res = await fetch(`${url}/rest/v1/${path}`, {
            method,
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

        const data = (await res.json()) as T;

        // Cache GET responses
        if (isGet && !options.skipCache) {
            cache.set(cacheKey, { data, timestamp: Date.now() });
        }

        // Invalidate cache on mutations
        if (!isGet) {
            // Extract table name from path and invalidate related cache entries
            const tableName = path.split("?")[0];
            invalidateCache(tableName);
        }

        return data;
    })();

    // Track pending GET requests to deduplicate
    if (isGet && !options.skipCache) {
        pendingRequests.set(cacheKey, fetchPromise);
        fetchPromise.finally(() => pendingRequests.delete(cacheKey));
    }

    return fetchPromise;
};

export const supabaseUpsert = async <T = unknown>(path: string, body: unknown) => {
    return supabaseFetch<T>(path, {
        method: "POST",
        body,
        prefer: "return=representation,resolution=merge-duplicates",
    });
};
