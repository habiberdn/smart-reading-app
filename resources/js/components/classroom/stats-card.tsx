import { BarChart3 } from 'lucide-react';
import type { ReactNode } from 'react';

export default function StatCard({
    title,
    value,
    icon,
    trend = false,
    accent = 'primary',
}: {
    title: string;
    value: string;
    icon: ReactNode;
    trend?: boolean;
    accent?: string;
}) {
    const iconBgMap: Record<string, string> = {
        primary: 'bg-primary/10',
        emerald: 'bg-emerald-50',
        cyan: 'bg-cyan-50',
        amber: 'bg-amber-50',
    };

    return (
        <div className="relative flex items-center justify-between overflow-hidden rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">
                    {title}
                </span>
                <span className="text-2xl font-bold text-foreground">
                    {value}
                </span>
            </div>
            <div
                className={`rounded-lg p-2.5 ${iconBgMap[accent] || 'bg-muted'}`}
            >
                {icon}
            </div>
            {trend && (
                <div className="absolute right-12 bottom-4 opacity-10">
                    <BarChart3 className="h-12 w-12 text-cyan-500" />
                </div>
            )}
        </div>
    );
}
