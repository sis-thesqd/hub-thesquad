"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { SocialButton } from "@/components/base/buttons/social-button";
import { Input } from "@/components/base/input/input";
import { createClient } from "@/utils/supabase/client";

export const LoginForm = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const errorParam = searchParams.get("error");

    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [error, setError] = useState<string | null>(errorParam);

    const supabase = createClient();

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) {
            setError("Please enter your email address");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // First check if user exists in rippling_workers via API
            const workerResponse = await fetch(`/api/auth/worker?email=${encodeURIComponent(email)}`);
            const workerData = await workerResponse.json();

            if (!workerResponse.ok || !workerData.worker) {
                setError(
                    "You are not authorized to access this application. Please use your work or personal email registered in the system."
                );
                setIsLoading(false);
                return;
            }

            // Send OTP code
            const { error: signInError } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    shouldCreateUser: true,
                },
            });

            if (signInError) {
                setError(signInError.message);
                setIsLoading(false);
                return;
            }

            // Redirect to verification page
            router.push(`/auth/verify?email=${encodeURIComponent(email)}`);
        } catch (err) {
            console.error("Login error:", err);
            setError("An unexpected error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setIsGoogleLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                    queryParams: {
                        access_type: "offline",
                        prompt: "consent",
                    },
                },
            });

            if (error) {
                setError(error.message);
                setIsGoogleLoading(false);
            }
        } catch (err) {
            console.error("Google login error:", err);
            setError("An unexpected error occurred. Please try again.");
            setIsGoogleLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-primary px-4">
            <div className="w-full max-w-[360px]">
                {/* Logo */}
                <div className="mb-2 flex justify-center">
                    <div className="flex size-14 items-center justify-center rounded-xl bg-primary shadow-xs outline-none">
                        <img
                            src="/sqd-badge.png"
                            alt="Squad Hub"
                            className="h-[64px] object-contain"
                        />
                    </div>
                </div>

                {/* Header */}
                <div className="mb-8 text-center">
                    <h1 className="text-display-sm font-semibold text-primary">
                        Squad Hub
                    </h1>
                </div>

                {/* Error message */}
                {error && (
                    <div className="mb-6 rounded-lg border border-error-subtle bg-error-primary p-3">
                        <p className="text-sm text-error-primary">{error}</p>
                    </div>
                )}

                {/* Login form */}
                <form onSubmit={handleEmailLogin} className="flex flex-col gap-5">
                    <Input
                        type="email"
                        label="Email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(value) => setEmail(value)}
                        icon={Mail01}
                        isDisabled={isLoading || isGoogleLoading}
                        isRequired
                    />

                    <Button
                        type="submit"
                        color="primary"
                        size="lg"
                        isLoading={isLoading}
                        isDisabled={isGoogleLoading}
                        className="w-full"
                    >
                        Continue with email
                    </Button>
                </form>

                {/* Divider */}
                <div className="my-6 flex items-center gap-2">
                    <div className="h-px flex-1 bg-secondary" />
                    <span className="text-sm text-tertiary">or</span>
                    <div className="h-px flex-1 bg-secondary" />
                </div>

                {/* Google login */}
                <SocialButton
                    social="google"
                    theme="gray"
                    size="lg"
                    className="w-full"
                    onClick={handleGoogleLogin}
                    disabled={isLoading || isGoogleLoading}
                >
                    {isGoogleLoading ? "Signing in..." : "Sign in with Google"}
                </SocialButton>

                {/* Footer */}
                <p className="mt-8 text-center text-sm text-tertiary">
                    Only Squad employees can access this app.
                </p>
            </div>
        </div>
    );
};
