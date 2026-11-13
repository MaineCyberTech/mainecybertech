# Portal agent skills

Curated web/UI profile from
[`MaineCyberTech/albatross`](https://github.com/MaineCyberTech/albatross), plus
the `m365-exchange-ops` skill for the portal's Microsoft 365/calendar and email
integration work.

Update via the canonical source:

```sh
scripts/sync-skills.sh /path/to/mainecybertech web-lite
```

`m365-exchange-ops` is copied separately from `albatross/skills/`. Do not edit
these copies directly. Never put secrets, service-role keys or customer data in
a skill.
