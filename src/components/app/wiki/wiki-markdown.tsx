"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import "highlight.js/styles/github-dark.css";
import { MermaidChart } from "@/components/app/wiki/mermaid-chart";
import { WikiEmbed } from "@/components/app/wiki/wiki-embed";

interface WikiMarkdownProps {
    content: string;
}

export const WikiMarkdown = ({ content }: WikiMarkdownProps) => {
    return (
        <div className="prose prose-sm md:prose-base max-w-none">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[
                    rehypeRaw,
                    rehypeSlug,
                    [
                        rehypeAutolinkHeadings,
                        {
                            behavior: "wrap",
                            properties: {
                                className: ["anchor"],
                            },
                        },
                    ],
                    rehypeHighlight,
                ]}
                components={{
                    code: ({ className, children, ...props }) => {
                        const match = /language-(\w+)/.exec(className || "");
                        const language = match?.[1];
                        const code = String(children || "").trim();

                        if (language === "mermaid") {
                            return <MermaidChart code={code} />;
                        }

                        return match ? (
                            <code className={className} {...props}>
                                {children}
                            </code>
                        ) : (
                            <code
                                className="rounded bg-secondary px-1.5 py-0.5 text-xs text-secondary"
                                {...props}
                            >
                                {children}
                            </code>
                        );
                    },
                    iframe: ({ src, title }) => <WikiEmbed src={src} title={title} />,
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
};
