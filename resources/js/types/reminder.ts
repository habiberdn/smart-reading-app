export interface ReminderNotification {
    id: number;
    assignment_id?: number | null;
    type: 'warning' | 'suggestion' | 'praise' | 'reminder';
    trigger_rule: string;
    pesan: string;
    created_at: string;
}
