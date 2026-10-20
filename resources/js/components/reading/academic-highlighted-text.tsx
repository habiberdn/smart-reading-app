import React, { useMemo } from 'react';
import { VocabPopover, type GlossaryTerm } from './vocab-popover';

interface AcademicHighlightedTextProps {
    text: string;
    glossaryTerms: GlossaryTerm[];
    enabled?: boolean;
}

function escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function AcademicHighlightedText({
    text,
    glossaryTerms,
    enabled = true,
}: AcademicHighlightedTextProps) {
    const renderedContent = useMemo(() => {
        if (!enabled || !glossaryTerms || glossaryTerms.length === 0 || !text) {
            return text;
        }

        // Map lowercase term to GlossaryTerm object
        const termsMap = new Map<string, GlossaryTerm>();
        const sortedTerms = [...glossaryTerms]
            .filter((t) => t.term && t.term.trim().length > 1)
            .sort((a, b) => b.term.length - a.term.length); // Terpanjang didahulukan

        sortedTerms.forEach((t) => {
            termsMap.set(t.term.trim().toLowerCase(), t);
        });

        if (termsMap.size === 0) {
            return text;
        }

        const patterns = sortedTerms.map((t) => escapeRegExp(t.term.trim()));
        // Regex word boundary capturing group
        const regex = new RegExp(`\\b(${patterns.join('|')})\\b`, 'gi');

        const parts = text.split(regex);
        if (parts.length <= 1) {
            return text;
        }

        return parts.map((part, index) => {
            const lowerPart = part.toLowerCase();
            const matchedTerm = termsMap.get(lowerPart);

            if (matchedTerm) {
                return (
                    <VocabPopover term={matchedTerm} key={index}>
                        <mark
                            title={`Klik untuk melihat makna: ${matchedTerm.term}`}
                            className="inline-block cursor-pointer rounded bg-violet-100/90 px-1 py-0.5 font-medium text-violet-950 underline decoration-violet-400 decoration-dashed underline-offset-3 transition-colors hover:bg-violet-200 hover:text-violet-900 dark:bg-violet-950/60 dark:text-violet-200 dark:hover:bg-violet-900/80"
                        >
                            {part}
                        </mark>
                    </VocabPopover>
                );
            }

            return part;
        });
    }, [text, glossaryTerms, enabled]);

    return <>{renderedContent}</>;
}
