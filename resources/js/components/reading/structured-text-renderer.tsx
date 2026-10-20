import React, { useMemo } from 'react';
import { AcademicHighlightedText } from './academic-highlighted-text';
import type { GlossaryTerm } from './vocab-popover';

interface StructuredTextRendererProps {
    text: string;
    glossaryTerms: GlossaryTerm[];
    highlightEnabled: boolean;
    pageNumber: number;
    totalPages: number;
}

type BlockType =
    | 'h1'
    | 'h2'
    | 'h3'
    | 'paragraph'
    | 'list-ordered'
    | 'list-unordered'
    | 'table'
    | 'blockquote'
    | 'empty';

interface ParsedBlock {
    type: BlockType;
    content: string;
    items?: string[];
    rows?: string[][];
}

/**
 * Determines heading level from text content heuristics.
 * Returns 0 if not a heading.
 */
function detectHeadingLevel(text: string): 0 | 1 | 2 | 3 {
    const trimmed = text.trim();
    if (!trimmed || trimmed.length > 120) return 0;

    // H1: "BAB I", "BAB 1", "CHAPTER 1", or single-line ALL-CAPS >= 4 chars, no period
    const isH1 =
        /^(BAB|CHAPTER)\s+[IVXLCDM\d]+/i.test(trimmed) ||
        (trimmed.length >= 4 &&
            trimmed.length < 80 &&
            trimmed === trimmed.toUpperCase() &&
            /[A-Z]/.test(trimmed) &&
            !trimmed.endsWith('.') &&
            !/^\d+\.\s/.test(trimmed) &&
            !trimmed.includes('|'));

    if (isH1) return 1;

    // H2: "1.", "2.1", "A.", numbered section headers (short text, no period at end)
    const isH2 =
        trimmed.length < 90 &&
        (
            /^\d+\.\s+[A-Z]/.test(trimmed) ||
            /^[A-Z]\.\s+/.test(trimmed) ||
            /^(ABSTRACT|ABSTRAK|PENDAHULUAN|METODE|METODOLOGI|HASIL|KESIMPULAN|PEMBAHASAN|REFERENCES|DAFTAR PUSTAKA|KATA PENGANTAR|DAFTAR ISI|DAFTAR TABEL|DAFTAR GAMBAR|LAMPIRAN|UCAPAN TERIMA KASIH|PERNYATAAN|RINGKASAN|SARAN)\b/i.test(trimmed)
        ) &&
        !trimmed.endsWith('.');

    if (isH2) return 2;

    // H3: "1.1", "2.1.1", "a)", sub-section numbering (short, no period at end)
    const isH3 =
        trimmed.length < 90 &&
        (
            /^\d+\.\d+\.?\s+[A-Z]/i.test(trimmed) ||
            /^[a-z]\)\s+/i.test(trimmed)
        ) &&
        !trimmed.endsWith('.');

    if (isH3) return 3;

    return 0;
}

/**
 * Checks if a group of lines forms an ordered list.
 */
function isOrderedListBlock(lines: string[]): boolean {
    if (lines.length < 2) return false;
    let matchCount = 0;
    for (const line of lines) {
        if (/^\s*\d+[\.\)]\s+/.test(line)) matchCount++;
    }
    return matchCount / lines.length >= 0.6;
}

/**
 * Checks if a group of lines forms an unordered list.
 */
function isUnorderedListBlock(lines: string[]): boolean {
    if (lines.length < 2) return false;
    let matchCount = 0;
    for (const line of lines) {
        if (/^\s*[-•●◦▪▸►–—]\s+/.test(line)) matchCount++;
    }
    return matchCount / lines.length >= 0.6;
}

/**
 * Checks if a block of text looks like a pipe-separated table.
 */
function isTableBlock(text: string): boolean {
    const lines = text.split('\n').filter((l) => l.trim().length > 0);
    if (lines.length < 2) return false;

    let pipeLines = 0;
    for (const line of lines) {
        if (line.includes('|') && line.split('|').length >= 3) pipeLines++;
    }
    return pipeLines / lines.length >= 0.6;
}

/**
 * Parse a pipe-separated table into rows/columns.
 */
function parseTable(text: string): string[][] {
    return text
        .split('\n')
        .filter((l) => l.trim().length > 0)
        .filter((l) => !/^[\s|:-]+$/.test(l)) // skip separator rows like |---|---|
        .map((line) =>
            line
                .split('|')
                .map((cell) => cell.trim())
                .filter((cell) => cell.length > 0),
        );
}

/**
 * Parse extracted text into structured blocks.
 */
function parseTextToBlocks(text: string): ParsedBlock[] {
    if (!text || !text.trim()) return [];

    const blocks: ParsedBlock[] = [];
    const rawBlocks = text.split(/\n\s*\n/).filter((b) => b.trim().length > 0);

    for (const raw of rawBlocks) {
        const trimmed = raw.trim();

        // Table detection
        if (isTableBlock(trimmed)) {
            blocks.push({
                type: 'table',
                content: trimmed,
                rows: parseTable(trimmed),
            });
            continue;
        }

        const lines = trimmed.split('\n').map((l) => l.trimEnd());

        // Multi-line list detection
        if (lines.length >= 2) {
            if (isOrderedListBlock(lines)) {
                blocks.push({
                    type: 'list-ordered',
                    content: trimmed,
                    items: lines.map((l) => l.replace(/^\s*\d+[\.\)]\s+/, '')),
                });
                continue;
            }
            if (isUnorderedListBlock(lines)) {
                blocks.push({
                    type: 'list-unordered',
                    content: trimmed,
                    items: lines.map((l) => l.replace(/^\s*[-•●◦▪▸►–—]\s+/, '')),
                });
                continue;
            }
        }

        // Single-line list items within a block (lines with mixed content)
        // Process each line for inline list items
        const listItems: string[] = [];
        const nonListLines: string[] = [];
        let currentListType: 'ordered' | 'unordered' | null = null;

        for (const line of lines) {
            const isOl = /^\s*\d+[\.\)]\s+/.test(line);
            const isUl = /^\s*[-•●◦▪▸►–—]\s+/.test(line);

            if (isOl || isUl) {
                // If we had non-list content before, flush it
                if (nonListLines.length > 0) {
                    const joined = nonListLines.join('\n').trim();
                    if (joined) {
                        const heading = detectHeadingLevel(joined);
                        if (heading === 1) blocks.push({ type: 'h1', content: joined });
                        else if (heading === 2) blocks.push({ type: 'h2', content: joined });
                        else if (heading === 3) blocks.push({ type: 'h3', content: joined });
                        else blocks.push({ type: 'paragraph', content: joined });
                    }
                    nonListLines.length = 0;
                }

                const newType = isOl ? 'ordered' : 'unordered';
                // If switching list type, flush current list
                if (currentListType && currentListType !== newType && listItems.length > 0) {
                    blocks.push({
                        type: currentListType === 'ordered' ? 'list-ordered' : 'list-unordered',
                        content: '',
                        items: [...listItems],
                    });
                    listItems.length = 0;
                }
                currentListType = newType;
                const cleanItem = isOl
                    ? line.replace(/^\s*\d+[\.\)]\s+/, '')
                    : line.replace(/^\s*[-•●◦▪▸►–—]\s+/, '');
                listItems.push(cleanItem);
            } else {
                // Flush list items if any
                if (listItems.length > 0 && currentListType) {
                    blocks.push({
                        type: currentListType === 'ordered' ? 'list-ordered' : 'list-unordered',
                        content: '',
                        items: [...listItems],
                    });
                    listItems.length = 0;
                    currentListType = null;
                }
                nonListLines.push(line);
            }
        }

        // Flush remaining list items
        if (listItems.length > 0 && currentListType) {
            blocks.push({
                type: currentListType === 'ordered' ? 'list-ordered' : 'list-unordered',
                content: '',
                items: [...listItems],
            });
        }

        // Flush remaining non-list lines
        if (nonListLines.length > 0) {
            const joined = nonListLines.join('\n').trim();
            if (joined) {
                // Check if it's a blockquote (lines starting with > or heavy indentation)
                if (/^>\s+/.test(joined) || /^\s{4,}/.test(joined)) {
                    blocks.push({
                        type: 'blockquote',
                        content: joined.replace(/^>\s+/gm, ''),
                    });
                } else {
                    const heading = detectHeadingLevel(joined);
                    if (heading === 1) blocks.push({ type: 'h1', content: joined });
                    else if (heading === 2) blocks.push({ type: 'h2', content: joined });
                    else if (heading === 3) blocks.push({ type: 'h3', content: joined });
                    else blocks.push({ type: 'paragraph', content: joined });
                }
            }
        }
    }

    return blocks;
}

function HighlightedInline({
    text,
    glossaryTerms,
    enabled,
}: {
    text: string;
    glossaryTerms: GlossaryTerm[];
    enabled: boolean;
}) {
    return (
        <AcademicHighlightedText
            text={text}
            glossaryTerms={glossaryTerms}
            enabled={enabled}
        />
    );
}

export function StructuredTextRenderer({
    text,
    glossaryTerms,
    highlightEnabled,
    pageNumber,
    totalPages,
}: StructuredTextRendererProps) {
    const blocks = useMemo(() => parseTextToBlocks(text), [text]);

    if (blocks.length === 0) return null;

    return (
        <div className="mx-auto w-full max-w-[820px]">
            {/* A4-like paper container */}
            <div
                className="relative rounded-sm border border-border/60 bg-white shadow-[0_1px_6px_rgba(0,0,0,0.06),0_4px_24px_rgba(0,0,0,0.04)] dark:border-border/40 dark:bg-zinc-950 dark:shadow-[0_1px_6px_rgba(0,0,0,0.2)]"
                style={{
                    paddingTop: 'clamp(1.5rem, 4vw, 3rem)',
                    paddingBottom: 'clamp(2rem, 4vw, 3.5rem)',
                    paddingLeft: 'clamp(1.25rem, 5vw, 3.5rem)',
                    paddingRight: 'clamp(1.25rem, 5vw, 3.5rem)',
                }}
            >
                {/* Render structured blocks */}
                <div className="space-y-[1.1em]" style={{ fontFamily: "'Georgia', 'Times New Roman', 'Noto Serif', serif" }}>
                    {blocks.map((block, idx) => {
                        switch (block.type) {
                            case 'h1':
                                return (
                                    <h2
                                        key={idx}
                                        className="mt-6 mb-2 text-center text-lg font-bold tracking-tight text-foreground sm:text-xl"
                                        style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}
                                    >
                                        <HighlightedInline text={block.content} glossaryTerms={glossaryTerms} enabled={highlightEnabled} />
                                    </h2>
                                );

                            case 'h2':
                                return (
                                    <h3
                                        key={idx}
                                        className="mt-5 mb-1.5 border-b border-border/30 pb-1 text-base font-bold text-foreground sm:text-lg"
                                        style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}
                                    >
                                        <HighlightedInline text={block.content} glossaryTerms={glossaryTerms} enabled={highlightEnabled} />
                                    </h3>
                                );

                            case 'h3':
                                return (
                                    <h4
                                        key={idx}
                                        className="mt-4 mb-1 text-[0.95rem] font-semibold text-foreground/90 sm:text-base"
                                        style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}
                                    >
                                        <HighlightedInline text={block.content} glossaryTerms={glossaryTerms} enabled={highlightEnabled} />
                                    </h4>
                                );

                            case 'paragraph':
                                return (
                                    <p
                                        key={idx}
                                        className="text-[0.9rem] leading-[1.8] text-foreground/85 sm:text-[0.95rem]"
                                        style={{ textAlign: 'justify', textIndent: '2em' }}
                                    >
                                        <HighlightedInline text={block.content} glossaryTerms={glossaryTerms} enabled={highlightEnabled} />
                                    </p>
                                );

                            case 'list-ordered':
                                return (
                                    <ol
                                        key={idx}
                                        className="ml-6 list-decimal space-y-1.5 text-[0.9rem] leading-[1.7] text-foreground/85 marker:text-foreground/50 marker:font-semibold sm:ml-8 sm:text-[0.95rem]"
                                    >
                                        {block.items?.map((item, i) => (
                                            <li key={i} className="pl-1">
                                                <HighlightedInline text={item} glossaryTerms={glossaryTerms} enabled={highlightEnabled} />
                                            </li>
                                        ))}
                                    </ol>
                                );

                            case 'list-unordered':
                                return (
                                    <ul
                                        key={idx}
                                        className="ml-6 list-disc space-y-1.5 text-[0.9rem] leading-[1.7] text-foreground/85 marker:text-foreground/40 sm:ml-8 sm:text-[0.95rem]"
                                    >
                                        {block.items?.map((item, i) => (
                                            <li key={i} className="pl-1">
                                                <HighlightedInline text={item} glossaryTerms={glossaryTerms} enabled={highlightEnabled} />
                                            </li>
                                        ))}
                                    </ul>
                                );

                            case 'table':
                                return (
                                    <div key={idx} className="my-3 overflow-x-auto rounded-md border border-border/50">
                                        <table className="w-full text-left text-[0.85rem] sm:text-sm">
                                            {block.rows && block.rows.length > 0 && (
                                                <>
                                                    <thead>
                                                        <tr className="border-b border-border/60 bg-muted/40">
                                                            {block.rows[0].map((cell, ci) => (
                                                                <th
                                                                    key={ci}
                                                                    className="px-3 py-2 font-semibold text-foreground/90"
                                                                >
                                                                    <HighlightedInline text={cell} glossaryTerms={glossaryTerms} enabled={highlightEnabled} />
                                                                </th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {block.rows.slice(1).map((row, ri) => (
                                                            <tr
                                                                key={ri}
                                                                className="border-b border-border/30 last:border-0"
                                                            >
                                                                {row.map((cell, ci) => (
                                                                    <td
                                                                        key={ci}
                                                                        className="px-3 py-2 text-foreground/80"
                                                                    >
                                                                        <HighlightedInline text={cell} glossaryTerms={glossaryTerms} enabled={highlightEnabled} />
                                                                    </td>
                                                                ))}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </>
                                            )}
                                        </table>
                                    </div>
                                );

                            case 'blockquote':
                                return (
                                    <blockquote
                                        key={idx}
                                        className="my-2 border-l-[3px] border-primary/30 bg-muted/20 py-2 pl-4 pr-3 text-[0.88rem] italic leading-[1.7] text-foreground/70 sm:text-[0.93rem]"
                                    >
                                        <HighlightedInline text={block.content} glossaryTerms={glossaryTerms} enabled={highlightEnabled} />
                                    </blockquote>
                                );

                            default:
                                return null;
                        }
                    })}
                </div>

                {/* Page number footer */}
                <div className="mt-8 flex justify-center">
                    <span
                        className="text-xs tabular-nums text-muted-foreground/60"
                        style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}
                    >
                        — {pageNumber} —
                    </span>
                </div>
            </div>
        </div>
    );
}
