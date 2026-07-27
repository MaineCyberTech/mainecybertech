# Training Hub

**Category:** Learning
**API Routes:** `apps/api/src/routes/training-hub.ts`
**SDK:** `packages/sdk/src/training-hub.ts`

## Overview

Comprehensive security awareness training platform with course management, structured lesson delivery, enrollment tracking, and progress monitoring. Designed for MSPs to manage training programs across client organizations — admins create courses and lessons, clients self-enroll and track progress through a personalized My Courses view.

## Key Features

- Course CRUD with rich metadata (title, description, category, difficulty level, estimated duration)
- Structured lesson management within courses with ordering and multiple content types
- Content types: video (embedded URL), article (markdown body), quiz (questions with answer key)
- Self-enrollment for portal users with automatic progress tracking per lesson
- My Courses view showing enrolled courses, completion percentage, and next lesson to complete
- Lesson progress updates with completion status and time spent tracking
- Course categories: phishing, password security, data protection, incident response, compliance
- Difficulty levels: beginner, intermediate, advanced
- Admin course catalog management with enrollment oversight per organization
- Course status workflow: draft, published, archived
- Paginated listings across courses, lessons, and enrollments
- Audit logging on all mutation endpoints
- RLS enforcement: courses/lessons by organization membership, enrollments by user_id

## Endpoints

| Method | Path                                               | Description                                                          |
| ------ | -------------------------------------------------- | -------------------------------------------------------------------- |
| GET    | /api/v1/training-hub/courses                       | List courses (paginated, filterable by category, difficulty, status) |
| GET    | /api/v1/training-hub/courses/:id                   | Get course with nested lessons                                       |
| POST   | /api/v1/training-hub/courses                       | Create new training course                                           |
| PATCH  | /api/v1/training-hub/courses/:id                   | Update course metadata                                               |
| DELETE | /api/v1/training-hub/courses/:id                   | Remove course and cascade-delete lessons                             |
| GET    | /api/v1/training-hub/courses/:id/lessons           | List lessons for a course in order                                   |
| POST   | /api/v1/training-hub/courses/:id/lessons           | Add lesson to course                                                 |
| PATCH  | /api/v1/training-hub/courses/:id/lessons/:lessonId | Update lesson content or ordering                                    |
| DELETE | /api/v1/training-hub/courses/:id/lessons/:lessonId | Remove lesson                                                        |
| POST   | /api/v1/training-hub/courses/:id/enroll            | Enroll current user in course                                        |
| POST   | /api/v1/training-hub/courses/:id/progress          | Update lesson progress (completed, time spent)                       |
| GET    | /api/v1/training-hub/my-courses                    | List enrolled courses with progress for current user                 |

## Data Model

Tables: `training_courses` (organization_id, title, description, category, difficulty, duration_minutes, status), `training_lessons` (course_id, title, content_type, content, order_index, duration_minutes), `training_enrollments` (user_id, course_id, status, progress_percent, completed_at)

## Access Control

- Admin: full CRUD on courses and lessons; view all enrollments across org
- Client: browse course catalog, self-enroll, update own progress, view My Courses dashboard
