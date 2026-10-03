// Read current products to get names and summaries
const fs = require('fs');
const products = JSON.parse(fs.readFileSync('apps/web/lib/catalog/data/products.json', 'utf8'));

// Step 1: Build detailed per-product runbook 
// Each product gets: triage(5), delivery(7), documentation(5), qa(6), closeout(6)
// Every step is unique to that product

const catTools = {
  "Quick Fixes": "remote session, admin console access, haveibeenpwned.com, MFA setup guides",
  "Cybersecurity": "M365 Defender, Nessus/OpenVAS, Microsoft Secure Score, MXToolbox, HaveIBeenPwned",
  "Microsoft 365": "M365 Admin Center (admin.microsoft.com), Azure AD Portal (portal.azure.com), Exchange Admin Center, Teams Admin Center, M365 Defender (security.microsoft.com)",
  "Computer Setup & Support": "RMM agent, Windows Update, BitLocker, endpoint protection console, remote desktop tools",
  "Wi-Fi & Networking": "UniFi Controller, Wi-Fi analyzer (NetSpot/Ekahau), cable tester, toner, laptop with management access",
  "Security Cameras": "UniFi Protect/NVR web interface, mobile camera app, PoE tester, ladder, Ethernet tools",
  "Backup & Recovery": "Veeam/Acronis/cloud backup console, test restore VM, backup monitoring dashboard",
  "Website & SEO": "Google Search Console, Google Analytics (GA4), PageSpeed Insights, GTmetrix, SSL Labs, Screaming Frog, Cloudflare dashboard",
  "Compliance & Policies": "policy template library, word processor, compliance frameworks (PCI, HIPAA, CMMC/NIST)",
  "Monthly IT Plans": "RMM dashboard, endpoint protection console, M365 Admin Center, backup monitoring, help desk ticketing",
  "Emergency Support": "remote tools (ScreenConnect/TeamViewer), incident response checklist, forensics tools, communication plan",
  "Business Starter Packs": "M365 Admin Center, UniFi Controller, endpoint management, backup console, project management tools"
};

function genProductRunbook(p) {
  const n = p.name, s = p.summary || '', c = p.category, t = catTools[c] || 'admin consoles, remote tools, documentation templates';
  const id = p.id;

  // === TRIAGE (5 steps) ===
  const triage = [
    `Confirm purchase scope: "${n}" for [customer]. Review ${s.toLowerCase()} Verify customer expectations, timeline, and any prerequisites before scheduling.`,
    `Schedule session: coordinate with customer contact who has admin access and authority. Send calendar invite with preparation checklist: required credentials, system access, list of users/devices, any prior documentation.`,
    `Pre-work access check: verify customer has provided or confirmed admin access to required systems. If admin credentials are missing, request before proceeding — do not start without proper access.`,
    `Gather baseline: collect current documentation, previous IT provider notes, existing configurations, known issues, and any urgency or compliance factors. Note any deadlines or insurance requirements.`,
    `Create ticket: log in internal system with product ID "${id}", customer name, scope boundaries, expected deliverables, exclusions, and follow-up plan. Assign appropriate technician based on skill set.`
  ];

  // === DELIVERY (7 steps) — product-specific ===
  // Build delivery based on product patterns
  let delivery = [];
  const nm = n.toLowerCase();

  if (nm.includes('password')) {
    delivery = [
      `Remote session: connect to customer environment via ScreenConnect or Teams. Share screen and review current password practices — shared accounts, password spreadsheets, browser-saved passwords, and password reuse.`,
      `M365 password policy audit: navigate to admin.microsoft.com > Settings > Org settings > Security & privacy. Document current password expiration, complexity requirements, account lockout threshold. Screenshot settings.`,
      `Compromised account scan: run https://haveibeenpwned.com/DomainSearch on customer email domain. For each exposed account, note breach source, date, and exposed data type. Flag accounts needing immediate password change.`,
      `Shared account inventory: check shared mailbox configuration in Exchange Admin Center. Check for generic accounts (info@, sales@, office@). Review for any user accounts shared by multiple staff — document all findings.`,
      `Password manager assessment: evaluate customer's current state (no manager, personal tools, business manager). Compare Bitwarden Teams, 1Password Business, and Keeper — recommend best fit based on team size, devices, budget. Demo recommended tool.`,
      `Findings documentation: compile Password Security Scorecard with sections: Policy Settings, Compromised Accounts, Shared Accounts, Manager Readiness. Rate each section Green/Yellow/Red.`,
      `Customer review: present findings via 15-minute video call or detailed email. Walk through each finding, answer questions, discuss recommended next steps. Get acknowledgement of receipt.`
    ];
  } else if (nm.includes('mfa') && nm.includes('setup')) {
    delivery = [
      `Account audit: list all business-critical accounts across platforms (M365, Google Workspace, banking, payroll, CRM, domain registrar). For each account, check current MFA status in the platform's security settings.`,
      `M365 MFA configuration: navigate to admin.microsoft.com > Users > Active users > Multi-factor authentication. Review each user status. Enable MFA for ready users. Create Conditional Access policy at portal.azure.com > Azure AD > Security requiring MFA for all cloud apps.`,
      `Google Workspace 2SV: navigate to admin.google.com > Security > 2-Step Verification. Check enrollment status. Click 'Get Started' and enforce for organizational unit. Verify app passwords are configured for legacy apps if needed.`,
      `Third-party platform MFA: guide customer through enabling MFA on banking, payroll, CRM, domain registrar, and other platforms. Walk through each platform's Settings > Security > Two-Factor page.`,
      `Authenticator app setup: guide each user through installing Microsoft Authenticator or Google Authenticator. Demonstrate QR code scan, test code entry. Prefer authenticator app over SMS (SIM-swap risk). Show backup method setup.`,
      `Recovery codes: for each platform that generates recovery/backup codes, guide customer to save them in a secure location (physical safe, encrypted password manager vault). Do NOT store recovery codes in your documentation.`,
      `Verification testing: test MFA login on M365 with a test account. Verify Conditional Access policy is working. Test login on Google Workspace. Verify all critical platforms now require MFA. Document successful tests.`
    ];
  } else if (nm.includes('phish') || nm.includes('phishing')) {
    delivery = [
      `Email security review: check SPF, DKIM, DMARC via https://mxtoolbox.com/SuperTool.aspx — enter customer domain, run SPF, DKIM, DMARC checks. Document current status and any misconfigurations found.`,
      `M365 anti-phish policy: navigate to security.microsoft.com > Policies & rules > Threat policies > Anti-phishing. Review impersonation protection (CEO/Brand spoofing), spoof intelligence, and advanced phishing thresholds. Note gaps.`,
      `M365 anti-spam policy: navigate to security.microsoft.com > Policies & rules > Threat policies > Anti-spam. Check spam confidence level threshold, action for high-confidence spam, quarantine settings.`,
      `Mailbox rule audit: use Exchange Online PowerShell: Get-Mailbox -ResultSize Unlimited | % { Get-InboxRule -Mailbox $_.Identity } | Export-CSV rules.csv. Review forwarding rules, delete-after-read rules, suspicious rule names.`,
      `Safe phishing simulation: prepare safe test email (fake voicemail notification or shared document link) with tracking. Send to small test group (3-5 users) using controlled send or a phishing platform.`,
      `Staff awareness check: review simulation results — who clicked the link? Who replied? Who reported the email? Calculate click rate, report rate, and reply rate against industry benchmarks.`,
      `Findings report: compile Phishing Readiness Scorecard with sections: Email Authentication, Anti-Phish Policy, Anti-Spam Policy, Mailbox Rules, Staff Awareness. Provide risk rating for each section and prioritized remediation steps.`
    ];
  } else if (nm.includes('security score') || nm.includes('snapshot')) {
    delivery = [
      `Identity assessment: check MFA status across M365 and other platforms. Review admin account count and separation of duties. Check for generic accounts and shared credentials. Rate identity posture.`,
      `Endpoint assessment: review endpoint protection status via RMM or Defender console. Check OS patch compliance, disk encryption status, and local admin rights. Run sample machine health check.`,
      `Email assessment: verify SPF/DKIM/DMARC status, check anti-phishing and anti-spam policy settings, review forwarding rules. Check MFA on all email accounts.`,
      `Backup assessment: verify backup configuration for critical data. Check backup success rate over past 30 days. Review backup retention and off-site strategy. Test that backups are accessible.`,
      `Admin risk assessment: audit privileged accounts across M365, on-prem AD, and cloud platforms. Check for stale admin accounts, excessive permissions, and shared admin credentials.`,
      `Score calculation: aggregate findings from all five domains. Calculate overall security score on a 0-100 scale using the defined scoring rubric. Provide domain-level scores.`,
      `Customer presentation: deliver Security Score Snapshot report with overall score, domain breakdowns, red/amber/green ratings, and top 5 prioritized actions ranked by risk reduction impact.`
    ];
  } else if (nm.includes('admin account') || nm.includes('admin cleanup')) {
    delivery = [
      `M365 admin audit: navigate to admin.microsoft.com > Users > Active users. Filter by Admin roles. Export list of Global Admins, Exchange Admins, SharePoint Admins, Teams Admins and save as CSV.`,
      `On-prem AD admin audit (if applicable): run Get-ADGroupMember 'Domain Admins' and Get-ADGroupMember 'Administrators' in PowerShell. Export results. Check for disabled user objects still in admin groups.`,
      `Cloud platform admin audit: check Google Workspace, Salesforce, QuickBooks, domain registrar, and other cloud platforms for admin users. Document each platform, admin count, and last login dates.`,
      `Stale account identification: cross-reference admin users against current employee roster and former employees. Flag any admin accounts belonging to departed employees for immediate removal. Flag accounts with no recent login.`,
      `Shared admin accounts: identify any admin accounts used by multiple people (e.g. 'admin', 'administrator', shared credentials). Document risks — no accountability, no audit trail, security risk.`,
      `Cleanup planning: create proposed cleanup plan listing: accounts to remove, accounts to demote, accounts to convert to named accounts with MFA. Present to customer for approval before making changes.`,
      `Execution and verification: execute approved admin account changes. Verify each change took effect by logging out/back in. Document final admin inventory with purpose, owner, and last review date.`
    ];
  } else if (c === 'Security Cameras') {
    if (nm.includes('survey') || nm.includes('planning')) {
      delivery = [
        `Pre-visit preparation: review property maps, building layouts, and any existing camera infrastructure. Prepare site survey kit: measuring wheel, camera demo unit, photo documentation tool, map/sketchpad.`,
        `Property walkthrough: conduct full perimeter walk with customer. Identify all entry points, high-risk areas, blind spots, and areas requiring coverage. Note lighting conditions, power availability, and network access points.`,
        `Coverage mapping: mark potential camera positions on property map/sketchpad. For each position, note field of view, distance to target, mounting surface type, and environmental factors (sun glare, tree growth, weather exposure).`,
        `Infrastructure assessment: check PoE switch capacity and location. Verify cabling paths from camera positions to switch location. Identify any conduit or cabling needs. Measure cable run distances.`,
        `Equipment recommendations: specify camera models based on coverage needs (dome vs bullet, fixed vs PTZ, resolution requirements). Recommend NVR capacity based on camera count, retention days, and resolution.`,
        `Cost estimate: calculate material costs (cameras, NVR, cabling, mounts, PoE switch), labor estimate, and any permits or third-party contractor needs. Provide written estimate with options for phased installation.`,
        `Deliver survey report: package site photos, coverage maps, equipment list, and cost estimate into a Camera Site Survey Report. Schedule review call to walk through findings and next steps.`
      ];
    } else if (nm.includes('starter') || nm.includes('business') || nm.includes('complete')) {
      delivery = [
        `Pre-installation prep: verify all equipment received — check model numbers match order, inspect for shipping damage. Prepare tools: ladder, drill, fish tape, cable tester, crimper, screwdrivers, safety gear.`,
        `Camera mounting: per site survey plan, mount each camera at designated position. Use appropriate mounting hardware for surface type. Run Ethernet cable from camera to switch location. Use conduit where required by code.`,
        `NVR setup: rack-mount or place NVR in secure location. Connect to PoE switch uplink. Configure RAID/storage. Set NVR IP address, update firmware to latest version. Configure recording schedule and retention policy.`,
        `Camera adoption: add each camera to NVR or UniFi Protect. Assign camera names matching location/coverage. Set recording quality and frame rate. Configure motion detection zones — define detection areas and sensitivity per camera.`,
        `Smart detection config: for AI-capable cameras, configure smart detection events (person, vehicle, line crossing, intrusion zone). Set alert rules — push notification or email on selected events. Adjust to minimize false alerts.`,
        `Remote access setup: configure VPN or secure remote access for mobile viewing. Set up UniFi Protect app or vendor mobile app. Test remote access from cellular connection. Verify video quality and latency are acceptable.`,
        `Customer handoff: demonstrate live view, playback, alert notifications, and remote access to customer. Provide quick-reference guide for daily use. Test all cameras and confirm customer is satisfied.`
      ];
    }
  } else if (c === 'Backup & Recovery') {
    if (nm.includes('backup') && (nm.includes('setup') || nm.includes('check'))) {
      delivery = [
        `Current state audit: review existing backup configuration — what is backed up, how often, where to, retention policy. Check last successful backup date and time. Note any failed backup alerts from past 90 days.`,
        `Data criticality assessment: work with customer to identify and prioritize data by importance. Tier 1: business-critical (cannot operate without). Tier 2: important (would cause disruption). Tier 3: nice to have (archival).`,
        `Backup configuration: configure backup software (Veeam, Acronis, cloud backup agent) per scope. Set backup schedule (recommend daily for Tier 1, weekly for Tier 2). Set retention policy (30 days daily, 12 months monthly, 7 years yearly minimum).`,
        `Cloud/off-site backup: configure secondary backup target — cloud (Backblaze B2, Wasabi, Azure, S3) or secondary NAS. Enable encryption for data in transit and at rest. Set immutable backup option where available for ransomware protection.`,
        `Backup monitoring: configure backup job alerting — email notification on backup failure or warning. Set up backup monitoring dashboard for ongoing visibility. Add to RMM monitoring if available.`,
        `Initial full backup: trigger initial full backup of all protected data. Monitor progress — verify transfer speed is acceptable. Document initial backup duration for capacity planning.`,
        `Verification: after full backup completes, browse backup contents — verify files are accessible. Note total protected data size. Document backup configuration summary for customer.`
      ];
    } else if (nm.includes('restore') || nm.includes('test')) {
      delivery = [
        `Test scope definition: select representative files/systems for restore test — one file restore, one folder restore, one full system restore if applicable. Define success criteria for each test.`,
        `Isolated restore environment: set up isolated VM or alternate storage location for restore testing. Do NOT restore to production location — risk of overwriting live data.`,
        `File restore test: initiate restore of selected files from backup. Measure restore initiation time, data transfer speed, and total restore duration. Open restored files and verify content integrity. Compare to original.`,
        `Folder restore test: initiate restore of selected folder with permissions. After restore, verify folder structure, file names, modification dates, and permission inheritance. Check for any corruption or missing files.`,
        `Full system restore test: if applicable, restore a VM or system image to isolated environment. Boot restored system. Log in and verify applications, services, and network connectivity. Note any issues.`,
        `Restore time documentation: document time-to-restore for each test scenario. Calculate recovery time objective (RTO) based on test results. Compare against customer's recovery time objectives.`,
        `Findings report: compile restore test results with pass/fail status for each test. Include measured restore times, any errors encountered, and recommendations for backup configuration improvements.`
      ];
    }
  } else if (c === 'Website & SEO') {
    if (nm.includes('health') || nm.includes('check')) {
      delivery = [
        `Performance testing: run https://pagespeed.web.dev for both mobile and desktop. Document Core Web Vitals scores (LCP, FID, CLS). Run GTmetrix scan. Screenshot results for the report.`,
        `Security scanning: run SSL Labs test at https://www.ssllabs.com/ssltest/. Verify SSL certificate chain, protocol support, cipher strength. Scan for malware using Sucuri SiteCheck. Check if site is on any blacklists.`,
        `SEO basics: check Google Search Console for crawl errors, manual actions, and security issues. Verify robots.txt is not blocking important pages. Check XML sitemap presence and submission status.`,
        `Technical audit: crawl site with Screaming Frog SEO Spider. Check for broken links (404s), redirect chains, duplicate title tags, missing meta descriptions. Export results.`,
        `Mobile responsiveness: test site at 375px, 768px, 1024px widths. Check for horizontal overflow, tiny touch targets, unreadable text. Use Chrome DevTools mobile emulator.`,
        `Accessibility basics: run Lighthouse accessibility audit. Check for missing alt text, low contrast text, missing form labels, keyboard navigation issues. Document findings.`,
        `Health report: compile Website Health Report with sections: Performance, Security, SEO, Mobile, Accessibility. Each section gets a score and prioritized fix list.`
      ];
    } else if (nm.includes('seo') || nm.includes('search')) {
      delivery = [
        `Keyword research: identify target keywords for the business. Use Google Keyword Planner, Ubersuggest, or Ahrefs. List primary keywords (high intent) and secondary keywords (supporting). Document monthly search volume.`,
        `Google Business Profile audit: check profile at business.google.com. Verify NAP (Name, Address, Phone) accuracy. Check categories, hours, attributes. Review photo count and quality. Note missing fields.`,
        `Citation audit: check major citation sources (Yelp, Yellow Pages, BBB, industry directories). Verify NAP consistency across all listings. Identify duplicate or conflicting listings.`,
        `On-page optimization: review target pages for keyword usage in title tags, H1s, meta descriptions, image alt text, and body content. Identify missing or weak optimization.`,
        `Local schema markup: add or verify LocalBusiness JSON-LD schema on the website. Include @type, name, address, telephone, openingHours, geo coordinates. Test with Google Rich Results Test.`,
        `Competitor review: identify top 3 local competitors ranking for target keywords. Note their strengths (more reviews, better content, more backlinks) and weaknesses/gaps.`,
        `Local SEO report: compile findings with keyword rankings, GBP optimization checklist, citation cleanup list, on-page recommendations, and competitor gap analysis. Prioritize by impact.`
      ];
    }
  } else if (c === 'Microsoft 365') {
    if (nm.includes('migration')) {
      delivery = [
        `Pre-migration audit: inventory source environment — mailboxes, distribution groups, shared mailboxes, public folders, calendar resources. Document sizes, permissions, and routing rules. Export source configuration.`,
        `M365 tenant preparation: verify destination tenant has sufficient licenses. Add and verify custom domain. Create user accounts matching source accounts. Configure MFA and basic security before migration begins.`,
        `Migration plan: determine migration method — Cutover (<150 mailboxes), Staged (150-2000 mailboxes), or Hybrid (>2000). Create migration batch in Exchange Admin Center > Migration. Set batch to start with small test group of 3-5 mailboxes.`,
        `DNS preparation: document current MX, Autodiscover, and SPF records. Plan DNS cutover timing — TTL should be lowered to 300 seconds 24 hours before cutover. Prepare new DNS records for M365.`,
        `Data migration execution: monitor migration batch progress in Exchange Admin Center. Verify data integrity — compare source and destination mailbox item counts. Test mail flow to migrated mailboxes.`,
        `Client reconfiguration: after migration, reconfigure Outlook profiles (new Autodiscover), mobile devices (re-add account), and any email clients. Provide setup instructions to users.`,
        `Post-migration verification: verify all mail flow routes correctly. Test sending and receiving externally. Verify calendar free/busy works. Check public folders or shared mailboxes migrated. Run final sync to catch any last-minute changes.`
      ];
    } else if (nm.includes('tenant setup') || nm.includes('tenant') || (nm.includes('setup') && nm.includes('365'))) {
      delivery = [
        `Tenant creation: navigate to admin.microsoft.com. Create tenant with customer business name. Set initial Global Admin account with strong password and MFA. Document tenant ID and admin account securely.`,
        `Domain verification: add customer domain via Setup > Domains > Add domain. Add TXT verification record at domain registrar. Wait for propagation (5-30 min) and verify. Add remaining domains (aliases) if needed.`,
        `DNS records: add required DNS records at domain registrar: MX record (pointing to M365), Autodiscover CNAME, SPF TXT record (include M365 IPs), DKIM CNAME records, and DMARC TXT record. Verify with MXToolbox.`,
        `User creation: create user accounts in admin.microsoft.com > Users > Add user. Assign appropriate licenses (Business Basic/Standard/Premium). Set location for license assignment. Create shared mailboxes, distribution groups, and resource mailboxes as needed.`,
        `Security defaults: enable Security Defaults at portal.azure.com > Azure AD > Properties > Manage Security Defaults. This enables MFA registration for all users, blocks legacy auth, and protects privileged activities. Or configure Conditional Access for more granular control.`,
        `MFA enforcement: ensure all users register for MFA. Send registration URL to users with deadline. Monitor compliance in MFA user portal. Provide help documentation for common setup issues.`,
        `Testing and handoff: test mail flow (internal and external), Teams messaging, SharePoint access, and OneDrive sync. Provide admin console walkthrough to customer. Deliver documentation package.`
      ];
    } else if (nm.includes('cleanup') && nm.includes('tenant')) {
      delivery = [
        `User audit: export all users from admin.microsoft.com > Users > Active users. For each user, note last sign-in date, license assignment, admin roles, and group memberships. Flag users with no sign-in > 90 days for potential removal.`,
        `License audit: navigate to admin.microsoft.com > Billing > Your products. Compare assigned licenses to active users. Identify unassigned or overallocated licenses. Use M365 License Utilization dashboard.`,
        `Group and mailbox audit: list all Microsoft 365 Groups, Distribution Groups, Shared Mailboxes. Check last activity for shared mailboxes using Get-MailboxStatistics in Exchange PowerShell. Flag inactive objects.`,
        `Teams audit: inventory all Teams and channels. Check each team for recent activity (last message date). Identify teams with zero activity, duplicate purpose, or orphaned ownership.`,
        `SharePoint audit: review SharePoint site inventory. Check storage usage, last activity, and external sharing settings per site. Identify stale sites and excessive public/external sharing.`,
        `Cleanup execution: based on audit findings and customer approval, execute: remove inactive users, reassign/unassign licenses, archive stale Teams, remove empty groups, adjust SharePoint sharing settings, clean up shared mailbox permissions.`,
        `Documentation: deliver cleaned-up state documentation with before/after comparison. Include ongoing maintenance recommendations and a periodic review schedule.`
      ];
    }
  }

  // If no delivery was set by the pattern matcher, use a generic good detailed one
  if (delivery.length === 0) {
    // Build a good generic detailed delivery
    const steps = [];
    steps.push(`Pre-work preparation: review customer intake responses, current documentation, and any previous service history. Prepare session with required tools: ${t}. Confirm customer has provided required access.`);
    steps.push(`Initial assessment: connect to customer environment via secure remote session. Document current state before making any changes — take screenshots, note current settings, record baseline metrics.`);
    
    if (c === 'Quick Fixes' || c === 'Cybersecurity') {
      steps.push(`Execute ${n} assessment per scope. Systematically review each area defined in the scope: ${s}. Check settings, configurations, and behaviors against security best practices and industry standards.`);
      steps.push(`Findings documentation: as each area is reviewed, document findings in real-time. Categorize by severity (Critical/High/Medium/Low) and by area. Screenshot evidence for each finding. Note potential business impact.`);
    } else if (c === 'Computer Setup & Support') {
      steps.push(`Execute ${n} per scope. Configure device/system as specified: install required software, apply security baseline, verify updates, configure user settings. Follow standard operating procedures for consistency.`);
      steps.push(`Testing and verification: boot system and verify all software launches. Test network connectivity, peripheral devices, and user account access. Run benchmark or health check if applicable.`);
    } else if (c === 'Wi-Fi & Networking') {
      steps.push(`Execute ${n} per scope. Perform on-site work at customer location: access network equipment, run diagnostics, make configuration changes per plan. Take before and after screenshots.`);
      steps.push(`Verify improvements: test connectivity from multiple locations, measure speed/performance, check for dead zones (Wi-Fi), verify VLAN separation, test failover if applicable.`);
    } else if (c === 'Compliance & Policies') {
      steps.push(`Policy customization: using customer intake responses, industry requirements, and business context, customize the ${n} template. Address specific risks, compliance obligations, and operational needs.`);
      steps.push(`Customer review: present draft to customer with explanations of each section. Answer questions, incorporate feedback, and finalize. Provide implementation guidance and enforcement recommendations.`);
    } else if (c === 'Monthly IT Plans') {
      steps.push(`Monthly execution: perform recurring tasks per plan scope — system monitoring review, patch status check, backup verification, help desk ticket resolution, security alert review.`);
      steps.push(`Customer touchpoint: provide monthly summary of work performed, incidents resolved, and any recommendations. Schedule quarterly strategy review to discuss technology roadmap and improvements.`);
    } else if (c === 'Emergency Support') {
      steps.push(`Response initiation: immediately contact customer upon receiving emergency request. Assess severity and triage the situation. If active attack/outage, begin containment while gathering information.`);
      steps.push(`Resolution and recovery: work through incident response plan to restore service. Document every action taken with timestamps. After restoration, perform root cause analysis and implement immediate prevention steps.`);
    } else if (c === 'Business Starter Packs') {
      steps.push(`Bundled delivery coordination: execute services in dependency order. For ${n}, start with foundational components (tenant/network/infrastructure setup), then build up (security, devices, training). Track progress on shared project plan.`);
      steps.push(`Integration verification: after all components are delivered, verify they work together correctly. Test end-to-end workflows. Confirm customer can use all systems independently. Address any gaps.`);
    } else {
      steps.push(`Execute ${n} per scope: perform the work defined in the service description — ${s}. Follow established procedures, document as you go, and test outcomes before considering the step complete.`);
      steps.push(`Progress check: halfway through service delivery, review progress against scope. Verify all work is on track. Note any scope deviations or additional findings that may require customer discussion.`);
    }
    
    steps.push(`Technical verification: test all changes, configurations, or improvements made. For assessments: verify all findings are accurate and evidence-based. For setup/installation: verify all systems function correctly. For cleanup: verify no unintended removals occurred.`);
    steps.push(`Prepare deliverables: compile all documentation, screenshots, configuration notes, and recommendations into a structured deliverable package. Format for customer readability — use plain English, highlight key findings, and prioritize recommendations.`);
    steps.push(`Customer walkthrough: schedule 15-30 minute session to walk through findings/deliverables with the customer. Answer questions, provide context, and explain next steps. Get customer acknowledgment of service completion.`);
    
    delivery = steps;
  }

  // === DOCUMENTATION (5 steps) ===
  const documentation = [
    `Record all findings, configurations, changes, and decisions made during the ${n} engagement. Use structured format: date, action, result, follow-up needed.`,
    `Create plain-English customer summary tailored to a non-technical audience. Explain what was done, what was found (if assessment), what was changed (if setup), and what it means for the business.`,
    `Include visual evidence: screenshots of configurations before and after, network diagrams or topology maps if applicable, benchmark results, coverage maps, or any other visual that adds clarity.`,
    `Document out-of-scope observations separately. If any issues were discovered outside the purchased scope, note them with a brief description and recommended follow-up action. Do not act on them without customer approval.`,
    `Security rule: never store passwords, recovery codes, MFA seeds, API keys, private keys, credit card numbers, or unredacted sensitive data in any documentation. Confirm this before closing the ticket.`
  ];

  // === QA (6 steps) ===
  const qa = [
    `Verify all work completed matches the purchased scope for ${n}. Check each bullet point in the service description — is it addressed? If not, note the reason.`,
    `Check that customer authorization was obtained for every change made. For any changes requiring explicit approval, verify the approval is documented (email, signed form, call log).`,
    `Secret audit: review all documentation, notes, and screenshots for stored credentials, API keys, recovery codes, or sensitive data. Remove or redact immediately if found.`,
    `Verify deliverable completeness: is the customer summary ready? Are all reports formatted correctly? Are screenshots included? Are recommendations prioritized?`,
    `Category-specific check: ${c === 'Backup & Recovery' ? 'verify restore test was successful and documented' : c === 'Security Cameras' ? 'verify all cameras are recording and accessible remotely' : c === 'Wi-Fi & Networking' ? 'verify network connectivity and coverage meet scope requirements' : c === 'Website & SEO' ? 'verify Google Search Console and Google Analytics data is loading correctly' : c === 'Microsoft 365' ? 'verify MFA is enabled on all admin accounts' : 'verify service-specific quality criteria are met'}.`,
    `Flag follow-up items: identify any recommended next steps, whether optional, recommended, or urgent. Tag items that should be addressed within 30 days vs longer-term.`
  ];

  // === CLOSEOUT (6 steps) ===
  const closeout = [
    `Send final deliverables package to customer via email or secure portal. Include: customer summary, findings report (if applicable), configuration documentation (if applicable), and recommendations.`,
    `Attach or link all supporting materials: screenshots, diagrams, guides, policy documents, configuration exports. Ensure all links work and are accessible to the customer.`,
    `Recommend next-step services: based on findings and customer needs, suggest: ${c === 'Quick Fixes' ? 'MFA Setup, Password Manager Rollout, Cyber Insurance Readiness Package' : c === 'Cybersecurity' ? 'Security Awareness Training, Incident Response Plan, Monthly Care Plan' : c === 'Microsoft 365' ? 'M365 Security Baseline, Monthly Admin Plan, Backup Setup' : 'related bundles, monthly plans, or category-specific follow-up services'}.`,
    `Revoke temporary access: if temporary admin access was granted for the engagement, confirm it has been revoked. If the customer provided credentials, remind them to rotate passwords if appropriate.`,
    `Record internal notes: add ticket notes with key technical details for future reference. Note any customer-specific configurations, access methods, or environmental details that will help on future engagements.`,
    `Schedule follow-up: if recommendations include specific actions, schedule a reminder to follow up in 30-60 days. For monthly plan customers, confirm next recurring engagement date. For bundles, confirm all components were delivered.`
  ];

  // Build workflow from the detailed steps
  const workflow = [
    triage[0], triage[1],
    delivery[0], delivery[1],
    qa[0], qa[1],
    closeout[0], closeout[1]
  ];

  return { workflow: workflow.slice(0, 7), triage, delivery, documentation, qa, closeout };
}

// ============================================================
// Apply to all products
// ============================================================
let changed = 0;
for (const p of products) {
  const runbook = genProductRunbook(p);
  
  // Update fulfillmentWorkflow
  const oldW = JSON.stringify(p.fulfillmentWorkflow);
  const newW = JSON.stringify(runbook.workflow);
  if (oldW !== newW) { p.fulfillmentWorkflow = runbook.workflow; changed++; }
  
  // Update internalProcedure
  p.internalProcedure = {
    triage: runbook.triage,
    delivery: runbook.delivery,
    documentation: runbook.documentation,
    qa: runbook.qa,
    closeout: runbook.closeout
  };
  changed++;
}

fs.writeFileSync('apps/web/lib/catalog/data/products.json', JSON.stringify(products, null, 2), 'utf8');

// ============================================================
// Verify
// ============================================================
const wf = {}, ip = {};
for (const p of products) {
  const wk = JSON.stringify(p.fulfillmentWorkflow);
  wf[wk] = wf[wk] || []; wf[wk].push(p.name);
  const ik = JSON.stringify(p.internalProcedure);
  ip[ik] = ip[ik] || []; ip[ik].push(p.name);
}
const wfDups = Object.entries(wf).filter(([,n]) => n.length > 1);
const ipDups = Object.entries(ip).filter(([,n]) => n.length > 1);
console.log('Fields changed:', changed);
console.log('fulfillmentWorkflow:', Object.keys(wf).length + '/' + products.length + ' unique (' + wfDups.length + ' dup groups)');
console.log('internalProcedure:', Object.keys(ip).length + '/' + products.length + ' unique (' + ipDups.length + ' dup groups)');

// Sample a few to verify detail level
const samples = ['Password Security Checkup', 'Camera Site Survey', 'Backup Restore Test', 'Website Health Check', 'Microsoft 365 Migration Lite', 'MFA Setup Session'];
for (const sn of samples) {
  const sp = products.find(x => x.name === sn);
  if (sp) {
    console.log('\n=== ' + sn + ' (delivery: ' + sp.internalProcedure.delivery.length + ' steps) ===');
    sp.internalProcedure.delivery.forEach((s, i) => console.log('  ' + s.substring(0, 120)));
  }
}
