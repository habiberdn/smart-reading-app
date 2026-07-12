import { Link } from '@inertiajs/react';
import {
    ArrowRight,
    Clock,
    BookOpen,
    AlertCircle,
    Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RecommendationType } from '@/types';

const difficultyConfig = {
    easy: {
        label: 'Mudah',
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        icon: '🟢',
    },
    medium: {
        label: 'Menengah',
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        icon: '🟡',
    },
    hard: {
        label: 'Tinggi',
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        icon: '🔴',
    },
} as const;

export default function RecommendationCard({
    recommendation,
    rank,
}: {
    recommendation: RecommendationType;
    rank: number;
}) {
    const { assignment, total_score, reasons, scores } = recommendation;
    const diff = difficultyConfig[assignment.tingkat_kesulitan];

    return (
        <div className="group relative rounded-xl border bg-card shadow-sm transition-all hover:border-primary/40 hover:shadow-md">
            <div className="absolute -top-2 -left-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground shadow">
                {rank}
            </div>

            <div className="p-5">
                <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2">
                            <span
                                className={cn(
                                    'rounded px-2 py-0.5 text-[11px] font-semibold',
                                    diff.bg,
                                    diff.text,
                                )}
                            >
                                {diff.icon} {diff.label}
                            </span>
                            <span className="truncate rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                                {assignment.classroom.name}
                            </span>
                        </div>
                        <h3 className="line-clamp-1 text-sm font-bold text-foreground transition-colors group-hover:text-primary">
                            {assignment.judul}
                        </h3>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary/5 px-3 py-2">
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                        <span className="font-mono text-sm font-extrabold text-primary">
                            {total_score}%
                        </span>
                    </div>
                </div>

                <div className="mb-3 grid grid-cols-4 gap-1.5">
                    {(
                        [
                            {
                                label: 'Kesulitan',
                                value: scores.difficulty,
                                color: 'bg-emerald-500',
                            },
                            {
                                label: 'Tenggat',
                                value: scores.deadline,
                                color: 'bg-amber-500',
                            },
                            {
                                label: 'Topik',
                                value: scores.similarity,
                                color: 'bg-blue-500',
                            },
                            {
                                label: 'Durasi',
                                value: scores.capacity,
                                color: 'bg-violet-500',
                            },
                        ] as const
                    ).map(({ label, value, color }) => (
                        <div key={label} className="text-center">
                            <div className="mb-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                <div
                                    className={cn(
                                        'h-full rounded-full transition-all',
                                        color,
                                    )}
                                    style={{ width: `${value}%` }}
                                />
                            </div>
                            <span className="text-[10px] font-medium text-muted-foreground">
                                {label}
                            </span>
                        </div>
                    ))}
                </div>

                {reasons.length > 0 && (
                    <div className="mb-3 space-y-1">
                        {reasons.slice(0, 2).map((reason, i) => (
                            <div
                                key={i}
                                className="flex items-start gap-1.5 text-[11px] text-muted-foreground"
                            >
                                <span className="mt-0.5 shrink-0">•</span>
                                <span>{reason}</span>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex items-center justify-between border-t pt-3 text-xs">
                    <div className="flex items-center gap-3 text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {assignment.estimasi_durasi} menit
                        </span>
                        <span className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            {assignment.total_halaman} hal
                        </span>
                        {assignment.deadline && (
                            <span className="flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                {assignment.deadline}
                            </span>
                        )}
                    </div>
                    <Link
                        href={`/read/${assignment.id}`}
                        className="flex items-center gap-0.5 font-medium text-primary transition-colors hover:text-primary/80"
                    >
                        Baca <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
