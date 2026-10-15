import { router, usePage } from '@inertiajs/react';
import { Bell, CheckCheck, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ReminderNotification } from '@/types';

export function ReminderBell() {
    const { auth, reminders = [] } = usePage().props as {
        auth: { user?: { role: string } };
        reminders?: ReminderNotification[];
    };

    if (auth.user?.role !== 'mahasiswa') {
        return null;
    }

    const unreadCount = reminders.length;

    const handleMarkOne = (id: number) => {
        router.put(
            `/mahasiswa/reminders/${id}/read`,
            {},
            {
                preserveScroll: true,
                preserveState: true,
            },
        );
    };

    const handleMarkAll = () => {
        router.put(
            '/mahasiswa/reminders/read-all',
            {},
            {
                preserveScroll: true,
                preserveState: true,
            },
        );
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground"
                    aria-label="Notifikasi Membaca"
                >
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-xs animate-in zoom-in-50">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-80 max-w-[90vw] p-2">
                <div className="flex items-center justify-between px-2 py-1.5">
                    <DropdownMenuLabel className="p-0 text-sm font-semibold">
                        Pengingat Membaca
                    </DropdownMenuLabel>
                    {unreadCount > 0 && (
                        <button
                            type="button"
                            onClick={handleMarkAll}
                            className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                        >
                            <CheckCheck className="h-3 w-3" />
                            Tandai semua
                        </button>
                    )}
                </div>

                <DropdownMenuSeparator />

                {unreadCount === 0 ? (
                    <div className="py-6 text-center text-xs text-muted-foreground">
                        <Bell className="mx-auto mb-2 h-6 w-6 opacity-40" />
                        Tidak ada pengingat baru.
                    </div>
                ) : (
                    <div className="max-h-72 space-y-1 overflow-y-auto pr-1">
                        {reminders.map((reminder) => (
                            <DropdownMenuItem
                                key={reminder.id}
                                className="flex cursor-pointer flex-col items-start gap-1 rounded-md p-2 text-xs focus:bg-muted"
                                onClick={() => handleMarkOne(reminder.id)}
                            >
                                <div className="flex w-full items-start justify-between gap-2">
                                    <p className="line-clamp-3 leading-relaxed text-foreground">
                                        {reminder.pesan}
                                    </p>
                                </div>
                                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    Klik untuk tandai selesai
                                </span>
                            </DropdownMenuItem>
                        ))}
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
