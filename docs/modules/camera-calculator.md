# Camera Retention / Storage Calculator

**Category:** Security
**API Routes:** `apps/api/src/routes/camera-calculator.ts`
**SDK:** `packages/sdk/src/camera-calculator.ts`

## Overview

IP camera storage projection and retention planning tool. Calculates required storage based on camera count, resolution, framerate, compression codec, and desired retention period. Supports H.264, H.265, H.265+, and MJPEG codec profiles with motion-only recording adjustments.

## Key Features

- Storage calculator — camera specs (megapixels, FPS, codec, recording hours/day) → total TB required
- Retention projection — given available storage, calculate achievable retention days
- Bandwidth estimator — per-camera and aggregate network throughput impact
- Motion-only recording toggle — reduce storage by 40-70% with intelligent recording profiles
- Multi-site comparison — compare storage requirements across multiple camera deployments
- Report export — PDF proposal-ready storage summary for client approval

## Endpoints

| Method | Path                                       | Description                                   |
| ------ | ------------------------------------------ | --------------------------------------------- |
| POST   | /api/v1/camera-calc/estimate               | Calculate storage/bandwidth from camera specs |
| POST   | /api/v1/camera-calc/projection             | Project retention from available storage      |
| POST   | /api/v1/camera-calc/batch                  | Batch compare multiple camera configs         |
| GET    | /api/v1/camera-calc/saved-calculations     | List saved calculations per org               |
| POST   | /api/v1/camera-calc/saved-calculations     | Save a calculation for later reference        |
| DELETE | /api/v1/camera-calc/saved-calculations/:id | Delete saved calculation                      |
| GET    | /api/v1/camera-calc/export/:id             | Export calculation as PDF report              |

## Data Model

`saved_camera_calculations` (organization_id, name, camera_count, resolution_mp, framerate, codec, recording_hours_per_day, motion_only boolean, retention_days, estimated_storage_gb, estimated_bandwidth_mbps, calculated_at, created_by). Input specs passed inline to estimator endpoints (no persistent record unless explicitly saved).

## Access Control

- Admin: full CRUD, save/export calculations
- Client: use calculator, view own saved calculations
- requireAuth on estimator endpoints (lightweight); requireOrgAccess on saved calculations
- Audit logging on saved calculation create/delete
