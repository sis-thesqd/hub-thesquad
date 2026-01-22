import { Suspense } from "react";
import { VerifyForm } from "./verify-form";

export default function VerifyPage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center bg-primary">
                    <div className="size-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
                </div>
            }
        >
            <VerifyForm />
        </Suspense>
    );
}
