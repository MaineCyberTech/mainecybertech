# Projects

**Category:** Core
**API Routes:** `apps/api/src/routes/projects.ts`
**SDK:** `packages/sdk/src/projects.ts`

## Overview

Project management system with task tracking, comment threads, approval workflows, and update posts. Supports compound detail queries to reduce N+1 patterns, task reordering, and read-state tracking for comment threads.

## Key Features

- Full CRUD with optimistic locking on updates
- Compound detail endpoint (project + tasks + comments in one query)
- Task management with reordering support
- Comment threads with markdown rendering
- Comment read-state tracking per user
- Project approval workflow
- Project updates (announcement-style posts)
- CSV/JSON export

## Endpoints

| Method | Path                                     | Description                                      |
| ------ | ---------------------------------------- | ------------------------------------------------ |
| GET    | /api/v1/projects                         | List projects (paginated, filterable)            |
| GET    | /api/v1/projects/export                  | Export projects as CSV/JSON                      |
| POST   | /api/v1/projects                         | Create a project                                 |
| GET    | /api/v1/projects/:id                     | Get project by ID                                |
| GET    | /api/v1/projects/:id/compound            | Get project with tasks + comments (single query) |
| PATCH  | /api/v1/projects/:id                     | Update project (optimistic locking)              |
| DELETE | /api/v1/projects/:id                     | Delete a project                                 |
| POST   | /api/v1/projects/:id/tasks               | Create a task                                    |
| PATCH  | /api/v1/projects/:id/tasks/:taskId       | Update a task                                    |
| DELETE | /api/v1/projects/:id/tasks/:taskId       | Delete a task                                    |
| POST   | /api/v1/projects/:id/tasks/reorder       | Reorder tasks                                    |
| POST   | /api/v1/projects/:id/comments            | Add a comment                                    |
| PATCH  | /api/v1/projects/:id/comments/:commentId | Edit a comment (5-min window)                    |
| POST   | /api/v1/projects/:id/comments/read       | Mark comments as read                            |
| POST   | /api/v1/projects/:id/approve             | Approve project                                  |
| GET    | /api/v1/projects/:id/updates             | List project updates                             |
| POST   | /api/v1/projects/:id/updates             | Post a project update                            |

## Data Model

Key tables: `projects`, `project_tasks`, `project_task_comments`, `project_task_comment_reads`, `project_updates`

## Access Control

- Admin: full CRUD + approval + updates
- Client: read + comment on own org projects (portal)
