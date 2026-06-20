import { MoreHorizontal, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ClassroomCard({ className }: { className: string }) {
    return (
        <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between">
                <h3 className="text-sm font-bold text-foreground">
                    {className}
                </h3>
                <button className="text-muted-foreground hover:text-foreground">
                    <MoreHorizontal className="h-4 w-4" />
                </button>
            </div>

            <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                <div className="flex justify-between border-b py-1">
                    <span>Siswa</span>
                </div>
                <div className="flex justify-between border-b py-1">
                    <span>Tugas</span>
                </div>
                <div className="flex items-center justify-between py-1 pt-2">
                    <span className="font-medium text-primary">
                        Progress Kelas
                    </span>
                    <span className="font-bold text-primary">%</span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full w-[0%] bg-primary" />
                </div>
            </div>

            <div className="mt-2 flex flex-col gap-2">
                <Button variant="outline" className="h-8 w-full py-1.5 text-xs">
                    + Tugas Baru
                </Button>
                <Button
                    variant="outline"
                    className="h-8 w-full gap-1 py-1.5 text-xs"
                >
                    Lihat Kelas <ChevronRight className="h-3 w-3" />
                </Button>
            </div>
        </div>
    );
}
