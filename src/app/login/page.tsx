import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center bg-primary">
                    <div className="size-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
                </div>
            }
        >
            <LoginForm />
        </Suspense>
    );
}
