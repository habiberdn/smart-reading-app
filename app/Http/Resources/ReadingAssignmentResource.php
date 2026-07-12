<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Auth;
use App\Models\ReadingProgress;

class ReadingAssignmentResource extends JsonResource
{
    // Prevent root wrapping in collection responses
    public static $wrap = null;

    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $userId = Auth::id();
        
        // Find or instantiate progress without saving to DB (firstOrNew instead of firstOrCreate)
        $progress = ReadingProgress::firstOrNew([
            'assignment_id' => $this->id,
            'mahasiswa_id'  => $userId,
        ], [
            'status'             => 'not_started',
            'halaman_sekarang'   => 0,
            'persentase'         => 0.00,
            'total_durasi_detik' => 0,
        ]);

        return [
            'id'                  => $this->id,
            'judul'               => $this->judul,
            'deskripsi'           => $this->deskripsi,
            'classroom_name'      => $this->classroom->name ?? 'Tidak diketahui',
            'dosen_name'          => $this->classroom->dosen->name ?? 'Tidak diketahui',
            'tingkat_kesulitan'   => $this->tingkat_kesulitan,
            'estimasi_durasi'     => $this->estimasi_durasi,
            'total_halaman'       => $this->total_halaman,
            'deadline'            => $this->deadline ? $this->deadline->format('d-m-Y') : 'Tanpa Batas',
            'is_overdue'          => $this->isOverdue(),
            'is_classroom_member' => $this->is_classroom_member ?? true, // Default to true if not specified
            'progress'            => [
                'status'             => $progress->status,
                'persentase'         => $progress->persentase,
                'total_durasi_detik' => $progress->total_durasi_detik,
                'halaman_sekarang'   => $progress->halaman_sekarang,
            ]
        ];
    }
}
