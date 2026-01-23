import { Home01 } from "@untitledui/icons";
import { EmptyState } from "@/components/application/empty-state/empty-state";

export const NoDepartmentState = () => {
    return (
        <div className="flex h-full min-h-[400px] items-center justify-center">
            <EmptyState size="md">
                <EmptyState.Header>
                    <EmptyState.FeaturedIcon color="gray" icon={Home01} />
                </EmptyState.Header>

                <EmptyState.Content>
                    <EmptyState.Title>Welcome to Directory</EmptyState.Title>
                    <EmptyState.Description>
                        Select a department to view and manage its folders and pages.
                    </EmptyState.Description>
                </EmptyState.Content>
            </EmptyState>
        </div>
    );
};
