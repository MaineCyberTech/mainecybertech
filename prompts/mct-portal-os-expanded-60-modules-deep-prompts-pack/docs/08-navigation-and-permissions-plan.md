# Navigation and Permissions Plan

## Suggested navigation groups

- Dashboard
- Clients
- Projects
- Support
- Documents
- MSP OS
- Field Services
- Security
- Compliance
- Automation
- Reports
- Finance
- Settings

## Permission pattern

Create module/action permissions as needed:

- `<module>.read`
- `<module>.create`
- `<module>.update`
- `<module>.delete`
- `<module>.export`
- `<module>.approve`
- `<module>.publish`
- `<module>.admin`

## Client visibility rule

Do not assume client visibility from organization membership alone. Use explicit visibility or published state for reports, findings, files, documents, runbooks, generated AI outputs, and status updates.
