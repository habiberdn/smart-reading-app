import { router, usePage } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import type { ReminderNotification } from '@/types';

export function useReminders(): void {
    const pageProps = usePage().props as { reminders?: ReminderNotification[] };
    const reminders = pageProps.reminders;
    const notifiedIdsRef = useRef<Set<number>>(new Set());

    useEffect(() => {
        if (!reminders || reminders.length === 0) {
            return;
        }

        const unnotified = reminders.filter((r) => !notifiedIdsRef.current.has(r.id));
        if (unnotified.length === 0) {
            return;
        }

        unnotified.forEach((item, index) => {
            notifiedIdsRef.current.add(item.id);

            // Munculkan toast dengan delay bertahap agar tidak tumpuk langsung
            const timer = setTimeout(() => {
                toast.info(item.pesan, {
                    duration: 7000,
                    action: {
                        label: 'Tandai Dibaca',
                        onClick: () => {
                            router.put(
                                `/mahasiswa/reminders/${item.id}/read`,
                                {},
                                {
                                    preserveScroll: true,
                                    preserveState: true,
                                },
                            );
                        },
                    },
                });
            }, (index + 1) * 1200);

            return () => clearTimeout(timer);
        });
    }, [reminders]);
}
