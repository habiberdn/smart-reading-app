import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Sparkles, BookOpen, Quote, X } from 'lucide-react';

export interface GlossaryTerm {
    id: number;
    term: string;
    definition: string;
    category?: string | null;
    context_sentence?: string | null;
    frequency?: number;
}

interface VocabPopoverProps {
    term: GlossaryTerm;
    children: React.ReactNode;
}

export function VocabPopover({ term, children }: VocabPopoverProps) {
    const [open, setOpen] = React.useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                {children}
            </PopoverTrigger>
            <PopoverContent
                className="w-80 sm:w-96 p-4 shadow-xl border-violet-200/50 dark:border-violet-900/40 bg-card"
                side="top"
                align="center"
                sideOffset={8}
            >
                <div className="space-y-3">
                    {/* Header: Term & Category */}
                    <div className="flex items-start justify-between gap-2 border-b border-muted pb-2.5">
                        <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-violet-600 dark:text-violet-400">
                                <Sparkles className="h-3.5 w-3.5" />
                                <span>Istilah Akademik</span>
                            </div>
                            <h4 className="text-base font-bold text-foreground leading-snug">
                                {term.term}
                            </h4>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                            {term.category && (
                                <Badge
                                    variant="secondary"
                                    className="text-[11px] font-medium bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/20"
                                >
                                    {term.category}
                                </Badge>
                            )}
                            {term.frequency && term.frequency > 1 && (
                                <span className="text-[10px] text-muted-foreground">
                                    Muncul {term.frequency}x
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Definisi */}
                    <div className="space-y-1">
                        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                            <BookOpen className="h-3 w-3" /> Makna Kontekstual
                        </span>
                        <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed text-justify">
                            {term.definition}
                        </p>
                    </div>

                    {/* Kalimat Konteks Asli Dokumen */}
                    {term.context_sentence && (
                        <div className="rounded-lg bg-muted/60 p-2.5 text-xs text-muted-foreground border-l-2 border-violet-500 space-y-1">
                            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1">
                                <Quote className="h-2.5 w-2.5" /> Penggunaan Dalam Teks
                            </span>
                            <p className="italic text-foreground/80 line-clamp-3 leading-relaxed">
                                &quot;{term.context_sentence}&quot;
                            </p>
                        </div>
                    )}

                    {/* Footer Tip */}
                    <div className="pt-1 flex items-center justify-between text-[10px] text-muted-foreground/70">
                        <span>Smart Reading Assistant</span>
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="hover:text-foreground text-xs font-medium cursor-pointer"
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
