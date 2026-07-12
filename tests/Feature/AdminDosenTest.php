<?php

use App\Models\User;
use App\Models\Classroom;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected to the login page when accessing admin dashboard', function () {
    $response = $this->get(route('admin.dashboard'));
    $response->assertRedirect(route('login'));
});

test('non-admin users are unauthorized to access admin dashboard', function () {
    $mahasiswa = User::create([
        'name' => 'Alice Student',
        'username' => 'alice_student',
        'password' => bcrypt('password'),
        'role' => 'mahasiswa',
    ]);

    $dosen = User::create([
        'name' => 'Dr. Jane Lecturer',
        'username' => 'jane_lecturer',
        'password' => bcrypt('password'),
        'role' => 'dosen',
    ]);

    $this->actingAs($mahasiswa)->get(route('admin.dashboard'))->assertStatus(403);
    $this->actingAs($dosen)->get(route('admin.dashboard'))->assertStatus(403);
});

test('admin can access admin dashboard and get stats', function () {
    $admin = User::create([
        'name' => 'Admin User',
        'username' => 'admin_test',
        'password' => bcrypt('password'),
        'role' => 'admin',
    ]);

    // Create some data
    $dosen = User::create([
        'name' => 'Dosen Test',
        'username' => 'dosen_test',
        'password' => bcrypt('password'),
        'role' => 'dosen',
    ]);

    $mahasiswa = User::create([
        'name' => 'Mahasiswa Test',
        'username' => 'mhs_test',
        'password' => bcrypt('password'),
        'role' => 'mahasiswa',
    ]);

    Classroom::create([
        'dosen_id' => $dosen->id,
        'name' => 'Web Programming',
        'semester' => 4,
        'kode_kelas' => 'WEB-401',
    ]);

    $response = $this->actingAs($admin)->get(route('admin.dashboard'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('admin/dashboard')
        ->where('totalDosen', 1)
        ->where('totalMahasiswa', 1)
        ->where('totalClassrooms', 1)
        ->where('totalAssignments', 0)
    );
});

test('admin can view the lecturer management page', function () {
    $admin = User::create([
        'name' => 'Admin User',
        'username' => 'admin_test',
        'password' => bcrypt('password'),
        'role' => 'admin',
    ]);

    $dosen = User::create([
        'name' => 'Dosen 1',
        'username' => 'dosen_1',
        'password' => bcrypt('password'),
        'role' => 'dosen',
        'nidn' => '1111111111',
        'program_studi' => 'Sistem Informasi',
    ]);

    $response = $this->actingAs($admin)->get(route('admin.dosen.index'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('admin/dosen/index')
        ->has('dosenList', 1)
        ->where('dosenList.0.name', 'Dosen 1')
        ->where('dosenList.0.nidn', '1111111111')
    );
});

test('admin can create a new lecturer', function () {
    $admin = User::create([
        'name' => 'Admin User',
        'username' => 'admin_test',
        'password' => bcrypt('password'),
        'role' => 'admin',
    ]);

    $response = $this->actingAs($admin)->post(route('admin.dosen.store'), [
        'name' => 'Dr. Robert Carter',
        'username' => 'robert_carter',
        'password' => 'secretpassword123',
        'nidn' => '2222222222',
        'program_studi' => 'Teknik Informatika',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('users', [
        'name' => 'Dr. Robert Carter',
        'username' => 'robert_carter',
        'role' => 'dosen',
        'nidn' => '2222222222',
        'program_studi' => 'Teknik Informatika',
    ]);
});

test('admin can update a lecturer details', function () {
    $admin = User::create([
        'name' => 'Admin User',
        'username' => 'admin_test',
        'password' => bcrypt('password'),
        'role' => 'admin',
    ]);

    $dosen = User::create([
        'name' => 'Old Name',
        'username' => 'old_username',
        'password' => bcrypt('password'),
        'role' => 'dosen',
        'nidn' => '3333333333',
        'program_studi' => 'Old Prodi',
    ]);

    $response = $this->actingAs($admin)->put(route('admin.dosen.update', $dosen->id), [
        'name' => 'New Name',
        'username' => 'new_username',
        'nidn' => '4444444444',
        'program_studi' => 'New Prodi',
        'password' => '', // blank to keep old password
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('users', [
        'id' => $dosen->id,
        'name' => 'New Name',
        'username' => 'new_username',
        'nidn' => '4444444444',
        'program_studi' => 'New Prodi',
    ]);
});

test('admin can delete a lecturer', function () {
    $admin = User::create([
        'name' => 'Admin User',
        'username' => 'admin_test',
        'password' => bcrypt('password'),
        'role' => 'admin',
    ]);

    $dosen = User::create([
        'name' => 'Delete Me',
        'username' => 'delete_me',
        'password' => bcrypt('password'),
        'role' => 'dosen',
    ]);

    $response = $this->actingAs($admin)->delete(route('admin.dosen.destroy', $dosen->id));

    $response->assertRedirect();
    $this->assertSoftDeleted('users', [
        'id' => $dosen->id,
    ]);
});
