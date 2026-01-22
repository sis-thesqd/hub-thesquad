"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";
import type { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";

export interface RipplingWorker {
    id: string;
    user_id: string | null;
    work_email: string | null;
    personal_email: string | null;
    display_name: string | null;
    given_name: string | null;
    family_name: string | null;
    middle_name: string | null;
    preferred_given_name: string | null;
    preferred_family_name: string | null;
    title: string | null;
    status: string | null;
    start_date: string | null;
    end_date: string | null;
    department_id: string | null;
    manager_id: string | null;
    level_id: string | null;
    teams_ids: string[] | null;
    is_manager: boolean | null;
    country: string | null;
    location_type: string | null;
    work_location_id: string | null;
    employment_type_id: string | null;
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

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [worker, setWorker] = useState<RipplingWorker | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const supabase = createClient();

    const fetchWorker = async (email: string): Promise<RipplingWorker | null> => {
        const { data, error } = await supabase
            .from("rippling_workers")
            .select(
                `id, user_id, work_email, personal_email, display_name, given_name, family_name, 
                 middle_name, preferred_given_name, preferred_family_name, title, status, 
                 start_date, end_date, department_id, manager_id, level_id, teams_ids, 
                 is_manager, country, location_type, work_location_id, employment_type_id`
            )
            .or(`work_email.eq.${email},personal_email.eq.${email}`)
            .eq("status", "ACTIVE")
            .single();

        if (error) {
            console.error("Error fetching worker:", error);
            return null;
        }

        return data;
    };

    const refreshWorker = async () => {
        if (!user?.email) return;
        const workerData = await fetchWorker(user.email);
        setWorker(workerData);
    };

    const signOut = async () => {
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
