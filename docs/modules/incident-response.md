# Security Incident Response

**Category:** Security
**API Routes:** `apps/api/src/routes/incident-response.ts`
**SDK:** `packages/sdk/src/incident-response.ts`

## Overview

Full incident response lifecycle management with severity classification, playbook attachment, timeline tracking, evidence collection, and post-incident reporting. Aligns with NIST SP 800-61 and CMMC IR domains.

## Key Features

- Incident record CRUD with severity (SEV-1 through SEV-5) and status (detected/triage/contained/eradicated/recovered/closed)
- Playbook assignment — link incidents to SOP-based response procedures
- Timeline entries with timestamps, actor, action, and notes (immutable after entry)
- Evidence upload and categorization (screenshots, logs, packet captures, forensic images)
- Communication log for stakeholder updates and regulatory notification tracking
- Post-incident review (PIR) with root cause, lessons learned, and action items

## Endpoints

| Method | Path                                 | Description                                                              |
| ------ | ------------------------------------ | ------------------------------------------------------------------------ |
| GET    | /api/v1/incidents                    | List incidents (paginated, filterable by org/severity/status/date-range) |
| POST   | /api/v1/incidents                    | Create incident record                                                   |
| GET    | /api/v1/incidents/:id                | Get incident with timeline, evidence, communications                     |
| PATCH  | /api/v1/incidents/:id                | Update incident                                                          |
| POST   | /api/v1/incidents/:id/timeline       | Add timeline entry                                                       |
| POST   | /api/v1/incidents/:id/evidence       | Upload evidence artifact                                                 |
| GET    | /api/v1/incidents/:id/evidence       | List evidence files                                                      |
| POST   | /api/v1/incidents/:id/communications | Log stakeholder communication                                            |
| GET    | /api/v1/incidents/:id/pir            | Get post-incident review                                                 |
| PUT    | /api/v1/incidents/:id/pir            | Update post-incident review                                              |

## Data Model

`incidents` (organization_id, title, description, severity (1-5), status, attack_vector, affected_systems, playbook_id, detected_at, contained_at, recovered_at, closed_at, created_by). `incident_timeline` (incident_id, action, actor, notes, immutable_timestamp). `incident_evidence` (incident_id, file_path, category, uploaded_by). `incident_communications` (incident_id, stakeholder, method, message, sent_at). `incident_pir` (incident_id, root_cause, lessons_learned, action_items JSON, completed_at).

## Access Control

- Admin: full CRUD, timeline entry, evidence upload, PIR management
- Client: view incidents affecting their org, add timeline entries
- requireOrgAccess enforced; RLS via organization_id
- Audit logging on all mutation endpoints
