export interface ReadingTarget {
    daily_target_minutes: number;
    weekly_target_minutes: number;
    target_type: 'daily' | 'weekly' | 'both';
    today_minutes: number;
    week_minutes: number;
    daily_percent: number;
    weekly_percent: number;
    daily_achieved: boolean;
    weekly_achieved: boolean;
}
