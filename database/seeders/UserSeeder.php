<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. BUAT DATA ADMIN (Untuk Testing Login Utama)
        User::create([
            'name' => 'Administrator Utama',
            'email' => 'admin@mail.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'email_verified_at' => now(),
            'remember_token' => Str::random(10),
        ]);

        // 2. BUAT DATA DOSEN (Mengisi NIDN, NIM dikosongkan)
        $dataDosen = [
            [
                'name' => 'Prof. Dr. Sarifuddin, M.Kom',
                'email' => 'sarifuddin@upiyptk.ac.id',
                'nidn' => '1023048501',
                'program_studi' => 'Sistem Informasi',
            ],
            [
                'name' => 'Dr. Erika Amelia, S.Kom, M.T',
                'email' => 'erika.amelia@upiyptk.ac.id',
                'nidn' => '1008128902',
                'program_studi' => 'Teknik Informatika',
            ]
        ];

        foreach ($dataDosen as $dosen) {
            User::create([
                'name' => $dosen['name'],
                'email' => $dosen['email'],
                'password' => Hash::make('password'),
                'role' => 'dosen',
                'nidn' => $dosen['nidn'],
                'nim' => null, // Dipastikan null untuk dosen
                'program_studi' => $dosen['program_studi'],
                'email_verified_at' => now(),
            ]);
        }

        // 3. BUAT DATA MAHASISWA / ALUMNI (Mengisi NIM, NIDN dikosongkan)
        $dataMahasiswa = [
            [
                'name' => 'Rahmat Hidayat',
                'email' => 'rahmat.h@mail.com',
                'nim' => '2210115261001',
                'program_studi' => 'Teknik Informatika',
            ],
            [
                'name' => 'Siti Khadijah',
                'email' => 'siti.k@mail.com',
                'nim' => '2210115263025',
                'program_studi' => 'Sistem Informasi',
            ],
            [
                'name' => 'Andi Wijaya',
                'email' => 'andi.w@mail.com',
                'nim' => '2110115261099',
                'program_studi' => 'Sistem Komputer',
            ]
        ];

        foreach ($dataMahasiswa as $mhs) {
            User::create([
                'name' => $mhs['name'],
                'email' => $mhs['email'],
                'password' => Hash::make('password'),
                'role' => 'mahasiswa',
                'nim' => $mhs['nim'],
                'nidn' => null, // Dipastikan null untuk mahasiswa
                'program_studi' => $mhs['program_studi'],
                'email_verified_at' => now(),
            ]);
        }
    }
}