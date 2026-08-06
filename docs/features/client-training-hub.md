# Client Training Hub

## Purpose

A client-facing microlearning library: short security awareness courses composed of lessons, with per-user enrollment and progress tracking. Clients browse available courses, enroll, and complete lessons to build a security-aware workforce.

Primary users: client employees, MSP security trainer

Business impact: Medium

Category: security

## Permissions

| Action              | Roles                         |
| ------------------- | ----------------------------- |
| List courses        | All authenticated org members |
| View course         | All authenticated org members |
| Enroll in course    | All authenticated org members |
| Track own progress  | All authenticated org members |
| Create course       | All authenticated org members |
| Update course       | All authenticated org members |
| Delete course       | admin, super_admin            |
| Manage lessons      | All authenticated org members |
| View my enrollments | Own enrollments only          |

## Routes

### Portal Routes

| Route                      | Description                            |
| -------------------------- | -------------------------------------- |
| `GET /portal/training-hub` | Browse available microlearning courses |

### Admin Routes

| Route                     | Description                    |
| ------------------------- | ------------------------------ |
| `GET /admin/training-hub` | Training Hub course management |

### API Routes

| Method | Endpoint                                    | Description                |
| ------ | ------------------------------------------- | -------------------------- |
| GET    | `/api/v1/training-hub/my-courses`           | Current user's enrollments |
| GET    | `/api/v1/training-hub/courses`              | List courses (paginated)   |
| POST   | `/api/v1/training-hub/courses`              | Create course              |
| GET    | `/api/v1/training-hub/courses/:id`          | Get course                 |
| PATCH  | `/api/v1/training-hub/courses/:id`          | Update course              |
| DELETE | `/api/v1/training-hub/courses/:id`          | Delete course              |
| POST   | `/api/v1/training-hub/courses/:id/enroll`   | Enroll current user        |
| POST   | `/api/v1/training-hub/courses/:id/progress` | Update progress (0-100)    |
| GET    | `/api/v1/training-hub/lessons`              | List lessons for a course  |
| POST   | `/api/v1/training-hub/lessons`              | Create lesson              |
| GET    | `/api/v1/training-hub/lessons/:id`          | Get lesson                 |
| PATCH  | `/api/v1/training-hub/lessons/:id`          | Update lesson              |
| DELETE | `/api/v1/training-hub/lessons/:id`          | Delete lesson              |

## Data Model

### training_courses

| Column            | Type        | Constraints                      | Description                        |
| ----------------- | ----------- | -------------------------------- | ---------------------------------- |
| id                | uuid        | PK, default gen_random_uuid()    | Unique identifier                  |
| organization_id   | uuid        | FK → organizations(id), NOT NULL | Tenant scoping                     |
| title             | text        | NOT NULL                         | Course title                       |
| description       | text        |                                  | Course description                 |
| category          | text        | default 'security'               | Category label                     |
| difficulty        | text        | default 'beginner'               | beginner / intermediate / advanced |
| estimated_minutes | integer     | default 15                       | Estimated completion time          |
| status            | text        | default 'draft'                  | draft / published                  |
| passing_score     | integer     | default 80                       | Pass threshold (0-100)             |
| created_by        | uuid        | FK → auth.users(id)              | Who created the course             |
| created_at        | timestamptz | default now()                    | Creation timestamp                 |
| updated_at        | timestamptz | default now()                    | Last update timestamp              |

### training_lessons

| Column      | Type        | Constraints                         | Description         |
| ----------- | ----------- | ----------------------------------- | ------------------- |
| id          | uuid        | PK, default gen_random_uuid()       | Unique identifier   |
| course_id   | uuid        | FK → training_courses(id), NOT NULL | Parent course       |
| title       | text        | NOT NULL                            | Lesson title        |
| content     | text        |                                     | Lesson body         |
| lesson_type | text        | default 'text'                      | text / video / quiz |
| sort_order  | integer     | default 0                           | Display order       |
| created_at  | timestamptz | default now()                       | Creation timestamp  |

### training_enrollments

| Column           | Type        | Constraints                         | Description                        |
| ---------------- | ----------- | ----------------------------------- | ---------------------------------- |
| id               | uuid        | PK, default gen_random_uuid()       | Unique identifier                  |
| course_id        | uuid        | FK → training_courses(id), NOT NULL | Course being taken                 |
| user_id          | uuid        | NOT NULL                            | Enrolled user (auth.users)         |
| status           | text        | default 'enrolled'                  | enrolled / in_progress / completed |
| progress_percent | integer     | default 0                           | Completion percentage              |
| completed_at     | timestamptz |                                     | Completion timestamp               |
| enrolled_at      | timestamptz | default now()                       | Enrollment timestamp               |

## Workflows

### Browse & Enroll

1. The portal lists published courses with category, difficulty badge, and estimated minutes
2. User enrolls via `POST /courses/:id/enroll` (creates an enrollment at 0%)
3. Progress is updated via `POST /courses/:id/progress` with 0-100; at 100% status becomes `completed` and `completed_at` is set

### Course Management (admin)

1. Create courses with category/difficulty and add ordered lessons
2. Publish by setting status to `published`
3. Monitor completion via `GET /my-courses`

## Troubleshooting

| Issue                       | Resolution                                                  |
| --------------------------- | ----------------------------------------------------------- |
| Courses empty on portal     | No published courses exist for the org yet                  |
| Progress update returns 404 | Enrollment for the course/user must exist first             |
| Enroll fails                | Check `user_id` matches auth.uid() (RLS on own enrollments) |
| Delete course fails (403)   | Membership role must be `admin` or `super_admin`            |

## Release Checklist

- [ ] Migration `5302090_training_hub.sql` applied
- [ ] API routes registered at `/api/v1/training-hub` in `apps/api/src/app.ts`
- [ ] SDK module `trainingHub` exported from `packages/sdk/src/index.ts`
- [ ] Portal page at `apps/web/app/(portal)/portal/training-hub/`
- [ ] E2E tests pass: `pnpm e2e apps/web/e2e/portal/training-hub.spec.ts`
- [ ] Feature doc added to `docs/features/client-training-hub.md`
- [ ] Runbook added to `docs/runbooks/client-training-hub.md`
