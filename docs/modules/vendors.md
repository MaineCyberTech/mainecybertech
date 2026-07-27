# Vendors

**Category:** Operations
**API Routes:** `apps/api/src/routes/vendors.ts`
**SDK:** `packages/sdk/src/vendors.ts`

## Overview
Vendor contract and contact management for tracking vendor relationships, contracts, renewal dates, points of contact, and associated documents.

## Key Features
- Vendor contract lifecycle management (active, expiring, expired, terminated)
- Contract value, term, and renewal tracking
- Vendor contact management with role categorization
- Search and status filtering
- Paginated listing for both contracts and contacts

## Endpoints
### Contracts
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/vendors/contracts | List vendor contracts (paginated, filterable by status/search) |
| GET | /api/v1/vendors/contracts/:id | Get contract by ID |
| POST | /api/v1/vendors/contracts | Create a vendor contract |
| PATCH | /api/v1/vendors/contracts/:id | Update contract |
| DELETE | /api/v1/vendors/contracts/:id | Delete a contract |

### Contacts
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/vendors/contacts | List vendor contacts (paginated) |
| GET | /api/v1/vendors/contacts/:id | Get contact by ID |
| POST | /api/v1/vendors/contacts | Create a vendor contact |
| PATCH | /api/v1/vendors/contacts/:id | Update contact |
| DELETE | /api/v1/vendors/contacts/:id | Delete a contact |

## Data Model
Key fields: `vendor_contracts` (vendor_name, contract_name, start_date, end_date, value, status), `vendor_contacts` (vendor_name, contact_name, email, phone, role) — all have `organization_id`, `created_by`, `created_at`

## Access Control
- Admin: full CRUD across contracts and contacts
- Client: read-only (portal, own org vendors)

## Worker Tasks
- `vendor-contract-renewal-check`: Scanning upcoming contract renewals
