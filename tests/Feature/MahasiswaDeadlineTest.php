<?php

use App\Models\User;
use App\Models\Classroom;
use App\Models\ReadingAssignment;
use App\Models\ReadingProgress;
use Inertia\Testing\AssertableInertia as Assert;

test('mahasiswa dashboard lists assignment with correct overdue status', function () {
    // 1. Create a student and a lecturer
    $dosen = User::create([
        'name' => 'Dr. Jane Doe',
        'username' => 'janedoe_dl',
        'password' => bcrypt('password'),
        'role' => 'dosen',
    ]);
    
    $student = User::create([
        'name' => 'Alice',
        'username' => 'alice_dl',
        'password' => bcrypt('password'),
        'role' => 'mahasiswa',
    ]);

    // 2. Create classroom
    $classroom = Classroom::create([
        'dosen_id' => $dosen->id,
        'name' => 'Deadline Test Class',
        'semester' => 2,
        'kode_kelas' => 'DL-201',
        'is_active' => true,
    ]);

    $classroom->mahasiswa()->attach($student->id, ['joined_at' => now()]);

    // 3. Create assignments (one overdue, one not overdue)
    $overdueAssignment = ReadingAssignment::create([
        'classroom_id' => $classroom->id,
        'dosen_id' => $dosen->id,
        'judul' => 'Past Due Task',
        'deskripsi' => 'This deadline has passed',
        'file_path' => 'assignments/past.pdf',
        'file_type' => 'pdf',
        'total_halaman' => 5,
        'estimasi_durasi' => 15,
        'tingkat_kesulitan' => 'easy',
        'is_published' => true,
        'published_at' => now()->subDays(5),
        'deadline' => now()->subDays(1), // Past deadline
    ]);

    $futureAssignment = ReadingAssignment::create([
        'classroom_id' => $classroom->id,
        'dosen_id' => $dosen->id,
        'judul' => 'Future Task',
        'deskripsi' => 'This deadline is in the future',
        'file_path' => 'assignments/future.pdf',
        'file_type' => 'pdf',
        'total_halaman' => 10,
        'estimasi_durasi' => 30,
        'tingkat_kesulitan' => 'easy',
        'is_published' => true,
        'published_at' => now(),
        'deadline' => now()->addDays(5), // Future deadline
    ]);

    // 4. Authenticate as student and view dashboard
    $response = $this->actingAs($student)
        ->get(route('mahasiswa.dashboard'));

    $response->assertOk();

    // Verify Inertia response props contain the assignments with correct is_overdue values
    $response->assertInertia(fn (Assert $page) => $page
        ->component('mahasiswa/dashboard')
        ->has('assignments', 2)
        ->where('assignments.0.judul', 'Past Due Task')
        ->where('assignments.0.is_overdue', true)
        ->where('assignments.1.judul', 'Future Task')
        ->where('assignments.1.is_overdue', false)
    );
});

test('non-joined students can read published assignments and see them in recommendations without deadline', function () {
    // 1. Create a student and a lecturer
    $dosen = User::create([
        'name' => 'Dr. Jane Doe',
        'username' => 'janedoe_ext',
        'password' => bcrypt('password'),
        'role' => 'dosen',
    ]);
    
    $student = User::create([
        'name' => 'Bob',
        'username' => 'bob_ext',
        'password' => bcrypt('password'),
        'role' => 'mahasiswa',
    ]);

    // 2. Create classroom (student does NOT join)
    $classroom = Classroom::create([
        'dosen_id' => $dosen->id,
        'name' => 'AI Deep Learning',
        'semester' => 4,
        'kode_kelas' => 'AI-401',
        'is_active' => true,
    ]);

    // 3. Create published assignment with a deadline
    $assignment = ReadingAssignment::create([
        'classroom_id' => $classroom->id,
        'dosen_id' => $dosen->id,
        'judul' => 'Transformers Paper',
        'deskripsi' => 'Read attention mechanisms',
        'file_path' => 'assignments/transformers.pdf',
        'file_type' => 'pdf',
        'total_halaman' => 15,
        'estimasi_durasi' => 45,
        'tingkat_kesulitan' => 'hard',
        'is_published' => true,
        'published_at' => now(),
        'deadline' => now()->addDays(3),
    ]);

    // 4. Verify student can read it despite not joining the class
    $response = $this->actingAs($student)
        ->get(route('reading.workspace', $assignment->id));

    $response->assertOk();

    // 5. Verify the assignment appears in recommendations but without deadline
    $dashboardResponse = $this->actingAs($student)
        ->get(route('mahasiswa.dashboard'));

    $dashboardResponse->assertOk();
    $dashboardResponse->assertInertia(fn (Assert $page) => $page
        ->component('mahasiswa/dashboard')
        // Recommendation is shown
        ->has('recommendations', 1)
        ->where('recommendations.0.assignment.judul', 'Transformers Paper')
        // Deadline is null for non-members
        ->where('recommendations.0.assignment.deadline', null)
    );

    // 5.5 Join classroom and verify it is excluded from recommendations (assigned tasks are not recommended)
    $classroom->mahasiswa()->attach($student->id, ['joined_at' => now()]);
    $dashboardResponseJoined = $this->actingAs($student)
        ->get(route('mahasiswa.dashboard'));
    $dashboardResponseJoined->assertInertia(fn (Assert $page) => $page
        ->component('mahasiswa/dashboard')
        ->has('recommendations', 0)
    );
    $classroom->mahasiswa()->detach($student->id);

    // 6. Save reading progress as student
    ReadingProgress::updateOrCreate([
        'assignment_id' => $assignment->id,
        'mahasiswa_id' => $student->id,
    ], [
        'status' => 'in_progress',
        'halaman_sekarang' => 3,
        'persentase' => 20,
        'total_durasi_detik' => 300,
    ]);

    // 7. Verify lecturer can see the non-joined student's progress with '(Luar Kelas)' indicator
    $classroomResponse = $this->actingAs($dosen)
        ->get(route('dosen.classDetails', $classroom->kode_kelas));

    $classroomResponse->assertOk();
    $classroomResponse->assertInertia(fn (Assert $page) => $page
        ->component('dosen/classroom/details')
        ->has('students', 1)
        ->where('students.0.name', 'Bob (Luar Kelas)')
        ->where('students.0.readingProgress', '20%')
    );
});

test('mahasiswa can access assignments and explore pages based on class membership', function () {
    $student = User::create([
        'name' => 'Alice',
        'username' => 'alice_catalog',
        'password' => bcrypt('password'),
        'role' => 'mahasiswa',
    ]);

    $dosen = User::create([
        'name' => 'Dr. Jane Doe',
        'username' => 'janedoe_catalog',
        'password' => bcrypt('password'),
        'role' => 'dosen',
    ]);

    $classroom = Classroom::create([
        'dosen_id' => $dosen->id,
        'name' => 'AI Class',
        'semester' => 3,
        'kode_kelas' => 'AI-CLASS',
        'is_active' => true,
    ]);

    $assignment = ReadingAssignment::create([
        'classroom_id' => $classroom->id,
        'dosen_id' => $dosen->id,
        'judul' => 'Machine Learning Paper',
        'file_path' => 'assignments/ml.pdf',
        'file_type' => 'pdf',
        'total_halaman' => 10,
        'is_published' => true,
    ]);

    // 1. Visited assignments page (since she hasn't joined the class, it should be empty)
    $response = $this->actingAs($student)
        ->get(route('assignments'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('mahasiswa/assignment/index')
        ->has('assignments', 0)
    );

    // 2. Visited explore page (since she hasn't joined, it should contain the assignment)
    $exploreResponse = $this->actingAs($student)
        ->get(route('explore'));

    $exploreResponse->assertOk();
    $exploreResponse->assertInertia(fn (Assert $page) => $page
        ->component('mahasiswa/explore/index')
        ->has('assignments', 1)
        ->where('assignments.0.judul', 'Machine Learning Paper')
    );

    // 3. Join the classroom and verify the switch
    $classroom->mahasiswa()->attach($student->id, ['joined_at' => now()]);

    // Visited assignments (should now contain the assignment)
    $responseJoined = $this->actingAs($student)
        ->get(route('assignments'));
    $responseJoined->assertInertia(fn (Assert $page) => $page
        ->component('mahasiswa/assignment/index')
        ->has('assignments', 1)
        ->where('assignments.0.judul', 'Machine Learning Paper')
    );

    // Visited explore (should now be empty)
    $exploreResponseJoined = $this->actingAs($student)
        ->get(route('explore'));
    $exploreResponseJoined->assertInertia(fn (Assert $page) => $page
        ->component('mahasiswa/explore/index')
        ->has('assignments', 0)
    );
});
