"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/base/buttons/button";
import { AlertTriangle } from "@untitledui/icons";

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        if (process.env.NODE_ENV === "development") {
            console.error("Error caught by boundary:", error, errorInfo);
        }
    }

    handleReset = (): void => {
        this.setState({ hasError: false, error: null });
    };

    render(): ReactNode {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 p-8">
                    <div className="flex size-12 items-center justify-center rounded-full bg-error-secondary">
                        <AlertTriangle className="size-6 text-fg-error_primary" />
                    </div>
                    <div className="text-center">
                        <h2 className="text-lg font-semibold text-primary">
                            Something went wrong
                        </h2>
                        <p className="mt-1 text-sm text-tertiary">
                            An unexpected error occurred. Please try again.
                        </p>
                        {process.env.NODE_ENV === "development" && this.state.error && (
                            <pre className="mt-4 max-w-lg overflow-auto rounded-lg bg-secondary p-4 text-left text-xs text-secondary">
                                {this.state.error.message}
                            </pre>
                        )}
                    </div>
                    <Button color="secondary" size="sm" onClick={this.handleReset}>
                        Try again
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}
