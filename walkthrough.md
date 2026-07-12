# Walkthrough: Dynamic Classroom & PDF Reading Workflow (Dosen & Mahasiswa)

I have implemented the complete end-to-end workflow for adding, parsing, reading, and tracking assignments as described in `READFLOW.txt`.

## Changes Made

### 1. Database Schema
- **Migration**: [2026_06_30_181100_add_nlp_metrics_to_reading_assignments_table.php](file:///home/rdn/Project/smart-reading-app/database/migrations/2026_06_30_181100_add_nlp_metrics_to_reading_assignments_table.php)
  - Added schema columns to table `reading_assignments` for `content`, `word_count`, `sentence_count`, `average_sentence_length`, `technical_word_count`, and `difficulty_score`.
- **Model**: [ReadingAssignment.php](file:///home/rdn/Project/smart-reading-app/app/Models/ReadingAssignment.php)
  - Added new columns to `$fillable` array.

### 2. Backend Controllers for Student Flow
- **Controller**: [MahasiswaController.php](file:///home/rdn/Project/smart-reading-app/app/Http/Controllers/MahasiswaController.php)
  - `dashboard()`: Queries classrooms, enrolled class counts, pending assignments, and reading history statistics (e.g. books, articles, papers counts, and average reading difficulty).
  - `joinClass()`: Enrolls the student in a classroom based on unique `kode_kelas` code verification.
  - `saveProgress()`: Updates active reading time, tracks maximum page scroll percentage, checks if completion rate is $\ge 95\%$ to mark status as `completed`, and records daily reading activity for streak updates.
- **Controller**: [ReadingController.php](file:///home/rdn/Project/smart-reading-app/app/Http/Controllers/ReadingController.php)
  - `show()`: Resolves a reading session workspace after verifying enrollment bounds, building the dynamic statistics envelope payload.

### 3. Backend Controllers for Assignment Management
- **Controller**: [ReadingAssignmentController.php](file:///home/rdn/Project/smart-reading-app/app/Http/Controllers/ReadingAssignmentController.php)
  - `store()`: Receives the uploaded PDF file, stores it locally, extracts the raw text content, and performs standard NLP calculations (word counts, sentence segmentations, technical vocabulary detection).
  - Calculates the difficulty rating based on the formula:
    $$\text{difficulty\_score} = (\text{average\_sentence\_length} \times 0.4) + (\text{technical\_word\_count} \times 0.6)$$
  - `destroy()`: Allows lecturers to delete reading assignments from their classrooms.

### 4. Route Mappings
- **File**: [web.php](file:///home/rdn/Project/smart-reading-app/routes/web.php)
  - Activated route paths for the student dashboard, class joining, reading workspaces, and assignment uploads/deletions.

### 5. Frontend Pages and Components
- **File**: [dashboard.tsx](file:///home/rdn/Project/smart-reading-app/resources/js/pages/mahasiswa/dashboard.tsx)
  - Built a comprehensive dashboard UI listing enrolled classes, active reading assignments, statistics cards, and a class-joining form.
- **File**: [details.tsx](file:///home/rdn/Project/smart-reading-app/resources/js/pages/dosen/classroom/details.tsx)
  - Submits the raw file stream on assignment creation and deletes assignments via active controller requests.
- **File**: [reading_workspace.tsx](file:///home/rdn/Project/smart-reading-app/resources/js/pages/dosen/classroom/reading_workspace.tsx)
  - Activated student session tracking:
    - **Anti-Idle Check**: Detects user actions (mouse motion, scroll, clicks, keypresses) and pauses the workspace tracker if no activity is detected for 2 minutes.
    - **Database Auto-Save**: Periodically saves reading time and scroll-based progress percentage to `/mahasiswa/read/{id}/progress` every 10 seconds of active reading.

## Verification Results
- All PHP routing tables successfully compiled and verified using `php artisan route:list`.
- Verified TypeScript codebase with 0 build or compiler type-safety errors via `npm run types:check`.
