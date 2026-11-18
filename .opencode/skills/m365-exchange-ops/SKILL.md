---
name: M365 Exchange Ops
description: Operate the MCT Microsoft 365 / Exchange Online tenant, custom domains, mailboxes, DNS, OAuth2 SMTP for Alga PSA, and Microsoft Graph integrations. Use for domain onboarding, Exchange mail flow, OAuth2 SMTP, DKIM/DMARC and Microsoft integration work.
---

# M365 Exchange Ops

The production Microsoft 365 tenant is `eddb17c0-b7df-464f-a533-831123c7378d`,
initial domain `mainecybertechad.onmicrosoft.com`; `mainecybertech.com` is live
there. **Do not modify production while testing `.us`.** A new dev tenant is the
target for `mainecybertech.us`; see `docs/runbooks/M365-DEV-TENANT.md`.

Runbooks: `docs/runbooks/M365-EXCHANGE.md` (production/reference) and
`docs/runbooks/M365-DEV-TENANT.md` (isolated dev tenant).
Integration map: `docs/analysis/MICROSOFT-INTEGRATION-MAP.md`

## Tenant facts

- `mainecybertech.com` MX: `mainecybertech-com.mail.protection.outlook.com`.
- `.com` DKIM targets point at `mainecybertechad.onmicrosoft.com`; new `.us`
  DKIM targets may use the newer `*-v1.dkim.mail.microsoft` format. Always read
  the exact values from `Get-DkimSigningConfig` or
  `Get-MgDomainServiceConfigurationRecord`; never guess.
- Cloudflare DNS token for `.us`: Vault
  `secret/kestrel/providers/cloudflare/tokens/mct-m365-dns-20261113`
  (Zone Read + DNS Read/Write). Never print it.

## Authentication

- Human admin: Global Administrator / Exchange Administrator with MFA.
- The bootstrap script requires an explicit `-TenantId`; do not default to the
  production tenant. Use the dev tenant for `.us` testing.
- Interactive bootstrap: `scripts/m365-device-login.py` uses the Azure CLI
  public client and writes a root-only Graph token. Use only on a trusted admin
  workstation.
- Production automation: dedicated Entra app with a certificate or client
  secret, least privilege, scoped to one mailbox.
- PowerShell modules: `Microsoft.Graph.Authentication`,
  `Microsoft.Graph.Applications`, `Microsoft.Graph.Identity.DirectoryManagement`,
  `ExchangeOnlineManagement`.

## Domain onboarding

1. Add the domain in M365 and copy the `MS=...` TXT record.
2. Publish it with `scripts/m365-dns.py --verification-txt 'MS=...'`.
3. Verify the domain; then read the service configuration records.
4. Publish MX, SPF, DKIM CNAMEs and autodiscover. DKIM/autodiscover CNAMEs must
   be DNS-only, never proxied.
5. Add DMARC at `p=none` first.
6. Do not add MX until the mailboxes exist.

## Mailboxes

- `psa@mainecybertech.us` — licensed service mailbox, Alga sender.
- `support@mainecybertech.us` — shared mailbox; members and SendAs.
- `julian.butler@mainecybertech.us` — licensed human admin.
- Shared mailboxes under 50 GB do not need a license; confirm the tenant SKU.

## OAuth2 SMTP for Alga

Exchange Online Basic SMTP AUTH is retired. Never use `smtp.office365.com` with
a password.

- Entra app `mct-alga-psa-mail`, single tenant.
- Office 365 Exchange Online application permission `SMTP.SendAsApp`, admin
  consent.
- Exchange service principal; **FullAccess + SendAs** on `psa@` only.
- `Set-CASMailbox -Identity psa@mainecybertech.us -SmtpClientAuthenticationDisabled $false`.
- Token scope `https://outlook.office365.com/.default`.
- Alga `EMAIL_OAUTH2_*` env + Docker secret; `smtp.office365.com:587`,
  `EMAIL_REQUIRE_TLS=true`.
- Requires `patches/alga-psa-oauth2-smtp.patch`.

## Validation

```sh
dig +short MX mainecybertech.us
dig +short TXT mainecybertech.us
dig +short TXT _dmarc.mainecybertech.us
dig +short CNAME selector1._domainkey.mainecybertech.us
```

```powershell
Get-Mailbox -Identity psa@mainecybertech.us
Get-CASMailbox -Identity psa@mainecybertech.us | Select SmtpClientAuthenticationDisabled
Get-DkimSigningConfig -Identity mainecybertech.us | Select Enabled, Status, Selector1CNAME, Selector2CNAME
Get-ConnectionInformation
```

Send one controlled message and check SPF/DKIM/DMARC in the headers. Check
Exchange message trace and Entra audit logs.

## Safety

- Do not disable tenant-wide MFA or Security Defaults to make SMTP work.
- Do not grant tenant-wide `Mail.Send`/`Mail.ReadWrite` when a mailbox-scoped
  application policy is enough.
- Do not print or commit secrets, tokens, mailbox passwords or DKIM private
  keys.
- Do not change MX for a live domain until the new mailboxes are ready.
- Keep a Global Administrator break-glass account outside the PSA.
- Rotate app secrets/certificates before expiry and record it in Albatross.
