<?php

use App\Models\User;
use App\Models\Classroom;
use App\Models\ReadingAssignment;
use App\Models\ReadingProgress;
use Inertia\Testing\AssertableInertia as Assert;

test('dosen dashboard renders correctly and lists their own assignments dynamically', function () {
    // 1. Create a Lecturer
    $dosen = User::create([
        'name' => 'Dr. Jane Doe',
        'username' => 'janedoe',
        'password' => bcrypt('password'),
        'role' => 'dosen',
    ]);

    // 2. Create another Lecturer to test isolation
    $otherDosen = User::create([
        'name' => 'Prof. John Smith',
        'username' => 'johnsmith',
        'password' => bcrypt('password'),
        'role' => 'dosen',
    ]);

    // 3. Create Classrooms
    $classroom = Classroom::create([
        'dosen_id' => $dosen->id,
        'name' => 'Advanced AI Class',
        'semester' => 3,
        'kode_kelas' => 'AI-301',
        'is_active' => true,
    ]);

    $otherClassroom = Classroom::create([
        'dosen_id' => $otherDosen->id,
        'name' => 'Intro to Python',
        'semester' => 1,
        'kode_kelas' => 'PY-101',
        'is_active' => true,
    ]);

    // 4. Create Students and associate them with classrooms
    $student1 = User::create([
        'name' => 'Alice',
        'username' => 'alice',
        'password' => bcrypt('password'),
        'role' => 'mahasiswa',
    ]);
    $student2 = User::create([
        'name' => 'Bob',
        'username' => 'bob',
        'password' => bcrypt('password'),
        'role' => 'mahasiswa',
    ]);

    $classroom->mahasiswa()->attach($student1->id, ['joined_at' => now()]);
    $classroom->mahasiswa()->attach($student2->id, ['joined_at' => now()]);

    // 5. Create Assignments
    $assignment1 = ReadingAssignment::create([
        'classroom_id' => $classroom->id,
        'dosen_id' => $dosen->id,
        'judul' => 'Neural Networks Basics',
        'deskripsi' => 'Read this and summarize',
        'file_path' => 'assignments/nn.pdf',
        'file_type' => 'pdf',
        'total_halaman' => 10,
        'estimasi_durasi' => 30,
        'tingkat_kesulitan' => 'easy',
        'is_published' => true,
        'published_at' => now(),
    ]);

    // Assignment for another lecturer
    $otherAssignment = ReadingAssignment::create([
        'classroom_id' => $otherClassroom->id,
        'dosen_id' => $otherDosen->id,
        'judul' => 'Variables and Loops',
        'deskripsi' => 'Basic programming',
        'file_path' => 'assignments/py.pdf',
        'file_type' => 'pdf',
        'total_halaman' => 5,
        'estimasi_durasi' => 15,
        'tingkat_kesulitan' => 'easy',
        'is_published' => true,
        'published_at' => now(),
    ]);

    // 6. Create progress records for assignment 1
    // Student 1 has completed the assignment (100% progress)
    ReadingProgress::create([
        'assignment_id' => $assignment1->id,
        'mahasiswa_id' => $student1->id,
        'status' => 'completed',
        'halaman_sekarang' => 10,
        'persentase' => 100,
        'total_durasi_detik' => 1800,
    ]);

    // Student 2 has partially read it (50% progress)
    ReadingProgress::create([
        'assignment_id' => $assignment1->id,
        'mahasiswa_id' => $student2->id,
        'status' => 'in_progress',
        'halaman_sekarang' => 5,
        'persentase' => 50,
        'total_durasi_detik' => 900,
    ]);

    // Authenticate and fetch Dosen Dashboard
    $response = $this->actingAs($dosen)
        ->get(route('dosen.dashboard'));

    $response->assertOk();

    // Assert that the dashboard has the assignments prop
    $response->assertInertia(fn (Assert $page) => $page
        ->component('dosen/dashboard')
        ->has('assignments', 1) // Only 1 assignment (the lecturer's own assignment)
        ->where('assignments.0.title', 'Neural Networks Basics')
        ->where('assignments.0.completionRate', 50) // 1 out of 2 students completed = 50%
        ->where('assignments.0.averageProgress', 75) // (100 + 50) / 2 = 75%
        ->where('assignments.0.classroomKode', 'AI-301')
    );
});

test('dosen classroom details page lists its reading assignments with complete details', function () {
    $dosen = User::create([
        'name' => 'Dr. Jane Doe',
        'username' => 'janedoe_details',
        'password' => bcrypt('password'),
        'role' => 'dosen',
    ]);

    $classroom = Classroom::create([
        'dosen_id' => $dosen->id,
        'name' => 'Advanced AI Class',
        'semester' => 3,
        'kode_kelas' => 'AI-301',
        'is_active' => true,
    ]);

    $assignment = ReadingAssignment::create([
        'classroom_id' => $classroom->id,
        'dosen_id' => $dosen->id,
        'judul' => 'Neural Networks Basics',
        'deskripsi' => 'Read this and summarize',
        'file_path' => 'assignments/nn.pdf',
        'file_type' => 'pdf',
        'total_halaman' => 10,
        'estimasi_durasi' => 30,
        'tingkat_kesulitan' => 'easy',
        'is_published' => true,
        'published_at' => now(),
        'deadline' => now()->addDays(2),
    ]);

    $response = $this->actingAs($dosen)
        ->get(route('dosen.classDetails', $classroom->kode_kelas));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('dosen/classroom/details')
        ->has('classroom.reading_assignments', 1)
        ->where('classroom.reading_assignments.0.judul', 'Neural Networks Basics')
        ->where('classroom.reading_assignments.0.file_path', 'nn.pdf')
        ->where('classroom.reading_assignments.0.deadline', $assignment->deadline->format('Y-m-d'))
        ->where('classroom.reading_assignments.0.tingkat_kesulitan', 'easy')
    );
});
