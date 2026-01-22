import { Home01 } from "@untitledui/icons";

export const NoDepartmentState = () => {
    return (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-secondary_alt bg-primary px-6 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-secondary">
                <Home01 className="size-7 text-fg-quaternary" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-primary">Welcome to Directory</h3>
            <p className="mt-1 max-w-sm text-sm text-tertiary">
                Select a department to view and manage its folders and pages.
            </p>
        </div>
    );
};
