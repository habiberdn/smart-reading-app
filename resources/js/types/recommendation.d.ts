export interface RecommendationType {
    assignment: {
        id: number;
        judul: string;
        deskripsi: string | null;
        classroom_id: number;
        classroom: {
            id: number;
            name: string;
            kode_kelas: string;
        };
        tingkat_kesulitan: 'easy' | 'medium' | 'hard';
        estimasi_durasi: number;
        total_halaman: number;
        deadline: string | null;
        difficulty_score: number;
        word_count: number;
    };
    total_score: number;
    reasons: string[];
    scores: {
        difficulty: number;
        deadline: number;
        similarity: number;
        capacity: number;
    };
}
