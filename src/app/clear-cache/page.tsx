"use client";

import { useEffect, useState } from "react";

export default function ClearCachePage() {
    const [status, setStatus] = useState<string>("Working...");
    const [done, setDone] = useState(false);

    useEffect(() => {
        async function unregisterServiceWorkers() {
            try {
                if ("serviceWorker" in navigator) {
                    const registrations = await navigator.serviceWorker.getRegistrations();

                    if (registrations.length === 0) {
                        setStatus("No service workers found. ✓");
                        setDone(true);
                        return;
                    }

                    let unregisteredCount = 0;
                    for (let registration of registrations) {
                        const success = await registration.unregister();
                        if (success) {
                            unregisteredCount++;
                        }
                    }

                    // Clear all caches
                    if ("caches" in window) {
                        const cacheNames = await caches.keys();
                        await Promise.all(cacheNames.map((name) => caches.delete(name)));
                    }

                    setStatus(`✓ Unregistered ${unregisteredCount} service worker(s)\n✓ Cleared all caches`);
                    setDone(true);
                } else {
                    setStatus("Service workers not supported");
                    setDone(true);
                }
            } catch (error) {
                setStatus(`Error: ${error}`);
                setDone(true);
            }
        }

        unregisterServiceWorkers();
    }, []);

    return (
        <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
            <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Clear Cache & Service Workers</h1>
            <div
                style={{
                    padding: "1rem",
                    backgroundColor: done ? "#d4edda" : "#fff3cd",
                    border: `1px solid ${done ? "#c3e6cb" : "#ffeaa7"}`,
                    borderRadius: "8px",
                    marginBottom: "1rem",
                    whiteSpace: "pre-wrap",
                }}
            >
                {status}
            </div>

            {done && (
                <>
                    <div
                        style={{
                            padding: "1rem",
                            backgroundColor: "#f8d7da",
                            border: "1px solid #f5c6cb",
                            borderRadius: "8px",
                            marginBottom: "1rem",
                        }}
                    >
                        <strong>Important:</strong> Close ALL tabs with localhost:3000 and reopen the app for changes to
                        take effect.
                    </div>
                    <button
                        onClick={() => (window.location.href = "/")}
                        style={{
                            padding: "0.75rem 1.5rem",
                            backgroundColor: "#007bff",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "1rem",
                        }}
                    >
                        Go to Home
                    </button>
                </>
            )}
        </div>
    );
}
