"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import "highlight.js/styles/github-dark.css";

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
            >
                {content}
            </ReactMarkdown>
        </div>
    );
};
