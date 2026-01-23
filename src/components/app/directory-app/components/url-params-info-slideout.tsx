"use client";

import { useState } from "react";
import type { Key } from "react-aria-components";
import { Check, Copy01, InfoCircle } from "@untitledui/icons";
import { SlideoutMenu } from "@/components/application/slideout-menus/slideout-menu";
import { Tabs } from "@/components/application/tabs/tabs";
import { Button } from "@/components/base/buttons/button";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";

const AI_BUILDER_PROMPT = `When building this app, implement URL parameter support to receive data from the parent page:

1. Parse URL parameters on page load:
   - Use URLSearchParams to read query parameters from window.location.search
   - Example: const params = new URLSearchParams(window.location.search);

2. Common parameters to handle:
   - user_id: The current user's ID
   - email: The current user's email
   - department: The user's department
   - Any custom parameters passed from the directory

3. Example implementation:
   useEffect(() => {
     const params = new URLSearchParams(window.location.search);
     const userId = params.get('user_id');
     const email = params.get('email');
     // Use these values to personalize the app
   }, []);

4. The parent directory will append these parameters to your iframe URL automatically. Your app just needs to read them.`;

const CopyButton = ({ text, label = "Copy" }: { text: string; label?: string }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-sm font-medium text-brand-secondary transition hover:text-brand-primary"
        >
            {copied ? (
                <>
                    <Check className="size-4" />
                    Copied
                </>
            ) : (
                <>
                    <Copy01 className="size-4" />
                    {label}
                </>
            )}
        </button>
    );
};

type UrlParamsInfoSlideoutProps = {
    iframeUrl?: string;
};

const isFilloutUrl = (url?: string) => {
    if (!url) return false;
    return url.includes("forms.fillout.com") || url.includes("forms.thesqd.com");
};

const tabs = [
    { id: "url-params", label: "URL Params" },
    { id: "ai-prompts", label: "AI Prompts" },
];

const FilloutGuideContent = () => (
    <div className="prose prose-sm max-w-none">
        <p className="text-tertiary">
            This page uses a Fillout form. Fillout has built-in support for URL parameters, making it easy to pass data into your forms.
        </p>

        <h3 className="mt-6 text-md font-semibold text-primary">Step 1: Open Form Settings</h3>
        <p className="text-sm text-tertiary">
            In your Fillout form editor, click on the <strong>Settings</strong> tab in the left sidebar.
        </p>
        <figure className="my-4">
            <img
                src="/images/guides/fillout/step-1.png"
                alt="Fillout settings tab"
                className="w-full rounded-lg border border-secondary"
            />
        </figure>

        <h3 className="mt-6 text-md font-semibold text-primary">Step 2: Navigate to URL Parameters</h3>
        <p className="text-sm text-tertiary">
            In the settings panel, find and click on <strong>URL parameters</strong>.
        </p>
        <figure className="my-4">
            <img
                src="/images/guides/fillout/step-2.png"
                alt="URL parameters option"
                className="w-full rounded-lg border border-secondary"
            />
        </figure>

        <h3 className="mt-6 text-md font-semibold text-primary">Step 3: Add a New Parameter</h3>
        <p className="text-sm text-tertiary">
            Click <strong>Add new</strong> to create a new URL parameter.
        </p>
        <figure className="my-4">
            <img
                src="/images/guides/fillout/step-3.png"
                alt="Add new parameter button"
                className="w-full rounded-lg border border-secondary"
            />
        </figure>

        <h3 className="mt-6 text-md font-semibold text-primary">Step 4: Name Your Parameter</h3>
        <p className="text-sm text-tertiary">
            Enter the name of the parameter you want to receive. The name must match exactly what will be passed in the URL.
        </p>
        <figure className="my-4">
            <img
                src="/images/guides/fillout/step-4.png"
                alt="Parameter name input"
                className="w-full rounded-lg border border-secondary"
            />
        </figure>

        <div className="my-6 rounded-xl bg-secondary p-4">
            <h4 className="text-sm font-semibold text-primary">Naming Conventions</h4>
            <ul className="mt-2 space-y-1 text-sm text-tertiary">
                <li>Use <code className="rounded bg-tertiary px-1 py-0.5 text-xs">snake_case</code> for multi-word names (e.g., <code className="rounded bg-tertiary px-1 py-0.5 text-xs">user_id</code>)</li>
                <li>Keep names lowercase to avoid case-sensitivity issues</li>
                <li>Use descriptive names (e.g., <code className="rounded bg-tertiary px-1 py-0.5 text-xs">department_name</code> not <code className="rounded bg-tertiary px-1 py-0.5 text-xs">dn</code>)</li>
                <li>Avoid special characters except underscores</li>
            </ul>
        </div>

        <h3 className="mt-6 text-md font-semibold text-primary">Using Parameters in Your Form</h3>
        <p className="text-sm text-tertiary">
            Once configured, you can use URL parameters to:
        </p>
        <ul className="mt-2 space-y-1 text-sm text-tertiary">
            <li>Pre-fill form fields with user data</li>
            <li>Show/hide questions based on parameter values</li>
            <li>Include parameter values in form submissions</li>
            <li>Personalize form content dynamically</li>
        </ul>
    </div>
);

const GenericUrlParamsContent = () => (
    <div className="prose prose-sm max-w-none">
        <h3 className="text-md font-semibold text-primary">How URL Parameters Work</h3>
        <p className="text-tertiary">
            When a page is loaded in the directory, URL parameters from the page URL are automatically passed to the embedded iframe. This allows your app to receive user context and other data.
        </p>

        <div className="my-6 rounded-xl bg-secondary p-4">
            <h4 className="text-sm font-semibold text-primary">Parameter Flow</h4>
            <ol className="mt-2 space-y-2 text-sm text-tertiary">
                <li>
                    <strong>1.</strong> User visits: <code className="rounded bg-tertiary px-1 py-0.5 text-xs">hub.thesqd.io/page?user_id=123</code>
                </li>
                <li>
                    <strong>2.</strong> Directory extracts parameters from the URL
                </li>
                <li>
                    <strong>3.</strong> Parameters are appended to your iframe URL: <code className="rounded bg-tertiary px-1 py-0.5 text-xs">your-app.com?user_id=123</code>
                </li>
            </ol>
        </div>

        <h3 className="mt-6 text-md font-semibold text-primary">Reading Parameters in Your App</h3>
        <p className="text-sm text-tertiary">
            Use JavaScript's URLSearchParams API to read the parameters in your embedded app:
        </p>
        <div className="my-4 rounded-lg bg-secondary p-4">
            <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-tertiary">JavaScript</span>
                <CopyButton
                    text={`const params = new URLSearchParams(window.location.search);
const userId = params.get('user_id');
const email = params.get('email');`}
                />
            </div>
            <pre className="overflow-x-auto text-xs text-secondary">
                <code>{`const params = new URLSearchParams(window.location.search);
const userId = params.get('user_id');
const email = params.get('email');`}</code>
            </pre>
        </div>

        <h3 className="mt-6 text-md font-semibold text-primary">Common Parameters</h3>
        <ul className="mt-2 space-y-1 text-sm text-tertiary">
            <li><code className="rounded bg-secondary px-1 py-0.5 text-xs">user_id</code> — The current user's ID</li>
            <li><code className="rounded bg-secondary px-1 py-0.5 text-xs">email</code> — The current user's email address</li>
            <li><code className="rounded bg-secondary px-1 py-0.5 text-xs">department</code> — The user's department</li>
            <li><code className="rounded bg-secondary px-1 py-0.5 text-xs">name</code> — The user's display name</li>
        </ul>

        <div className="my-6 rounded-xl bg-secondary p-4">
            <h4 className="text-sm font-semibold text-primary">Naming Conventions</h4>
            <ul className="mt-2 space-y-1 text-sm text-tertiary">
                <li>Use <code className="rounded bg-tertiary px-1 py-0.5 text-xs">snake_case</code> for multi-word names</li>
                <li>Keep names lowercase to avoid case-sensitivity issues</li>
                <li>Use descriptive names that clearly indicate the data</li>
                <li>Avoid special characters except underscores</li>
            </ul>
        </div>
    </div>
);

const AiPromptsContent = () => (
    <div className="prose prose-sm max-w-none">
        <h3 className="text-md font-semibold text-primary">AI App Builder Prompt</h3>
        <p className="text-tertiary">
            Copy this prompt to help your AI app builder understand how to implement URL parameters in your application.
        </p>

        <div className="my-4 rounded-lg bg-secondary p-4">
            <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-tertiary">Prompt</span>
                <CopyButton text={AI_BUILDER_PROMPT} label="Copy prompt" />
            </div>
            <pre className="overflow-x-auto whitespace-pre-wrap text-xs text-secondary">
                <code>{AI_BUILDER_PROMPT}</code>
            </pre>
        </div>

        <h3 className="mt-6 text-md font-semibold text-primary">How to Use</h3>
        <ol className="mt-2 space-y-2 text-sm text-tertiary">
            <li><strong>1.</strong> Copy the prompt above</li>
            <li><strong>2.</strong> Paste it into your AI app builder (Cursor, Claude, ChatGPT, etc.)</li>
            <li><strong>3.</strong> The AI will implement URL parameter handling in your app</li>
        </ol>

        <div className="my-6 rounded-xl bg-secondary p-4">
            <h4 className="text-sm font-semibold text-primary">Supported AI Tools</h4>
            <ul className="mt-2 space-y-1 text-sm text-tertiary">
                <li>Claude / Claude Code</li>
                <li>Cursor</li>
                <li>ChatGPT / GPT-4</li>
                <li>GitHub Copilot</li>
                <li>Replit AI</li>
                <li>Any code-aware AI assistant</li>
            </ul>
        </div>

        <h3 className="mt-6 text-md font-semibold text-primary">Additional Prompts</h3>

        <div className="my-4">
            <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-secondary">React Implementation</span>
                <CopyButton
                    text={`Add a useEffect hook that reads URL parameters on mount and stores them in state. Parse user_id, email, and department from the URL query string.`}
                    label="Copy"
                />
            </div>
            <p className="text-xs text-tertiary">For React-based applications</p>
        </div>

        <div className="my-4">
            <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-secondary">Next.js Implementation</span>
                <CopyButton
                    text={`Use useSearchParams from next/navigation to read URL parameters. Create a custom hook that extracts user_id, email, and department and makes them available throughout the app.`}
                    label="Copy"
                />
            </div>
            <p className="text-xs text-tertiary">For Next.js applications</p>
        </div>

        <div className="my-4">
            <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-secondary">Vanilla JavaScript</span>
                <CopyButton
                    text={`On DOMContentLoaded, parse URL parameters using URLSearchParams and store them in a global config object. Make these values accessible to all scripts on the page.`}
                    label="Copy"
                />
            </div>
            <p className="text-xs text-tertiary">For vanilla JavaScript applications</p>
        </div>
    </div>
);

export const UrlParamsInfoSlideout = ({ iframeUrl }: UrlParamsInfoSlideoutProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedTab, setSelectedTab] = useState<Key>("url-params");
    const showFilloutGuide = isFilloutUrl(iframeUrl);

    return (
        <SlideoutMenu.Trigger isOpen={isOpen} onOpenChange={setIsOpen}>
            <Button
                size="sm"
                color="tertiary"
                iconLeading={InfoCircle}
                aria-label="URL parameters info"
            />
            <SlideoutMenu isDismissable>
                <SlideoutMenu.Header onClose={() => setIsOpen(false)} className="relative flex w-full flex-col gap-4 px-4 pt-6 md:px-6">
                    <div className="flex items-start gap-4">
                        <FeaturedIcon size="md" color="gray" theme="modern" icon={InfoCircle} />
                        <section className="flex flex-col gap-0.5">
                            <h1 className="text-md font-semibold text-primary md:text-lg">Developer Guide</h1>
                            <p className="text-sm text-tertiary">Learn how to integrate with this page</p>
                        </section>
                    </div>
                    <Tabs selectedKey={selectedTab} onSelectionChange={setSelectedTab} className="w-full">
                        <Tabs.List type="button-minimal" items={tabs} fullWidth>
                            {(tab) => <Tabs.Item {...tab} />}
                        </Tabs.List>
                    </Tabs>
                </SlideoutMenu.Header>
                <SlideoutMenu.Content>
                    {selectedTab === "url-params" && (
                        showFilloutGuide ? <FilloutGuideContent /> : <GenericUrlParamsContent />
                    )}
                    {selectedTab === "ai-prompts" && <AiPromptsContent />}
                </SlideoutMenu.Content>
                <SlideoutMenu.Footer className="flex w-full justify-end gap-3">
                    <Button size="md" color="secondary" onClick={() => setIsOpen(false)}>
                        Close
                    </Button>
                </SlideoutMenu.Footer>
            </SlideoutMenu>
        </SlideoutMenu.Trigger>
    );
};
