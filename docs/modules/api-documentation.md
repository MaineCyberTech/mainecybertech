# API Documentation

**Category:** Infrastructure
**API Routes:** `apps/api/src/routes/swagger.ts`

## Overview

Serves the interactive Swagger UI and OpenAPI 3.0.3 specification for the MCT API. Provides self-documenting endpoints for developers to explore and test the API without external tooling. Protected by nonce-based CSP for Swagger UI script execution.

## Key Features

- OpenAPI 3.0.3 JSON specification endpoint
- Interactive Swagger UI explorer
- Nonce-based Content Security Policy for script execution
- No authentication required for browsing

## Endpoints

| Method | Path                 | Description                          |
| ------ | -------------------- | ------------------------------------ |
| GET    | /api/v1/openapi.json | OpenAPI 3.0.3 JSON specification     |
| GET    | /api/v1/docs         | Swagger UI interactive documentation |

## Data Model

N/A — serves documentation only, no database interaction.

## Access Control

- Public: no authentication required for either endpoint
