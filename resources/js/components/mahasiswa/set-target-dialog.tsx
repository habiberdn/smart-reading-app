import { useForm } from '@inertiajs/react';
import { Target, Check } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ReadingTarget } from '@/types';

interface SetTargetDialogProps {
    currentTarget?: ReadingTarget;
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export default function SetTargetDialog({
    currentTarget,
    trigger,
    open: controlledOpen,
    onOpenChange: setControlledOpen,
}: SetTargetDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    const setOpen = isControlled ? setControlledOpen! : setInternalOpen;

    const { data, setData, put, processing, errors } = useForm({
        target_type: currentTarget?.target_type ?? 'daily',
        daily_target_minutes: currentTarget?.daily_target_minutes || 30,
        weekly_target_minutes: currentTarget?.weekly_target_minutes || 150,
    });

    useEffect(() => {
        if (open) {
            setData({
                target_type: currentTarget?.target_type ?? 'daily',
                daily_target_minutes: currentTarget?.daily_target_minutes || 30,
                weekly_target_minutes: currentTarget?.weekly_target_minutes || 150,
            });
        }
    }, [currentTarget, open]);

    const dailyPresets = [15, 30, 45, 60];
    const weeklyPresets = [60, 120, 180, 300];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put('/mahasiswa/target', {
            preserveScroll: true,
            onSuccess: () => {
                setOpen(false);
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {trigger ? (
                <DialogTrigger asChild>{trigger}</DialogTrigger>
            ) : (
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1.5">
                        <Target className="h-4 w-4" />
                        {currentTarget?.daily_target_minutes || currentTarget?.weekly_target_minutes
                            ? 'Ubah Target'
                            : 'Atur Target'}
                    </Button>
                </DialogTrigger>
            )}

            <DialogContent className="sm:max-w-md">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5 text-primary" />
                            Atur Target Membaca
                        </DialogTitle>
                        <DialogDescription>
                            Tentukan komitmen waktu membaca Anda per hari atau per minggu untuk membangun kebiasaan literasi.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-5 py-4">
                        {/* Pilihan Jenis Target */}
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Tipe Target
                            </Label>
                            <div className="grid grid-cols-3 gap-2">
                                {(
                                    [
                                        { id: 'daily', label: 'Harian' },
                                        { id: 'weekly', label: 'Mingguan' },
                                        { id: 'both', label: 'Keduanya' },
                                    ] as const
                                ).map((item) => (
                                    <button
                                        type="button"
                                        key={item.id}
                                        onClick={() => setData('target_type', item.id)}
                                        className={`flex items-center justify-center rounded-lg border p-2.5 text-xs font-medium transition-all ${
                                            data.target_type === item.id
                                                ? 'border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary'
                                                : 'border-border bg-background text-muted-foreground hover:bg-muted'
                                        }`}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Input Target Harian */}
                        {(data.target_type === 'daily' || data.target_type === 'both') && (
                            <div className="space-y-2.5 rounded-lg border bg-muted/20 p-3">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="daily_target_minutes" className="text-sm font-semibold">
                                        Target Harian (Menit)
                                    </Label>
                                    <span className="text-xs text-muted-foreground">
                                        {data.daily_target_minutes} menit/hari
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {dailyPresets.map((mins) => (
                                        <button
                                            type="button"
                                            key={mins}
                                            onClick={() => setData('daily_target_minutes', mins)}
                                            className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                                                data.daily_target_minutes === mins
                                                    ? 'bg-primary text-primary-foreground font-semibold'
                                                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                            }`}
                                        >
                                            {mins} mnt
                                        </button>
                                    ))}
                                </div>
                                <Input
                                    id="daily_target_minutes"
                                    type="number"
                                    min={1}
                                    max={1440}
                                    value={data.daily_target_minutes || ''}
                                    onChange={(e) =>
                                        setData('daily_target_minutes', e.target.value === '' ? 0 : parseInt(e.target.value) || 0)
                                    }
                                    placeholder="Contoh: 30"
                                    required={data.target_type === 'daily' || data.target_type === 'both'}
                                />
                                {errors.daily_target_minutes && (
                                    <p className="text-xs text-destructive">{errors.daily_target_minutes}</p>
                                )}
                            </div>
                        )}

                        {/* Input Target Mingguan */}
                        {(data.target_type === 'weekly' || data.target_type === 'both') && (
                            <div className="space-y-2.5 rounded-lg border bg-muted/20 p-3">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="weekly_target_minutes" className="text-sm font-semibold">
                                        Target Mingguan (Menit)
                                    </Label>
                                    <span className="text-xs text-muted-foreground">
                                        {data.weekly_target_minutes} menit/minggu
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {weeklyPresets.map((mins) => (
                                        <button
                                            type="button"
                                            key={mins}
                                            onClick={() => setData('weekly_target_minutes', mins)}
                                            className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                                                data.weekly_target_minutes === mins
                                                    ? 'bg-primary text-primary-foreground font-semibold'
                                                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                            }`}
                                        >
                                            {mins >= 60 ? `${mins / 60} jam` : `${mins} mnt`}
                                        </button>
                                    ))}
                                </div>
                                <Input
                                    id="weekly_target_minutes"
                                    type="number"
                                    min={1}
                                    max={10080}
                                    value={data.weekly_target_minutes || ''}
                                    onChange={(e) =>
                                        setData('weekly_target_minutes', e.target.value === '' ? 0 : parseInt(e.target.value) || 0)
                                    }
                                    placeholder="Contoh: 150"
                                    required={data.target_type === 'weekly' || data.target_type === 'both'}
                                />
                                {errors.weekly_target_minutes && (
                                    <p className="text-xs text-destructive">{errors.weekly_target_minutes}</p>
                                )}
                            </div>
                        )}
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={processing}
                        >
                            Batal
                        </Button>
                        <Button type="submit" disabled={processing} className="gap-1.5">
                            <Check className="h-4 w-4" />
                            Simpan Target
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
