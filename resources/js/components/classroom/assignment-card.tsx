import { MoreHorizontal, ChevronRight } from 'lucide-react';

export default function AssignmentCard({
    title,
    dueDate,
}: {
    title: string;
    dueDate: string;
}) {
    return (
        <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground">{title}</h3>
                <button className="rounded-md bg-primary/10 p-1 text-primary hover:bg-primary/20">
                    <MoreHorizontal className="h-4 w-4" />
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4 text-xs md:grid-cols-2">
                <div>
                    <div className="mb-1 flex justify-between text-muted-foreground">
                        <span>Tingkat Pengumpulan</span>
                        <span>NaN%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div className="h-full w-[0%] bg-primary" />
                    </div>
                </div>
                <div>
                    <div className="mb-1 flex justify-between text-muted-foreground">
                        <span>Rata-rata Progress</span>
                        <span>%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div className="h-full w-[0%] bg-primary" />
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between border-t pt-3 text-xs">
                <span className="font-medium text-muted-foreground">
                    Tenggat: {dueDate}
                </span>
                <button className="flex items-center gap-0.5 font-medium text-primary hover:text-primary/80">
                    Lihat Detail <ChevronRight className="h-3.5 w-3.5" />
                </button>
            </div>
        </div>
    );
}
