"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Mail01, RefreshCcw01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { PinInput } from "@/components/base/pin-input/pin-input";
import { createClient } from "@/utils/supabase/client";

export const VerifyForm = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get("email") || "";

    const [otp, setOtp] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [resendCooldown, setResendCooldown] = useState(0);

    const supabase = createClient();

    // Cooldown timer for resend
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(
                () => setResendCooldown(resendCooldown - 1),
                1000
            );
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    // Auto-submit when OTP is complete
    useEffect(() => {
        if (otp.length === 6) {
            handleVerify();
        }
    }, [otp]);

    const handleVerify = async () => {
        if (otp.length !== 6) {
            setError("Please enter the complete 6-digit code");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const { data, error: verifyError } = await supabase.auth.verifyOtp({
                email,
                token: otp,
                type: "email",
            });

            if (verifyError) {
                setError(verifyError.message);
                setOtp("");
                setIsLoading(false);
                return;
            }

            // Check if user is authorized in rippling_workers
            if (data.user?.email) {
                const { data: worker, error: workerError } = await supabase
                    .from("rippling_workers")
                    .select("id, status")
                    .or(
                        `work_email.eq.${data.user.email},personal_email.eq.${data.user.email}`
                    )
                    .eq("status", "ACTIVE")
                    .single();

                if (workerError || !worker) {
                    await supabase.auth.signOut();
                    setError(
                        "You are not authorized to access this application."
                    );
                    setOtp("");
                    setIsLoading(false);
                    return;
                }
            }

            // Success - redirect to home
            router.push("/");
        } catch (err) {
            console.error("Verification error:", err);
            setError("An unexpected error occurred. Please try again.");
            setOtp("");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendCooldown > 0) return;

        setIsResending(true);
        setError(null);

        try {
            const { error: resendError } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    shouldCreateUser: false,
                },
            });

            if (resendError) {
                setError(resendError.message);
            } else {
                setResendCooldown(60); // 60 second cooldown
            }
        } catch (err) {
            console.error("Resend error:", err);
            setError("Failed to resend code. Please try again.");
        } finally {
            setIsResending(false);
        }
    };

    const handleBack = () => {
        router.push("/login");
    };

    // If no email provided, redirect to login
    if (!email) {
        router.push("/login");
        return null;
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-primary px-4">
            <div className="w-full max-w-[360px]">
                {/* Icon */}
                <div className="mb-6 flex justify-center">
                    <div className="flex size-14 items-center justify-center rounded-full border border-primary bg-primary shadow-xs">
                        <Mail01 className="size-7 text-fg-brand-primary" />
                    </div>
                </div>

                {/* Header */}
                <div className="mb-8 text-center">
                    <h1 className="text-display-sm font-semibold text-primary">
                        Check your email
                    </h1>
                    <p className="mt-3 text-md text-tertiary">
                        We sent a verification code to{" "}
                        <span className="font-medium text-primary">{email}</span>
                    </p>
                </div>

                {/* Error message */}
                {error && (
                    <div className="mb-6 rounded-lg border border-error-subtle bg-error-primary p-3">
                        <p className="text-sm text-error-primary">{error}</p>
                    </div>
                )}

                {/* OTP Input */}
                <div className="mb-8">
                    <PinInput size="lg" disabled={isLoading}>
                        <PinInput.Label>Enter verification code</PinInput.Label>
                        <PinInput.Group
                            maxLength={6}
                            value={otp}
                            onChange={setOtp}
                            containerClassName="justify-center"
                        >
                            <PinInput.Slot index={0} />
                            <PinInput.Slot index={1} />
                            <PinInput.Slot index={2} />
                            <PinInput.Separator />
                            <PinInput.Slot index={3} />
                            <PinInput.Slot index={4} />
                            <PinInput.Slot index={5} />
                        </PinInput.Group>
                    </PinInput>
                </div>

                {/* Verify Button */}
                <Button
                    type="button"
                    color="primary"
                    size="lg"
                    isLoading={isLoading}
                    isDisabled={otp.length !== 6}
                    className="w-full"
                    onClick={handleVerify}
                >
                    Verify email
                </Button>

                {/* Resend */}
                <div className="mt-8 flex items-center justify-center gap-1">
                    <span className="text-sm text-tertiary">
                        Didn&apos;t receive the code?
                    </span>
                    <Button
                        color="link-color"
                        size="sm"
                        onClick={handleResend}
                        isDisabled={resendCooldown > 0 || isResending}
                        isLoading={isResending}
                        iconLeading={resendCooldown > 0 ? undefined : RefreshCcw01}
                    >
                        {resendCooldown > 0
                            ? `Resend in ${resendCooldown}s`
                            : "Resend"}
                    </Button>
                </div>

                {/* Back to login */}
                <div className="mt-8 flex justify-center">
                    <Button
                        color="link-gray"
                        size="sm"
                        onClick={handleBack}
                        iconLeading={ArrowLeft}
                    >
                        Back to login
                    </Button>
                </div>
            </div>
        </div>
    );
};
