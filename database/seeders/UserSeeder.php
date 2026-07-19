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
            'username' => 'UPI_SUPERADMIN',
            'password' => Hash::make('password'),
            'role' => 'superadmin',
            'remember_token' => Str::random(10),
        ]);

        User::create([
            'name' => 'Administrator',
            'username' => 'UPI_ADMIN',
            'kampus' => 'UPI',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'remember_token' => Str::random(10),
        ]);

        // 2. BUAT DATA DOSEN (Mengisi NIDN, NIM dikosongkan)
        $dataDosen = [
            [
                'name' => 'Prof. Dr. Sarifuddin, M.Kom',
                'username' => 'UPI_SARIFUDDIN',
                'kampus' => 'UPI',

                'nidn' => '1023048501',
                'program_studi' => 'Sistem Informasi',
            ],
            [
                'name' => 'Dr. Erika Amelia, S.Kom, M.T',
                'username' => 'UPI_ERIKA',
                'kampus' => 'UPI',

                'nidn' => '1008128902',
                'program_studi' => 'Teknik Informatika',
            ],
        ];

        foreach ($dataDosen as $dosen) {
            User::create([
                'name' => $dosen['name'],
                'username' => $dosen['username'],
                'kampus' => $dosen['kampus'],
                'password' => Hash::make('password'),
                'role' => 'dosen',
                'nidn' => $dosen['nidn'],
                'nim' => null,
                'program_studi' => $dosen['program_studi'],
            ]);
        }

        // 3. BUAT DATA MAHASISWA / ALUMNI (Mengisi NIM, NIDN dikosongkan)
        $dataMahasiswa = [
            [
                'name' => 'Rahmat Hidayat',
                'username' => 'UPI_2210115261001',
                'nim' => '2210115261001',
                'program_studi' => 'Teknik Informatika',
            ],
            [
                'name' => 'Siti Khadijah',
                'username' => 'UPI_2210115263025',
                'nim' => '2210115263025',
                'program_studi' => 'Sistem Informasi',
            ],
            [
                'name' => 'Andi Wijaya',
                'username' => 'UPI_2110115261099',
                'nim' => '2110115261099',
                'program_studi' => 'Sistem Komputer',
            ],
        ];

        foreach ($dataMahasiswa as $mhs) {
            User::create([
                'name' => $mhs['name'],
                'username' => $mhs['username'],
                'password' => Hash::make('password'),
                'role' => 'mahasiswa',
                'nim' => $mhs['nim'],
                'nidn' => null,
                'program_studi' => $mhs['program_studi'],
            ]);
        }
    }
}
