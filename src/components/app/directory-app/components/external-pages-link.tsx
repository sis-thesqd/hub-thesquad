"use client";

import Link from "next/link";
import { Globe02 } from "@untitledui/icons";
import { useAppendUrlParams } from "@/hooks/use-url-params";
import { EXTERNAL_PAGES_SLUG } from "../hooks";

type ExternalPagesLinkProps = {
    selectedDepartmentId: string;
    externalPageCount: number;
};

export const ExternalPagesLink = ({
    selectedDepartmentId,
    externalPageCount,
}: ExternalPagesLinkProps) => {
    const appendUrlParams = useAppendUrlParams();

    return (
        <Link
            href={appendUrlParams(`/${selectedDepartmentId}/${EXTERNAL_PAGES_SLUG}`)}
            className="group relative flex items-center gap-4 rounded-xl border border-secondary_alt bg-primary p-4 transition hover:border-brand-solid hover:bg-primary_hover"
        >
            <div className="flex size-12 items-center justify-center rounded-lg bg-secondary">
                <Globe02 className="size-6 text-fg-tertiary group-hover:text-brand-secondary" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-primary">Pages from Other Departments</p>
                <p className="mt-0.5 text-xs text-tertiary">
                    {externalPageCount} {externalPageCount === 1 ? "page" : "pages"}
                </p>
            </div>
        </Link>
    );
};
