# Education Automation

**Category:** Operations
**API Routes:** `apps/api/src/routes/edu-automation.ts`
**SDK:** `packages/sdk/src/edu-automation.ts`

## Overview
Education automation module for managing SOP libraries, compliance readiness, insurance evidence, AI policies, knowledge base articles, training modules, phishing campaigns, cyber scorecards, automation workflows, PowerShell scripts, and KB article generation.

## Key Features
- SOP library with version tracking
- Compliance readiness assessments (frameworks, controls)
- Insurance evidence collection and tracking
- AI policy management for client organizations
- Knowledge base with categorized articles
- Training module tracking with completion status
- Phishing campaign management with scheduled sends
- Cyber security scorecards with scoring methodology
- Automation workflow configuration
- PowerShell script library
- AI-powered KB article generation

## Endpoints (all sub-modules follow the same pattern)
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/edu-automation/sop | List SOP documents |
| POST | /api/v1/edu-automation/sop | Create SOP |
| PATCH | /api/v1/edu-automation/sop/:id | Update SOP |
| DELETE | /api/v1/edu-automation/sop/:id | Delete SOP |
| GET | /api/v1/edu-automation/compliance | List compliance assessments |
| POST | /api/v1/edu-automation/compliance | Create assessment |
| PATCH | /api/v1/edu-automation/compliance/:id | Update |
| DELETE | /api/v1/edu-automation/compliance/:id | Delete |
| GET | /api/v1/edu-automation/insurance | List insurance evidence |
| POST | /api/v1/edu-automation/insurance | Create evidence |
| PATCH | /api/v1/edu-automation/insurance/:id | Update |
| DELETE | /api/v1/edu-automation/insurance/:id | Delete |
| GET | /api/v1/edu-automation/ai-policy | List AI policies |
| POST | /api/v1/edu-automation/ai-policy | Create policy |
| PATCH | /api/v1/edu-automation/ai-policy/:id | Update |
| DELETE | /api/v1/edu-automation/ai-policy/:id | Delete |
| GET | /api/v1/edu-automation/kb | List knowledge articles |
| POST | /api/v1/edu-automation/kb | Create article |
| PATCH | /api/v1/edu-automation/kb/:id | Update |
| DELETE | /api/v1/edu-automation/kb/:id | Delete |
| GET | /api/v1/edu-automation/training | List training modules |
| POST | /api/v1/edu-automation/training | Create module |
| PATCH | /api/v1/edu-automation/training/:id | Update |
| DELETE | /api/v1/edu-automation/training/:id | Delete |
| GET | /api/v1/edu-automation/phishing | List phishing campaigns |
| POST | /api/v1/edu-automation/phishing | Create campaign |
| PATCH | /api/v1/edu-automation/phishing/:id | Update |
| DELETE | /api/v1/edu-automation/phishing/:id | Delete |
| GET | /api/v1/edu-automation/scorecards | List cyber scorecards |
| POST | /api/v1/edu-automation/scorecards | Create scorecard |
| PATCH | /api/v1/edu-automation/scorecards/:id | Update |
| DELETE | /api/v1/edu-automation/scorecards/:id | Delete |
| GET | /api/v1/edu-automation/automation | List automation workflows |
| POST | /api/v1/edu-automation/automation | Create workflow |
| PATCH | /api/v1/edu-automation/automation/:id | Update |
| DELETE | /api/v1/edu-automation/automation/:id | Delete |
| GET | /api/v1/edu-automation/powershell | List PowerShell scripts |
| POST | /api/v1/edu-automation/powershell | Create script |
| PATCH | /api/v1/edu-automation/powershell/:id | Update |
| DELETE | /api/v1/edu-automation/powershell/:id | Delete |
| GET | /api/v1/edu-automation/kb-generator | List KB article generations |
| POST | /api/v1/edu-automation/kb-generator | Generate KB article |
| PATCH | /api/v1/edu-automation/kb-generator/:id | Update |
| DELETE | /api/v1/edu-automation/kb-generator/:id | Delete |

## Data Model
Key fields (per table): `sop_library` (title, category, version, content), `compliance_readiness` (framework, controls_total, controls_passed), `insurance_evidence` (policy_type, provider, coverage_amount, expires), `ai_policies` (policy_name, scope, status), `knowledge_articles` (title, category, content, tags), `training_modules` (title, type, completion_rate), `phishing_campaigns` (name, template, target_count, click_rate), `cyber_scorecards` (overall_score, categories), `automation_workflows` (name, trigger, actions), `powershell_scripts` (name, script_body, category), `kb_article_generations` (source_ticket, status, output) — all have `organization_id`, `created_by`, `created_at`

## Access Control
- Admin: full CRUD across all sub-modules
- Client: read-only (portal, own org data)

## Worker Tasks
- `phishing-campaign-send`: Scheduled phishing simulation execution
