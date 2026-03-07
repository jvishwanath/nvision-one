import type { ReactNode } from "react";

/**
 * Lightweight markdown-to-React renderer.
 * Supports: bold, italic, inline code, code blocks, links, headings, lists, and paragraphs.
 * No external dependencies required.
 */
export function renderMarkdown(text: string): ReactNode {
    if (!text) return null;

    const lines = text.split("\n");
    const elements: ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];

        // Code block
        if (line.trimStart().startsWith("```")) {
            const codeLines: string[] = [];
            i++;
            while (i < lines.length && !lines[i].trimStart().startsWith("```")) {
                codeLines.push(lines[i]);
                i++;
            }
            i++; // skip closing ```
            elements.push(
                <pre key={elements.length} className="rounded-lg bg-muted p-3 text-xs overflow-x-auto my-2">
                    <code>{codeLines.join("\n")}</code>
                </pre>
            );
            continue;
        }

        // Heading
        const headingMatch = line.match(/^(#{1,3})\s+(.+)/);
        if (headingMatch) {
            const level = headingMatch[1].length;
            const content = inlineFormat(headingMatch[2]);
            const cls = level === 1 ? "text-lg font-bold" : level === 2 ? "text-base font-semibold" : "text-sm font-semibold";
            elements.push(<p key={elements.length} className={`${cls} mt-2 mb-1`}>{content}</p>);
            i++;
            continue;
        }

        // Unordered list item
        if (line.match(/^\s*[-*]\s+/)) {
            const items: ReactNode[] = [];
            while (i < lines.length && lines[i].match(/^\s*[-*]\s+/)) {
                items.push(<li key={items.length}>{inlineFormat(lines[i].replace(/^\s*[-*]\s+/, ""))}</li>);
                i++;
            }
            elements.push(<ul key={elements.length} className="list-disc list-inside space-y-0.5 my-1">{items}</ul>);
            continue;
        }

        // Ordered list item
        if (line.match(/^\s*\d+\.\s+/)) {
            const items: ReactNode[] = [];
            while (i < lines.length && lines[i].match(/^\s*\d+\.\s+/)) {
                items.push(<li key={items.length}>{inlineFormat(lines[i].replace(/^\s*\d+\.\s+/, ""))}</li>);
                i++;
            }
            elements.push(<ol key={elements.length} className="list-decimal list-inside space-y-0.5 my-1">{items}</ol>);
            continue;
        }

        // Empty line
        if (line.trim() === "") {
            i++;
            continue;
        }

        // Paragraph
        elements.push(<p key={elements.length} className="my-1">{inlineFormat(line)}</p>);
        i++;
    }

    return <>{elements}</>;
}

function inlineFormat(text: string): ReactNode {
    const parts: ReactNode[] = [];
    // Process inline patterns: bold, italic, inline code, markdown links, bare URLs
    const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|_[^_]+_|\[([^\]]+)\]\(([^)]+)\)|https?:\/\/[^\s<>)\]]+)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push(text.slice(lastIndex, match.index));
        }

        const token = match[0];

        if (token.startsWith("`")) {
            parts.push(
                <code key={parts.length} className="rounded bg-muted px-1 py-0.5 text-[0.85em] font-mono">
                    {token.slice(1, -1)}
                </code>
            );
        } else if (token.startsWith("**")) {
            parts.push(<strong key={parts.length}>{token.slice(2, -2)}</strong>);
        } else if (token.startsWith("*") || token.startsWith("_")) {
            parts.push(<em key={parts.length}>{token.slice(1, -1)}</em>);
        } else if (token.startsWith("[")) {
            parts.push(
                <a key={parts.length} href={match[3]} className="text-primary underline" target="_blank" rel="noopener noreferrer">
                    {match[2]}
                </a>
            );
        } else if (token.startsWith("http")) {
            const cleanUrl = token.replace(/[.,;:!?]+$/, "");
            const trailing = token.slice(cleanUrl.length);
            parts.push(
                <a key={parts.length} href={cleanUrl} className="text-primary underline break-all" target="_blank" rel="noopener noreferrer">
                    {cleanUrl}
                </a>
            );
            if (trailing) parts.push(trailing);
        }

        lastIndex = match.index + token.length;
    }

    if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
    }

    return parts.length === 1 ? parts[0] : <>{parts}</>;
}
