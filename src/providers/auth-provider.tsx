"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
    useRef,
    type ReactNode,
} from "react";
import type { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";

export interface RipplingWorker {
    id: string;
    created_at: string | null;
    updated_at: string | null;
    user_id: string | null;
    display_name: string | null;
    given_name: string | null;
    family_name: string | null;
    middle_name: string | null;
    preferred_given_name: string | null;
    preferred_family_name: string | null;
    work_email: string | null;
    personal_email: string | null;
    phone_numbers: Record<string, unknown> | null;
    title: string | null;
    title_effective_date: string | null;
    status: string | null;
    start_date: string | null;
    end_date: string | null;
    number: number | null;
    is_manager: boolean | null;
    manager_id: string | null;
    department_id: string | null;
    level_id: string | null;
    teams_ids: string[] | null;
    country: string | null;
    location_type: string | null;
    work_location_id: string | null;
    employment_type_id: string | null;
    overtime_exemption: string | null;
    gender: string | null;
    date_of_birth: string | null;
    compensation_id: string | null;
    legal_entity_id: string | null;
    termination_details: Record<string, unknown> | null;
    synced_at: string | null;
}

interface AuthContextType {
    user: User | null;
    session: Session | null;
    worker: RipplingWorker | null;
    isLoading: boolean;
    error: string | null;
    signOut: () => Promise<void>;
    refreshWorker: () => Promise<void>;
    /** The primary email to use for the logged in user (work_email preferred) */
    userEmail: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

// Dev mode email for localhost bypass
const DEV_EMAIL = "jacob@churchmediasquad.com";

// Check if running on localhost
const isLocalhost = () => {
    if (typeof window === "undefined") return false;
    const hostname = window.location.hostname;
    return hostname === "localhost" || hostname === "127.0.0.1";
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [worker, setWorker] = useState<RipplingWorker | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const supabase = createClient();
    const fetchingRef = useRef(false);

    const fetchWorker = async (email: string): Promise<RipplingWorker | null> => {
        // Prevent duplicate fetches
        if (fetchingRef.current) return null;
        fetchingRef.current = true;

        try {
            const response = await fetch(`/api/auth/worker?email=${encodeURIComponent(email)}`);
            if (!response.ok) {
                console.error("Error fetching worker:", response.statusText);
                return null;
            }
            const data = await response.json();
            return data.worker;
        } catch (error) {
            console.error("Error fetching worker:", error);
            return null;
        } finally {
            fetchingRef.current = false;
        }
    };

    const refreshWorker = async () => {
        const email = isLocalhost() ? DEV_EMAIL : user?.email;
        if (!email) return;
        const workerData = await fetchWorker(email);
        setWorker(workerData);
    };

    const signOut = async () => {
        // Don't actually sign out on localhost
        if (isLocalhost()) {
            return;
        }
        setIsLoading(true);
        const { error } = await supabase.auth.signOut();
        if (error) {
            setError(error.message);
        }
        setUser(null);
        setSession(null);
        setWorker(null);
        setIsLoading(false);
    };

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                // Localhost bypass - auto-login as dev user
                if (isLocalhost()) {
                    const workerData = await fetchWorker(DEV_EMAIL);
                    if (workerData) {
                        // Create a mock user for localhost
                        const mockUser = {
                            id: workerData.id,
                            email: DEV_EMAIL,
                            app_metadata: {},
                            user_metadata: {},
                            aud: "authenticated",
                            created_at: new Date().toISOString(),
                        } as User;

                        setUser(mockUser);
                        setWorker(workerData);
                        setSession({ user: mockUser } as Session);
                    }
                    setIsLoading(false);
                    return;
                }

                const {
                    data: { session },
                } = await supabase.auth.getSession();

                if (session?.user) {
                    setSession(session);
                    setUser(session.user);

                    // Fetch worker data
                    if (session.user.email) {
                        const workerData = await fetchWorker(session.user.email);
                        if (!workerData) {
                            // User is not authorized, sign them out
                            await supabase.auth.signOut();
                            setError(
                                "You are not authorized to access this application."
                            );
                            setUser(null);
                            setSession(null);
                        } else {
                            setWorker(workerData);
                        }
                    }
                }
            } catch (err) {
                console.error("Auth initialization error:", err);
                setError("Failed to initialize authentication");
            } finally {
                setIsLoading(false);
            }
        };

        initializeAuth();

        // Skip auth listener on localhost
        if (isLocalhost()) {
            return;
        }

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            setSession(session);
            setUser(session?.user ?? null);

            if (event === "SIGNED_IN" && session?.user?.email) {
                const workerData = await fetchWorker(session.user.email);
                if (!workerData) {
                    await supabase.auth.signOut();
                    setError(
                        "You are not authorized to access this application."
                    );
                    setUser(null);
                    setSession(null);
                    setWorker(null);
                } else {
                    setWorker(workerData);
                    setError(null);
                }
            } else if (event === "SIGNED_OUT") {
                setWorker(null);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    // Compute the user email (work_email preferred over personal_email)
    const userEmail = worker?.work_email || worker?.personal_email || user?.email || null;

    const value: AuthContextType = {
        user,
        session,
        worker,
        isLoading,
        error,
        signOut,
        refreshWorker,
        userEmail,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
