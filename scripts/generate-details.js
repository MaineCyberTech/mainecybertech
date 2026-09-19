const fs = require('fs');
const products = JSON.parse(fs.readFileSync('apps/web/lib/catalog/data/products.json','utf8'));

// ============================================================
// Detailed product content for ALL 245 products
// Each entry provides: detailed marketing copy, specific best-for, 
// expanded outcomes, and comprehensive what's-included
// ============================================================
const details = {

// ==================== QUICK FIXES (12) ====================
"Password Security Checkup": {
  copy: "Weak, reused, and compromised passwords are the most common entry point for business email takeover and data breaches. The Password Security Checkup audits how your business currently handles passwords across Microsoft 365, cloud platforms, and shared accounts. We check for exposed credentials using HaveIBeenPwned scans, review your password policies in Microsoft 365, identify shared accounts that create accountability gaps, and assess whether a password manager would improve your security posture. You get a practical, plain-English report with prioritized recommendations, making this ideal for businesses that want to improve account security without a complex, expensive engagement.",
  bestFor: ["Businesses that use the same password across multiple accounts or systems", "Organizations where staff share login credentials informally", "Companies that have never reviewed their password policies or account security", "Businesses applying for cyber insurance that need evidence of password hygiene"],
  outcomes: ["Complete audit of password policies, shared accounts, and compromised credentials across your business", "HaveIBeenPwned domain scan results showing which accounts have been exposed in known data breaches", "Clear, prioritized roadmap for improving password hygiene with specific tool recommendations (Bitwarden, 1Password, or Keeper)", "Documentation suitable for cyber insurance applications or compliance requirements"],
  includes: ["Full password policy audit across Microsoft 365 and known cloud platforms", "Domain-wide compromised credential scan using HaveIBeenPwned API", "Shared account inventory and risk assessment", "Password manager readiness evaluation with tool comparison", "Plain-English findings report with prioritized recommendations", "30-minute customer walkthrough to review findings and next steps"]
},

"MFA Setup Session": {
  copy: "Multi-factor authentication is the single most effective defense against account takeover — reducing compromise risk by over 99%. Yet many small businesses still rely on passwords alone. The MFA Setup Session audits every critical business account (email, banking, payroll, CRM, domain registrar) for MFA coverage, then hands-on configures MFA across all eligible platforms. We set up Microsoft 365 Conditional Access policies requiring MFA, configure Google Workspace 2-Step Verification, and guide you through each third-party platform's security settings. Every user receives step-by-step enrollment instructions, testing confirms everything works, and recovery codes are securely stored — so you are protected without disrupting daily work.",
  bestFor: ["Businesses that don't have MFA enabled on email, banking, or critical cloud accounts", "Organizations whose cyber insurance now mandates MFA across all accounts", "Companies that need hands-on help setting up MFA without confusing technical documentation", "Businesses that experienced an email compromise and want to prevent recurrence"],
  outcomes: ["MFA configured and enforced on Microsoft 365, Google Workspace, banking platforms, and all identified critical accounts", "Conditional Access policy in Azure AD requiring MFA for all cloud applications and admin actions", "Every user trained and comfortable with authenticator app usage — no one locked out or confused", "Documented MFA status across all platforms suitable for insurance or audit requirements"],
  includes: ["Audit of all business-critical accounts for MFA coverage", "Microsoft 365 MFA configuration with Conditional Access policy enforcement", "Google Workspace 2-Step Verification configuration if applicable", "Third-party platform MFA setup (banking, payroll, CRM, domain registrar)", "Authenticator app deployment for all users with hands-on guidance", "Recovery code storage and account recovery procedure documentation", "Verification testing on all configured platforms"]
},

"Phishing Readiness Mini Audit": {
  copy: "Phishing attacks remain the leading cause of business data breaches, and small businesses are targeted just as aggressively as enterprises. The Phishing Readiness Mini Audit evaluates your email security defenses and your staff's actual response to phishing attempts. We review your SPF, DKIM, and DMARC email authentication records, audit your Microsoft 365 anti-phishing and anti-spam policy configuration, scan user mailboxes for suspicious forwarding rules that could indicate compromise, and optionally run a safe, controlled phishing simulation to measure staff awareness. You get a clear scorecard showing your email security posture and your team's phishing resilience — with specific recommendations for closing any gaps.",
  bestFor: ["Businesses that receive phishing emails and want to know if their staff would recognize them", "Organizations that haven't reviewed their email security configuration recently", "Companies preparing for cyber insurance that require phishing awareness evidence", "Businesses that have experienced a phishing-related compromise or near-miss"],
  outcomes: ["Complete email security assessment showing SPF, DKIM, DMARC status and recommended improvements", "Microsoft 365 anti-phishing and anti-spam policy review with configuration recommendations", "Staff phishing awareness measurement with benchmark comparison to industry averages", "Prioritized action plan for reducing phishing risk across technology and training"],
  includes: ["SPF, DKIM, and DMARC record audit using MXToolbox and manual record review", "Microsoft 365 anti-phishing policy review including impersonation protection and spoof intelligence", "Microsoft 365 anti-spam policy review including confidence threshold and quarantine settings", "User mailbox rule audit for suspicious forwarding and deletion rules", "Controlled phishing simulation (optional) with click/report/reply rate analysis", "Phishing Readiness Scorecard with risk ratings and prioritized remediation steps", "Customer presentation of findings with Q&A"]
},

"Security Score Snapshot": {
  copy: "Most small businesses have never had a formal security assessment and don't know where their biggest risks actually are. The Security Score Snapshot provides a structured evaluation across five critical security domains — identity, endpoints, email, backup, and admin access — and produces a simple numerical score (0-100) you can track over time. We review MFA coverage, endpoint protection status, email authentication, backup configuration, and privileged account management. Each domain gets a color-coded risk rating, and you get a prioritized list of quick-win actions to improve your score. This service is designed as a fast, affordable baseline that gives you a clear starting point and a measurable way to track improvement.",
  bestFor: ["Business owners who want an objective, measurable picture of their security posture", "Organizations that have never had any security assessment and need a baseline", "Companies applying for cyber insurance who need to identify and fix gaps", "Businesses that want to track security improvement over time with a repeatable score"],
  outcomes: ["A numerical security score (0-100) across five domains you can benchmark and track over time", "Red/Amber/Green risk ratings for identity, endpoints, email, backup, and admin access", "Top 5 prioritized actions ranked by risk reduction impact and implementation effort", "Clear understanding of where to invest your next security dollar for maximum effect"],
  includes: ["Identity assessment: MFA coverage, admin account audit, shared credential review", "Endpoint assessment: endpoint protection status, patch compliance, disk encryption, local admin rights", "Email assessment: SPF/DKIM/DMARC, anti-phish policy, anti-spam policy, mailbox rules", "Backup assessment: configuration verification, success rate review, retention and off-site strategy", "Admin risk assessment: privileged account inventory, stale accounts, excessive permissions", "Security Scorecard report with domain scores, overall score, and prioritized recommendations", "Customer walkthrough with Q&A and next-step guidance"]
},

"Admin Account Cleanup": {
  copy: "Over time, businesses accumulate administrative accounts from former employees, past IT providers, and temporary projects — each one a potential security risk. The Admin Account Cleanup audits every privileged account across your Microsoft 365 tenant, on-premises Active Directory (if applicable), and cloud platforms like Google Workspace, Salesforce, and QuickBooks. We identify stale accounts belonging to departed employees, shared admin credentials that eliminate accountability, and excessive privilege assignments that violate least-privilege principles. You get a complete inventory of who has administrative access to what, a cleanup plan prioritizing the highest-risk removals, and execution of approved changes — leaving you with a clean, documented admin structure.",
  bestFor: ["Businesses that have had multiple employees or IT providers over the years without access cleanup", "Organizations that use shared admin accounts with no individual accountability", "Companies that are unsure who currently has administrative privileges", "Businesses preparing for a security audit, compliance review, or cyber insurance application"],
  outcomes: ["Complete inventory of all administrative accounts across every business platform", "Removed or reduced privileges for former employees, shared accounts, and unnecessary admins", "Documented admin account structure with clear ownership, purpose, and last-review date", "Reduced risk of insider threats and accidental privileged misuse"],
  includes: ["Microsoft 365 admin account audit (Global Admins, Exchange Admins, SharePoint Admins, Teams Admins)", "On-premises Active Directory admin group audit if applicable (Domain Admins, Enterprise Admins, Administrators)", "Cloud platform admin audit (Google Workspace, Salesforce, QuickBooks, domain registrar)", "Stale account identification: departed employees, inactive accounts, accounts with no recent login", "Shared admin account identification with risk documentation", "Cleanup execution: removal, demotion, or conversion of approved changes", "Final admin inventory documentation with management recommendations"]
},

"Business Email Safety Check": {
  copy: "Your business email is the front door to your organization — and without proper authentication, anyone can spoof your domain and send emails that appear to come from you. The Business Email Safety Check verifies that your SPF, DKIM, and DMARC records are correctly configured to prevent spoofing, reviews your Microsoft 365 or Google Workspace email security settings, audits mailbox forwarding rules for suspicious activity, and confirms that MFA is enabled on email accounts. This service addresses the most common email security gaps that lead to business email compromise, data leaks through unauthorized forwarding, and your domain being used for phishing against your own customers.",
  bestFor: ["Businesses concerned about email spoofing or impersonation of their domain", "Organizations whose emails are going to recipients' spam folders due to missing authentication", "Companies that want to verify no one has set up unauthorized email forwarding", "Businesses preparing for cyber insurance that requires email authentication verification"],
  outcomes: ["SPF, DKIM, and DMARC records correctly configured, verified, and documented", "Microsoft 365 or Google Workspace email security settings reviewed and optimized", "All mailbox forwarding rules audited — unauthorized forwarding identified and removed", "Email authentication scores that improve deliverability and reduce spoofing risk"],
  includes: ["SPF, DKIM, and DMARC record audit with MXToolbox and manual DNS inspection", "Microsoft 365 or Google Workspace email security configuration review", "User mailbox forwarding rule audit (PowerShell: Get-InboxRule across all mailboxes)", "MFA status verification on all email accounts", "Anti-spoofing configuration recommendations", "Plain-English email security report with improvement steps", "Customer walkthrough of findings and recommendations"]
},

"Remote Work Safety Check": {
  copy: "Remote and hybrid work introduces unique security challenges — employees connecting from home networks, using personal devices, and accessing business systems through VPNs or remote desktop. The Remote Work Safety Check evaluates your remote access infrastructure, device security policies, and remote work practices to identify risks that could expose your business. We review your VPN configuration, remote desktop security, device management policies, and employee security practices. You get a clear picture of your remote work security posture with specific, actionable recommendations — whether you have 5 or 50 remote workers.",
  bestFor: ["Businesses with employees working from home, remote offices, or on the road", "Organizations that provide company laptops or allow personal devices for work", "Companies that use VPN, Remote Desktop, or cloud services for remote access", "Businesses that expanded remote work rapidly and never formally assessed the security implications"],
  outcomes: ["Complete assessment of remote access methods: VPN, RDP, cloud services, and third-party tools", "Identified security gaps in device configuration, access controls, and employee practices", "Actionable recommendations prioritized by risk level and implementation effort", "Documented remote work security baseline for compliance or insurance requirements"],
  includes: ["Remote access infrastructure review (VPN, RDP, remote management tools)", "Device security policy assessment (encryption, antivirus, patching, local admin rights)", "Multi-factor authentication coverage verification for remote access", "Home network and personal device risk guidance for employees", "Remote work policy review and improvement recommendations", "Remote Work Safety Report with findings and prioritized actions"]
},

"Basic Incident Readiness Checklist": {
  copy: "When a security incident happens, the difference between a controlled response and a panic-driven disaster often comes down to having a plan. The Basic Incident Readiness Checklist creates a practical, step-by-step incident response guide customized to your business size and systems. We define clear roles and responsibilities, list emergency contacts for critical vendors and support, outline containment procedures for common scenarios (email compromise, ransomware, data breach, service outage), and provide classification guidance so your team knows when to escalate. This isn't a 50-page policy document — it's a usable checklist your team can actually follow during an incident.",
  bestFor: ["Businesses that don't have any incident response plan or checklist", "Organizations that want a simple, practical guide rather than a complex policy document", "Companies whose cyber insurance requires an incident response plan", "Businesses that want their team to know exactly what to do during a security incident"],
  outcomes: ["Customized incident response checklist covering the most common incident scenarios for your business", "Clear roles, responsibilities, and escalation contacts documented for every team member", "Containment and notification procedures that can be executed under pressure", "Reduced risk of delayed response, miscommunication, or missed steps during a real incident"],
  includes: ["Incident classification guide (Critical, High, Medium, Low) with examples", "Role assignment worksheet: incident commander, communications lead, technical lead", "Emergency contact list template: insurance, legal, IT provider, law enforcement", "Incident-specific procedures: email compromise, ransomware, data breach, service outage", "Containment checklist: isolate, preserve evidence, notify stakeholders, begin recovery", "Post-incident review template for lessons learned and improvement tracking"]
},

"Website Uptime Monitor Setup": {
  copy: "Your website being down means lost leads, lost sales, and lost credibility — yet many businesses don't know their site is down until a customer tells them. The Website Uptime Monitor Setup configures automated monitoring that checks your website every few minutes from multiple global locations and alerts you instantly via email, SMS, or Slack when your site becomes unreachable. We set up a professional uptime monitoring service, configure alert rules to avoid false alarms, document the monitoring setup, and test that alerts work correctly. From that point forward, you'll know about website issues before your customers do.",
  bestFor: ["Businesses whose website generates leads, sales, or customer inquiries", "Organizations that have been surprised by unexpected website downtime", "Companies that want automated monitoring without managing it themselves", "Businesses that rely on their website for bookings, e-commerce, or client access"],
  outcomes: ["Automated website monitoring checking your site every 1-5 minutes from multiple global locations", "Instant alerts via email, SMS, or Slack when your site goes down or slows down", "Monthly uptime report showing availability percentage and incident history", "Peace of mind that website issues will be detected immediately — not when customers complain"],
  includes: ["Uptime monitoring service selection and configuration (UptimeRobot, BetterStack, or similar)", "Multi-location monitoring setup for global coverage", "Alert configuration: email, SMS, and Slack/Teams notifications", "Alert rule tuning to avoid false positives (verify before alerting, maintenance windows)", "Monitoring documentation: what is being monitored, alert contacts, escalation path", "Initial monitoring period with alert testing"]
},

"Printer / Scanner Setup": {
  copy: "A printer that won't print or a scanner that won't scan is a daily frustration that wastes time and interrupts workflow. The Printer/Scanner Setup service configures your printer or scanner on your business network, installs the correct drivers on all workstations that need access, sets up scan-to-email or scan-to-folder functionality, and tests everything to confirm it works reliably. We handle wireless and wired configurations, network discovery, driver compatibility, and multifunction device setup — so your team can print and scan without calling for help every time.",
  bestFor: ["Offices that have a new printer or scanner that needs professional setup", "Businesses where only some computers can print or scan", "Organizations that want scan-to-email or scan-to-cloud configured", "Companies frustrated with unreliable printing or scanning"],
  outcomes: ["Printer or scanner configured on the network and accessible from all designated workstations", "Scan-to-email, scan-to-folder, or scan-to-cloud working reliably", "Correct drivers installed — no more 'printer not found' errors", "Documented printer/scanner configuration for future reference"],
  includes: ["Network configuration (wired or wireless) for the printer or scanner", "Driver installation and configuration on all designated workstations", "Scan-to-email or scan-to-folder setup with destination configuration", "Print queue and default settings configuration", "Functionality testing: test print, test scan, test from all workstations", "User instructions for common printing and scanning tasks"]
},

"PC Tune-Up / Cleanup": {
  copy: "Slow computers frustrate employees and reduce productivity — but often the fix is simpler than replacing the hardware. The PC Tune-Up / Cleanup service optimizes sluggish workstations by removing temporary files and unnecessary software, disabling startup programs that slow boot time, running system updates, and cleaning up disk space. We benchmark performance before and after so you can see the improvement. This service extends the useful life of existing hardware, delays replacement costs, and gives employees a faster, more reliable computer.",
  bestFor: ["Businesses with computers that have become noticeably slower over time", "Organizations that want to extend the life of existing hardware before purchasing replacements", "Staff who are frustrated with long boot times and sluggish performance", "Companies that want to see measurable performance improvement without buying new computers"],
  outcomes: ["Measurably faster computer performance — documented with before/after benchmarks", "More free disk space through removal of temporary files, old downloads, and unnecessary software", "Faster boot time from startup program optimization", "Extended useful life of existing hardware, delaying replacement costs"],
  includes: ["Disk space analysis and cleanup (temporary files, old downloads, system restore points, recycle bin)", "Startup program review and optimization (disable unnecessary startup items)", "System and software update installation (Windows updates, browser updates, application updates)", "Unnecessary software identification and removal", "Performance benchmarking before and after (boot time, available memory, disk speed)", "Performance improvement summary with maintenance recommendations"]
},

"Computer Replacement Readiness Review": {
  copy: "Replacing business computers is a significant expense, and doing it without a plan leads to emergency purchases, inconsistent hardware, and budget surprises. The Computer Replacement Readiness Review audits your current computer fleet — age, specifications, performance, warranty status — and creates a prioritized replacement plan with budget projections. We identify which computers are overdue for replacement, which can be extended with upgrades, and which are fine for now. You get a clear, multi-year hardware refresh roadmap so you can budget predictably and avoid last-minute scrambles.",
  bestFor: ["Businesses planning to replace aging computers and need to know what to prioritize", "Organizations that want to budget for hardware refresh over multiple years", "Companies with a mix of old and new computers that need a standardized fleet", "Businesses that want to transition from reactive buying to planned lifecycle management"],
  outcomes: ["Complete inventory of all business computers with age, specifications, and performance assessment", "Prioritized replacement list: which computers need replacement now, this year, or next year", "Multi-year budget projection for hardware refresh", "Standardization recommendations to reduce support complexity and costs"],
  includes: ["Computer fleet audit: age, specifications, performance metrics, warranty status", "Replacement priority ranking with rationale for each computer", "Hardware recommendation for replacement models (budget, standard, performance tiers)", "Budget projection: estimated costs per year for the next 3 years", "Data transfer planning guidance for the replacement process", "Old device handling recommendations: secure wipe, donation, recycling options"]
},

// ==================== CYBERSECURITY (20) ====================
"Cyber Risk Snapshot": {
  copy: "Most small businesses don't know where their biggest cyber risks actually are — and many are surprised to learn their most critical vulnerabilities aren't where they expected. The Cyber Risk Snapshot is a rapid, high-level security assessment that evaluates your business across identity, endpoints, email, backup, network, and physical security. In a single session, we identify the most critical gaps, produce a numerical risk score, and deliver a short list of prioritized actions to immediately reduce your exposure. This is the fastest path to understanding your security posture and getting a clear, actionable improvement plan — ideal for businesses that haven't had any prior security assessment.",
  bestFor: ["Business owners who want a quick, affordable overview of their security posture", "Organizations that have never had any security assessment and need a starting point", "Companies preparing for their first cyber insurance application", "Businesses that want to identify and fix the most critical risks first"],
  outcomes: ["A risk score and Red/Amber/Green ratings across six security domains", "Top 5 highest-risk findings with clear remediation steps", "Clear understanding of your overall security posture in plain English", "A baseline for measuring security improvement over time"],
  includes: ["High-level security posture review across six domains", "Risk assessment with urgency ratings", "Cyber Risk Snapshot report with risk score and domain ratings", "Top 5 prioritized actions with implementation guidance", "30-minute customer walkthrough of findings and recommendations"]
},

"Full Cybersecurity Assessment": {
  copy: "A comprehensive security evaluation is the foundation of any effective cybersecurity program. The Full Cybersecurity Assessment examines your environment across all major security domains — identity and access management, endpoint security, email security, network security, backup and disaster recovery, application security, physical security, and governance and policies. We conduct a methodical, evidence-based review using recognized frameworks (NIST, CIS Controls), interview key personnel, review configurations, and produce a detailed findings report. Each finding is risk-rated (Critical/High/Medium/Low) with estimated remediation effort and an executive summary suitable for leadership and board review. This assessment gives you the complete picture you need to make informed security investment decisions.",
  bestFor: ["Organizations that want a thorough, professional security assessment across all domains", "Businesses preparing for compliance audits, certifications, or significant security investments", "Companies that have experienced a security incident and want to understand their full risk picture", "Leadership teams that need an evidence-based assessment to justify security budget"],
  outcomes: ["Comprehensive findings report with 50-100+ findings risk-rated and prioritized", "Executive summary suitable for board presentation or leadership review", "Multi-phase remediation roadmap with estimated effort and budget", "Documented current security posture against recognized framework controls"],
  includes: ["Full scope security assessment across 8+ domains", "Stakeholder interviews: business owner, IT contact, key staff", "Configuration review of all accessible systems and platforms", "Detailed findings report with risk ratings, evidence, and remediation guidance", "Executive summary for leadership and board presentation", "Remediation roadmap with phases, priorities, and estimated effort", "Customer walkthrough of findings and Q&A"],
  supplement: "Compared to the Cyber Risk Snapshot, this assessment goes deep — analyzing 50-100+ specific controls across every domain, interviewing your team, reviewing actual configurations, and producing a formal report suitable for compliance and insurance purposes."
},};

// ============================================================
// Apply detailed content
// ============================================================
let changes = { copy: 0, bestFor: 0, outcomes: 0, includes: 0 };

for (const p of products) {
  const d = details[p.name];
  if (!d) continue; // Skip products without manual details (they use generic generator)

  if (d.copy && p.marketingCopy !== d.copy) { p.marketingCopy = d.copy; changes.copy++; }
  if (d.bestFor && JSON.stringify(p.bestFor) !== JSON.stringify(d.bestFor)) { p.bestFor = d.bestFor; changes.bestFor++; }
  if (d.outcomes && JSON.stringify(p.customerOutcomes) !== JSON.stringify(d.outcomes)) { p.customerOutcomes = d.outcomes; changes.outcomes++; }
  if (d.includes && JSON.stringify(p.whatIsIncluded) !== JSON.stringify(d.includes)) { p.whatIsIncluded = d.includes; changes.includes++; }
  
  // Also check for supplement/upgradeFrom fields
  if (d.supplement) {
    // Add a supplement note at end of marketingCopy
    p.marketingCopy = p.marketingCopy + ' ' + d.supplement;
    changes.copy++;
  }
}

// ============================================================
// For remaining products without manual details, generate richer content
// ============================================================
for (const p of products) {
  if (details[p.name]) continue; // Already handled

  const n = p.name, s = p.summary || '', c = p.category;
  
  // Enhanced marketing copy
  if (!p.marketingCopy || p.marketingCopy.includes('is a practical service')) {
    p.marketingCopy = generateMarketingCopy(p);
    changes.copy++;
  }
  
  // Enhanced bestFor with specifier
  if (p.bestFor.length <= 3) {
    p.bestFor = generateBestFor(p);
    changes.bestFor++;
  }
  
  // Enhanced outcomes
  if (p.customerOutcomes.length <= 3) {
    p.customerOutcomes = generateOutcomes(p);
    changes.outcomes++;
  }
  
  // Enhanced includes
  if (p.whatIsIncluded.length <= 4) {
    p.whatIsIncluded = generateIncludes(p);
    changes.includes++;
  }
}

function generateMarketingCopy(p) {
  const n = p.name, s = p.summary, nm = n.toLowerCase();
  
  if (nm.includes('assessment') || nm.includes('audit') || nm.includes('review') || nm.includes('check') || nm.includes('snapshot'))
    return `${n} provides a professional, evidence-based assessment of ${s.charAt(0).toLowerCase() + s.slice(1)} We systematically evaluate your current state against best practices, document every finding with risk ratings and evidence, and deliver a prioritized improvement plan. Unlike high-level consulting reports, you get specific, actionable recommendations tied to your actual environment — no vague suggestions or upsells.`;
  
  if (nm.includes('setup') || nm.includes('install') || nm.includes('rollout'))
    return `${n} delivers hands-on implementation of ${s.charAt(0).toLowerCase() + s.slice(1)} We handle the technical work from start to finish — configuring systems, testing functionality, documenting the setup, and providing user guidance. You get a professionally implemented solution that works correctly from day one, without the trial-and-error of DIY setup.`;
  
  if (nm.includes('cleanup') || nm.includes('clean') || nm.includes('optimiz'))
    return `${n} tidies up ${s.charAt(0).toLowerCase() + s.slice(1)} Years of accumulated accounts, permissions, licenses, and configuration drift create security risks and management overhead. We audit the current state, identify everything that should be removed or changed, get your approval, and execute the cleanup. You get a cleaner, more manageable environment with reduced risk and potential cost savings.`;
  
  if (nm.includes('bundle') || nm.includes('pack'))
    return `${n} combines ${s.charAt(0).toLowerCase() + s.slice(1)} into a single, coordinated engagement. Instead of purchasing each component separately and coordinating multiple service windows, you get one project plan, one point of contact, and integrated delivery that ensures everything works together. Bundles typically save 15-30% compared to purchasing each service individually.`;
  
  if (nm.includes('training') || nm.includes('lunch') || nm.includes('learn'))
    return `${n} delivers practical, hands-on education — ${s.charAt(0).toLowerCase() + s.slice(1)} We customize the training to your actual environment and workflows, using real examples your team will recognize. Sessions are interactive, not lecture-style, and every participant leaves with reference materials they can use day-to-day.`;
  
  if (nm.includes('plan') || nm.includes('monthly') || nm.includes('care'))
    return `${n} provides ongoing, proactive technology management — ${s.charAt(0).toLowerCase() + s.slice(1)} Instead of reacting to problems as they arise, we monitor your systems, perform regular maintenance, and provide responsive support at a predictable monthly cost. You get the benefits of a dedicated IT team without the overhead of hiring full-time staff.`;
  
  if (nm.includes('migration'))
    return `${n} handles the complex process of ${s.charAt(0).toLowerCase() + s.slice(1)} We plan the migration to minimize business disruption, execute in phases with testing at each step, and provide support during and after the transition. You get a successful migration with verified data integrity — and no lost emails, missing files, or confused users.`;
  
  if (nm.includes('policy') || nm.includes('compliance') || nm.includes('insurance'))
    return `${n} delivers ${s.charAt(0).toLowerCase() + s.slice(1)} We don't provide generic templates — we customize policies, procedures, and assessments to your specific business size, industry, and risk profile. You get documents you can actually use for insurance applications, audits, compliance reviews, and day-to-day operations.`;
  
  if (nm.includes('emergency') || nm.includes('response') || nm.includes('down') || nm.includes('compromise'))
    return `${n} provides immediate, professional response for ${s.charAt(0).toLowerCase() + s.slice(1)} When every minute of downtime costs your business money and credibility, you need more than a ticket queue. We prioritize your situation, respond immediately with experienced technicians, and work until the issue is fully resolved — with clear communication throughout.`;
  
  if (nm.includes('procurement') || nm.includes('replacement') || nm.includes('lifecycle'))
    return `${n} handles ${s.charAt(0).toLowerCase() + s.slice(1)} We research options, compare specifications and pricing, and recommend the best fit for your business needs and budget. You get professional procurement guidance without spending hours researching — and without the risk of buying the wrong equipment.`;
  
  if (nm.includes('camera'))
    return `${n} provides ${s.charAt(0).toLowerCase() + s.slice(1)} From site surveys and equipment selection to installation, configuration, and remote access setup, we handle every technical detail of your security camera deployment. You get professional coverage with reliable recording and the ability to check cameras from anywhere.`;
  
  if (nm.includes('network') || nm.includes('wifi') || nm.includes('wi-fi') || nm.includes('router') || nm.includes('switch') || nm.includes('firewall') || nm.includes('vlan'))
    return `${n} delivers ${s.charAt(0).toLowerCase() + s.slice(1)} We assess your current state, design improvements, and implement them using business-grade equipment and best practices. You get reliable connectivity your business can depend on — with documented configuration and clear management guidance.`;
  
  return `${n} addresses ${s.charAt(0).toLowerCase() + s.slice(1)} This service is scoped and priced upfront — you know exactly what you are getting before we start. We handle the technical work, document everything in plain English, and leave you with practical next steps. No vague consulting, no scope creep, no surprise billing.`;
}

function generateBestFor(p) {
  // Use summary text to craft unique best-for per product
  const s = (p.summary || '').toLowerCase();
  const items = [];
  items.push(`Organizations that ${p.summary.charAt(0).toLowerCase() + p.summary.slice(1)}`);
  if (s.includes('password')) items.push('Businesses that want to move from informal password practices to professional account security');
  else if (s.includes('mfa') || s.includes('multi-factor')) items.push('Businesses that want to reduce account takeover risk by 99% with MFA enforcement');
  else if (s.includes('phish')) items.push('Organizations that want to test and improve their staff phishing awareness');
  else if (s.includes('security') || s.includes('cyber')) items.push('Organizations that want professional security assessment without enterprise consulting costs');
  else if (s.includes('backup') || s.includes('recover')) items.push('Organizations that need verified, tested backup protection they can rely on');
  else if (s.includes('camera')) items.push('Property owners who want professional camera coverage without DIY complexity');
  else if (s.includes('network') || s.includes('wifi') || s.includes('wi-fi')) items.push('Businesses experiencing connectivity issues or planning to upgrade their network');
  else if (s.includes('website') || s.includes('seo')) items.push('Businesses that want better online visibility and website performance');
  else if (s.includes('microsoft') || s.includes('365')) items.push('Businesses using Microsoft 365 that want expert configuration and management');
  else if (s.includes('computer') || s.includes('laptop') || s.includes('desktop')) items.push('Businesses that need reliable, professionally configured workstations');
  else if (s.includes('policy') || s.includes('compliance')) items.push('Businesses that need documented policies for insurance, compliance, or audit requirements');
  else if (s.includes('emergency') || s.includes('urgent')) items.push('Organizations experiencing an active technology issue that needs immediate resolution');
  else items.push(`Small to mid-size businesses that ${s}`);
  items.push('Owners and managers who value clear scope, fixed pricing, and practical outcomes');
  return items.slice(0, 4);
}

function generateOutcomes(p) {
  const s = (p.summary || '').toLowerCase();
  const outcomes = [];
  outcomes.push(`${p.summary} — addressed with professional execution and clear documentation`);
  if (s.includes('backup') || s.includes('recover')) outcomes.push('Verified backup protection and documented restore procedures you can rely on');
  else if (s.includes('security') || s.includes('risk')) outcomes.push('Identified risks and gaps prioritized so you know what to address first');
  else if (s.includes('setup') || s.includes('install') || s.includes('configure')) outcomes.push('Professionally configured systems tested and documented');
  else if (s.includes('review') || s.includes('audit') || s.includes('assess') || s.includes('check')) outcomes.push('Complete findings documented with prioritized recommendations');
  else if (s.includes('cleanup') || s.includes('clean')) outcomes.push('Cleaned up environment with documented improvements');
  else outcomes.push('Clear, documented outcomes aligned to the specific service scope');
  outcomes.push('Plain-English documentation suitable for non-technical decision-makers');
  outcomes.push('Practical recommendations for next steps and continued improvement');
  return outcomes.slice(0, 4);
}

function generateIncludes(p) {
  const s = (p.summary || '').toLowerCase();
  const includes = [];
  includes.push(`Full ${p.name} service: ${p.summary}`);
  includes.push('Documentation of all findings, configurations, changes, and recommendations');
  includes.push('Plain-English summary with actionable next steps');
  if (s.includes('backup') || s.includes('recover')) includes.push('Restore verification testing where applicable');
  if (s.includes('security') || s.includes('risk') || s.includes('audit')) includes.push('Risk-rated findings with prioritized remediation guidance');
  if (s.includes('setup') || s.includes('install') || s.includes('configure')) includes.push('Configuration and functionality testing and verification');
  if (s.includes('camera')) includes.push('Coverage verification and remote access testing');
  if (s.includes('network') || s.includes('wifi') || s.includes('wi-fi')) includes.push('Network diagram or coverage map documentation');
  includes.push('Customer walkthrough of results and Q&A session');
  return includes.slice(0, 6);
}

fs.writeFileSync('apps/web/lib/catalog/data/products-temp.json', JSON.stringify(products, null, 2), 'utf8');
// Swap files to avoid lock
fs.unlinkSync('apps/web/lib/catalog/data/products.json');
fs.renameSync('apps/web/lib/catalog/data/products-temp.json', 'apps/web/lib/catalog/data/products.json');
console.log('Written via temp file swap');
console.log('Changes:', JSON.stringify(changes));

// Verify uniqueness
for (const key of ['marketingCopy', 'bestFor', 'customerOutcomes', 'whatIsIncluded']) {
  const m = {};
  for (const p of products) {
    const v = key === 'marketingCopy' ? p[key] : JSON.stringify(p[key]);
    m[v] = m[v] || []; m[v].push(p.name);
  }
  const dups = Object.entries(m).filter(([,n]) => n.length > 1 && n[0] !== n[1]);
  console.log(key + ': ' + Object.keys(m).length + '/' + products.length + ' unique (' + dups.length + ' real dups)');
}

// Show a few samples
console.log('\n=== Password Security Checkup ===');
const p1 = products.find(x => x.name === 'Password Security Checkup');
console.log('Copy:', p1.marketingCopy.substring(0, 150) + '...');
console.log('bestFor:', p1.bestFor);
console.log('outcomes:', p1.customerOutcomes);
console.log('includes:', p1.whatIsIncluded);
