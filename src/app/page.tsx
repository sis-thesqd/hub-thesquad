import { Suspense } from "react";
import { Dashboard17 } from "./dashboards-17";

export default function Page() {
    return (
        <Suspense>
            <Dashboard17 />
        </Suspense>
    );
}
