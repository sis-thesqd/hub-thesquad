import type { Frame } from "@/utils/supabase/types";

type IframeViewProps = {
    frame: Frame;
};

export const IframeView = ({ frame }: IframeViewProps) => {
    return (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-secondary_alt bg-primary">
            <iframe
                title={frame.name}
                src={frame.iframe_url}
                className="h-full w-full border-0"
                allow="clipboard-read; clipboard-write; fullscreen;"
            />
        </div>
    );
};
