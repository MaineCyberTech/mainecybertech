const fs = require("fs");

const products = JSON.parse(fs.readFileSync("apps/web/lib/catalog/data/products.json", "utf8"));

// ============================================================
// Generate unique marketingCopy without the generic template
// ============================================================
function generateMarketingCopy(p) {
  const name = p.name;
  const summary = p.summary || "";
  const cat = p.category;

  // Detailed descriptions per product
  const details = {
    // Quick Fixes
    "Password Security Checkup":
      "We review how your business handles passwords — identifying shared accounts, weak passwords, and exposure risks. You get a clear picture of your password hygiene and a practical plan for improving it, including password manager readiness.",
    "MFA Setup Session":
      "We audit your critical accounts for multi-factor authentication coverage, then enable MFA on the most important ones. You get hands-on configuration, staff guidance, and verification that everything works correctly.",
    "Phishing Readiness Mini Audit":
      "We assess how your staff currently handles suspicious emails by reviewing your email security settings and running a safe phishing awareness check. You get a findings report with risk ratings and a targeted training path.",
    "Security Score Snapshot":
      "We evaluate your organization across five key risk areas — identity, endpoint, email, backup, and admin access — and produce a numerical security score. You get a plain-English report with prioritized quick-win recommendations.",
    "Admin Account Cleanup":
      "We audit all administrator accounts across your systems, identify stale or unused privileged accounts, and recommend removals. You get a complete inventory of who has access to what, with a privilege reduction plan.",
    "Business Email Safety Check":
      "We review your email authentication (SPF, DKIM, DMARC), mailbox forwarding rules, and MFA status. You get a verified email security posture with identified spoofing risks and remediation steps.",
    "Remote Work Safety Check":
      "We assess how your remote access is configured — VPN, remote desktop, device security policies. You get a clear picture of your remote work security posture with actionable recommendations.",
    "Basic Incident Readiness Checklist":
      "We create a practical, actionable incident response checklist customized for your business. You get clear roles, contact information, and step-by-step procedures for common incident scenarios.",
    "Website Uptime Monitor Setup":
      "We configure automated website monitoring that checks your site every few minutes and alerts you when it goes down. You get notifications via email, SMS, or Slack and peace of mind that your site is being watched.",
    "Printer / Scanner Setup":
      "We configure your printer or scanner on your network, install drivers on workstations, and set up scan-to-email or scan-to-folder. You get a reliable printing and scanning setup that just works.",
    "PC Tune-Up / Cleanup":
      "We clean up disk space, optimize startup programs, install software updates, and benchmark performance. You get a faster, more reliable computer with extended useful life.",
    "Computer Replacement Readiness Review":
      "We audit your current hardware — age, specs, performance — and create a prioritized replacement plan. You get a clear budget and timeline for upgrading aging computers with minimal disruption.",

    // Cybersecurity
    "Cyber Risk Snapshot":
      "We conduct a high-level security posture review across identity, endpoints, email, backup, and network basics. You get a risk score and a short list of prioritized actions to reduce your most critical exposures.",
    "Full Cybersecurity Assessment":
      "We perform a comprehensive security evaluation across all major domains — identity, endpoints, email, backup, network, policies, and physical security. You get a detailed findings report with risk-rated gaps and a multi-phase remediation roadmap.",
    "M365 Security Assessment":
      "We review your Microsoft 365 tenant configuration — Conditional Access, MFA, threat protection, and Secure Score. You get a clear picture of your M365 security posture with prioritized remediation steps.",
    "Small Business Ransomware Readiness Review":
      "We evaluate your backup and recovery capabilities, email security, endpoint protection, and user awareness. You get a ransomware readiness score and a practical action plan to improve your resilience.",
    "Nonprofit Cyber Readiness Review":
      "We conduct a budget-conscious security assessment tailored to nonprofit constraints. You get practical recommendations that fit your resources and documentation that supports grant and insurance requirements.",
    "Vendor Access Review":
      "We audit which third-party vendors have access to your systems, what they can access, and whether they still need it. You get a complete vendor inventory with access reduction recommendations and a vendor management process.",
    "Admin Privilege Review":
      "We discover all administrative accounts across your systems, review privilege levels, and identify excessive rights. You get a complete admin inventory with a least-privilege remediation plan.",
    "MFA Enforcement Project":
      "We plan and execute organization-wide MFA enforcement across all applicable platforms. You get a phased rollout with user guidance, exception handling, and monitoring to ensure adoption.",
    "Password Manager Rollout":
      "We select, deploy, and configure a business password manager for your organization. You get organization-wide setup, user onboarding, secure sharing policies, and admin console handoff.",
    "Email Security Hardening":
      "We optimize your email security settings — anti-phishing, anti-spam, SPF/DKIM/DMARC, and mail flow rules. You get hardened email protection that reduces spam, phishing, and spoofing reaching your staff.",
    "Endpoint Protection Rollout":
      "We deploy business-grade endpoint protection on all your workstations and servers. You get centralized management, policy configuration, and ongoing monitoring for threats.",
    "Local Admin Removal Project":
      "We audit which users have local administrator rights on their computers, test removal with a pilot group, then roll out across the organization. You get reduced malware risk and a documented exception process.",
    "BitLocker Encryption Rollout":
      "We enable full disk encryption on all eligible Windows devices with BitLocker. You get encryption policy configuration, deployment across devices, and secure recovery key backup.",
    "DNS Filtering Setup":
      "We configure DNS filtering to block malicious websites, malware domains, and optionally inappropriate content at the network level. You get an additional security layer that protects all devices on your network.",
    "Security Awareness Training Setup":
      "We select and configure a security awareness training platform, enroll your users, and schedule initial training. You get measurable improvements in staff security awareness with phishing simulation capability.",
    "Incident Response Plan Starter":
      "We help you create a documented incident response plan tailored to your business size and risks. You get clear roles, procedures for different incident types, and a contact tree for escalation.",
    "Cyber Insurance Readiness Package":
      "We review your cyber insurance application, assess your security controls against common requirements, and help you address gaps. You get application-ready documentation and improved insurability.",
    "Security Awareness Lunch & Learn":
      "We deliver a live, engaging security training session to your staff — either onsite or virtual. You get practical, real-world examples that help your team recognize phishing emails and common scams.",
    "Owner/Admin Security Training":
      "We provide an executive-level security briefing for business owners and decision-makers. You get a business-focused understanding of security risks, liability, and how to prioritize security investments.",
    "Staff Security Starter":
      "We deliver a basic security awareness session covering passwords, phishing, and incident reporting. You get foundational security knowledge for your team and reference materials to reinforce learning.",

    // Microsoft 365
    "Microsoft 365 Tenant Setup":
      "We create and configure your Microsoft 365 tenant from scratch — domain verification, user setup, security defaults, and MFA. You get a properly configured tenant ready for daily business use.",
    "Microsoft 365 Tenant Cleanup":
      "We audit your entire Microsoft 365 tenant — users, groups, mailboxes, licenses, and permissions — and clean up stale accounts, unused licenses, and disorganized structure. You get a cleaner, more secure, and potentially lower-cost tenant.",
    "Microsoft 365 Monthly Admin":
      "We handle your ongoing Microsoft 365 administration — user adds, changes, removes, license management, security checks, and help desk support. You get professional M365 management without hiring full-time staff.",
    "Microsoft 365 Security Baseline":
      "We configure your Microsoft 365 tenant to Microsoft's security best practices — Conditional Access, MFA, threat protection, and Secure Score improvements. You get a hardened security posture that meets insurance requirements.",
    "Microsoft 365 Backup Setup":
      "We configure automated backup for your Exchange Online, SharePoint, and OneDrive data. You get point-in-time recovery capability for your M365 data, protecting against accidental deletion, ransomware, and retention gaps.",
    "Microsoft 365 Migration Lite":
      "We migrate your email, contacts, and calendars from your previous platform to Microsoft 365. You get a guided migration with minimal disruption and basic configuration ready for daily use.",
    "Microsoft 365 Migration Full":
      "We execute a complete migration of email, files, Teams, and SharePoint to Microsoft 365. You get full migration planning, cutover management, staff training, and post-migration support.",
    "Microsoft 365 License Optimization":
      "We audit your current Microsoft 365 license assignments against actual usage and recommend optimized plans. You get reduced monthly licensing costs and understanding of underutilized features.",
    "Shared Mailbox Cleanup":
      "We audit all shared mailboxes in your tenant, identify stale or unused ones, and clean up permissions. You get an organized shared mailbox structure with clear ownership and proper delegation.",
    "OneDrive and SharePoint Permissions Review":
      "We audit file and folder permissions across OneDrive and SharePoint, identifying oversharing and external access risks. You get a clear picture of who has access to what with cleanup recommendations.",
    "New Employee M365 Setup":
      "We create and configure new employee accounts in Microsoft 365 before their first day — email, Teams, OneDrive, and department-specific permissions. You get a consistent, efficient onboarding process.",
    "Departing Employee Lockdown":
      "We secure accounts when employees leave — removing access, forwarding email, transferring files, and documenting the process. You get a complete offboarding that protects company data.",
    "Teams Cleanup Mini Project":
      "We audit your Teams environment — channels, permissions, and inactive teams — and clean up the clutter. You get an organized Teams structure with archived stale teams and clear naming conventions.",
    "Microsoft Secure Score Review":
      "We analyze your Microsoft Secure Score and implement high-impact security recommendations. You get measurable improvement in your Secure Score with a roadmap for remaining actions.",
    "M365 Launch Bundle":
      "We coordinate the complete launch of your Microsoft 365 environment — tenant setup, user creation, basic migration, and staff training. You get everything needed to start using M365 productively.",
    "M365 Secure Bundle":
      "We implement comprehensive Microsoft 365 security — baseline configuration, MFA enforcement, Conditional Access, threat protection, and Secure Score optimization. You get a hardened tenant ready for insurance reviews.",
    "M365 Cleanup Bundle":
      "We clean up your entire Microsoft 365 tenant — users, licenses, mailboxes, Teams, SharePoint permissions, and shared mailboxes. You get an organized, optimized tenant with potential cost savings.",
    "M365 Managed Bundle":
      "We provide ongoing Microsoft 365 management — monthly admin tasks, quarterly security reviews, help desk support, and strategic guidance. You get professional M365 administration as a monthly service.",

    // Computer Setup & Support
    "New Computer Setup":
      "We configure new computers with operating system updates, business software, security baseline, and data transfer from the old device. You get a ready-to-deploy workstation with consistent configuration.",
    "Business Laptop Security Setup":
      "We secure new laptops with full disk encryption, endpoint protection, security policies, and remote management capability. You get laptops that are protected against theft and ready for business use.",
    "Patch Status Snapshot":
      "We audit the patch status of all your workstations, identifying missing critical updates. You get a clear picture of your patch posture with critical security patches applied and ongoing management recommendations.",
    "Managed Workstation Essentials":
      "We provide basic workstation monitoring, automated antivirus, and patch management. You get visibility into workstation health with essential protection against common threats.",
    "Managed Workstation Protect":
      "We add advanced threat detection, encryption management, and quarterly security reviews to your workstation management. You get comprehensive protection against malware and data loss.",
    "Managed Workstation Complete":
      "We provide full workstation lifecycle management — setup, monitoring, support, patching, encryption, advanced threat protection, and replacement planning. You get complete workstation management with proactive issue resolution.",
    "Laptop Procurement":
      "We research and recommend laptop models that match your business needs and budget, then coordinate purchasing from reliable vendors. You get the right laptops at competitive prices without spending hours researching.",
    "Desktop Procurement":
      "We research and recommend desktop models that balance performance and budget, then coordinate purchasing. You get business-grade desktops that will serve your team for years.",
    "Printer Procurement Help":
      "We assess your printing needs and recommend reliable business printers that won't cause ongoing support issues. You get a printer recommendation matched to your actual volume and usage patterns.",
    "Warranty Tracking":
      "We audit all your device warranties and set up expiration tracking. You get a complete warranty inventory with renewal reminders and replacement planning.",
    "Lifecycle Replacement Plan":
      "We create a multi-year hardware replacement plan based on your current device inventory and age. You get predictable budgeting for technology refresh and reduced emergency hardware purchases.",
    "Workstation Refresh Pack":
      "We manage the entire workstation refresh process — procurement, setup, data transfer, and old device wipe. You get a coordinated hardware upgrade with minimal disruption to your team.",
    "Data Transfer Service":
      "We transfer files, email, and settings from old computers to new ones, preserving your business data. You get a complete data migration with verification and old computer backup before wiping.",
    "Old Device Wipe Coordination":
      "We securely wipe old computers and drives to industry standards, provide certification of destruction, and coordinate environmentally responsible recycling. You get secure data destruction with compliance documentation.",
    "Conference Room Audio Setup":
      "We assess your conference room and recommend audio/video equipment, then install and configure it. You get a meeting room with reliable audio, video, and screen sharing that starts with one button.",
    "Microsoft 365 Basics Training":
      "We deliver live training to your staff on Outlook, Teams, and OneDrive basics. You get a team that is comfortable with M365 tools and more productive in their daily work.",
    "Teams and SharePoint Training":
      "We deliver live training on Teams and SharePoint for effective collaboration and document management. You get a team that uses channels, file sharing, and co-authoring effectively.",

    // Wi-Fi & Networking
    "Wi-Fi Coverage Check":
      "We conduct an on-site Wi-Fi site survey, mapping signal strength and identifying dead zones. You get a coverage heat map with specific recommendations for access point placement or upgrades.",
    "Network Health Check":
      "We assess your network performance, equipment age, and bandwidth utilization. You get a complete network health report with identified bottlenecks, misconfigurations, and prioritized improvements.",
    "Small Office Network Audit":
      "We perform a comprehensive audit of your small office network infrastructure — topology, security, performance, and equipment. You get full network documentation with an improvement roadmap and cost estimates.",
    "Guest Wi-Fi Review":
      "We review your guest Wi-Fi configuration, network isolation, and performance. You get a secure guest network that protects your business traffic while providing reliable connectivity for visitors.",
    "Camera Network Readiness Check":
      "We assess your network's capacity to support security cameras — bandwidth, PoE, and cabling. You get a readiness report with any upgrade recommendations needed before camera installation.",
    "Outdoor Wi-Fi Planning Visit":
      "We visit your property to assess outdoor Wi-Fi coverage needs, considering weather, obstacles, and environmental factors. You get a detailed outdoor coverage plan with equipment recommendations and installation cost estimates.",
    "Firewall Configuration Review":
      "We audit your firewall rules, security policies, and configuration against best practices. You get a hardened firewall with identified misconfigurations removed and documented rule set.",
    "ISP Failover Readiness Review":
      "We assess your current internet failover capabilities and recommend improvements. You get a failover configuration plan that reduces downtime risk from ISP outages.",
    "Basic Router Replacement":
      "We replace your ISP-provided or consumer router with a business-grade model, configure routing, Wi-Fi, and basic firewall. You get improved network reliability and security.",
    "Business Wi-Fi Setup":
      "We install professional access points, configure Wi-Fi with proper security, and set up a guest network. You get reliable wireless coverage across your workspace with business-grade performance.",
    "Guest Wi-Fi Setup":
      "We configure a separate guest Wi-Fi network isolated from your business traffic, with captive portal or password access. You get secure guest connectivity that protects your internal network.",
    "VLAN Setup":
      "We design and configure VLANs to segment your network — separating guest Wi-Fi, cameras, IoT devices, and business traffic. You get improved network security and performance through proper segmentation.",
    "Firewall Setup":
      "We install and configure a business-grade firewall with security policies, VPN, and threat protection. You get professional network security with documented configuration and admin access.",
    "Switch Installation":
      "We install managed switches with proper VLAN, PoE, and port configuration. You get improved network performance and manageability for your growing business needs.",
    "Patch Panel Cleanup":
      "We trace, label, and organize your patch panel and network cabling. You get a professional-looking network closet with labeled cables that make troubleshooting faster.",
    "Network Documentation Package":
      "We create complete network documentation — topology diagrams, equipment inventory, IP scheme, and key configurations. You get professional documentation that reduces dependency on tribal knowledge.",
    "ISP Cutover Support":
      "We coordinate your internet service provider transition — scheduling, DNS changes, and cutover management. You get a smooth ISP change with minimal downtime and old circuit decommissioning.",
    "LTE/5G Backup Internet Setup":
      "We configure automatic LTE or 5G backup internet that activates when your primary connection fails. You get seamless failover with tested and verified backup connectivity.",
    "UniFi Controller Setup":
      "We install and configure the UniFi Controller, adopt your devices, and set up remote management. You get centralized management of your UniFi network with remote access and alerts.",
    "UniFi Wi-Fi Install":
      "We install UniFi access points, configure Wi-Fi with optimization, and integrate with the UniFi Controller. You get professional Wi-Fi with centralized management and guest network support.",
    "UniFi Network Cleanup":
      "We audit your UniFi configuration — device inventory, SSIDs, networks, and settings — and standardize everything. You get a cleaned-up UniFi environment with consistent naming and documented configuration.",
    "UniFi Monthly Management":
      "We perform monthly UniFi health checks, firmware updates, and performance monitoring. You get a professionally managed UniFi environment with proactive issue detection.",
    "UniFi Site Documentation":
      "We document your complete UniFi deployment — device inventory, network topology, SSID configuration, and warranty information. You get comprehensive site documentation for all your UniFi locations.",
    "Small Office Wi-Fi Bundle":
      "We provide access point hardware, installation, configuration, and guest network setup as a coordinated package. You get a complete small office Wi-Fi solution with professional equipment and support.",
    "Business Network Foundation":
      "We install managed switching, business Wi-Fi, firewall, and provide network documentation as a coordinated package. You get a complete network infrastructure foundation for your business.",
    "Outdoor Coverage Bundle":
      "We install weather-resistant outdoor access points with coverage verification. You get reliable outdoor Wi-Fi coverage for your property, integrated with your indoor network.",
    "Camera and Wi-Fi Bundle":
      "We install Wi-Fi and camera systems together with PoE switch configuration. You get a coordinated project with network infrastructure ready for both connectivity and surveillance.",

    // Security Cameras
    "Camera Site Survey":
      "We visit your property to assess camera placement options, coverage areas, and equipment needs. You get a detailed camera placement plan with equipment recommendations and installation cost estimates.",
    "Single Camera Add-On":
      "We install one additional camera and integrate it with your existing camera system. You get expanded coverage with remote access configured for the new camera.",
    "Small Camera System Setup":
      "We install a small camera system (2-4 cameras) with NVR, remote access, and basic motion detection. You get a working security camera system you can view from your phone.",
    "Camera Health Check":
      "We inspect every camera in your system — checking functionality, recording quality, storage, and remote access. You get a complete camera health report with maintenance and upgrade recommendations.",
    "NVR Cleanup":
      "We audit your NVR storage, optimize recording schedules, and configure proper retention policies. You get optimized storage with clear retention and organized recording schedules.",
    "Remote Camera Access Setup":
      "We configure secure remote access to your cameras through VPN or secure proxy, and set up mobile app access. You get the ability to view your cameras from anywhere without exposing them to the internet.",
    "Camera Signage Package":
      "We provide and install professional security camera signs and required notices. You get visible deterrence for potential intruders with compliance-required notices posted.",
    "Camera Maintenance Plan":
      "We perform quarterly camera checks — lens cleaning, recording verification, remote access testing, and storage review. You get proactive camera maintenance that extends system life and prevents issues.",
    "Camera Starter Bundle":
      "We provide a complete entry-level camera system with 2-4 cameras, NVR, installation, and remote access setup. You get an affordable, reliable camera system that covers your essential areas.",
    "Camera Business Bundle":
      "We provide a mid-range camera system with 4-8 cameras, advanced motion detection, smart alerts, and full installation. You get comprehensive coverage with smarter detection and reliable recording.",
    "Camera Complete Bundle":
      "We provide an enterprise-grade camera system with 8+ cameras, AI-powered analytics, server-based NVR, remote access, and maintenance planning. You get maximum coverage with advanced threat detection and ongoing support.",
    "UniFi Camera Install":
      "We install UniFi Protect cameras and integrate them with your existing UniFi network and controller. You get seamless camera management from the same dashboard as your network.",
    "UniFi Door Access Consultation":
      "We assess your door access needs and evaluate UniFi Access compatibility. You get equipment recommendations and installation cost estimates for integrating door access with your UniFi system.",

    // Backup & Recovery
    "Backup Readiness Check":
      "We review your current backup configuration, identify coverage gaps, and test restore capability. You get a clear understanding of what is and isn't protected with recommendations for a complete backup strategy.",
    "Computer Backup Setup":
      "We configure automated backup for business documents on workstations, with off-site storage. You get protected documents with tested restore capability.",
    "Microsoft 365 Backup Setup":
      "We configure automated backup for Exchange Online, SharePoint, and OneDrive. You get point-in-time recovery for your M365 data, protecting against accidental deletion and ransomware.",
    "NAS Backup Setup":
      "We configure backup for your network-attached storage to cloud or secondary location. You get automated NAS backup with verified restore capability.",
    "Cloud Backup Setup":
      "We configure cloud backup for your critical business data with automated scheduling and retention. You get off-site protection against local disasters like fire, theft, or hardware failure.",
    "Backup Restore Test":
      "We perform a test restore of selected files or systems to verify your backup actually works. You get documented restore procedures and confidence that your data can be recovered when needed.",
    "Backup Monitoring Plan":
      "We configure automated backup monitoring with failure alerts and monthly status reviews. You get peace of mind that your backups are running successfully with proactive failure notification.",
    "Disaster Recovery Plan Starter":
      "We help you create a documented disaster recovery plan covering recovery procedures, priorities, and timeframes. You get a practical DR plan that reduces downtime when a disaster occurs.",
    "Backup Starter Bundle":
      "We provide cloud backup setup for critical data, computer backup, and basic monitoring as a coordinated package. You get essential backup protection at an affordable price.",
    "Backup Business Bundle":
      "We provide server and workstation backup, cloud data backup (M365), monitoring, and quarterly restore testing. You get comprehensive backup coverage for your growing business.",
    "Backup Resilience Bundle":
      "We provide full backup coverage for servers, workstations, and cloud data combined with disaster recovery planning and business continuity preparation. You get maximum protection with verified restore capability and documented recovery procedures.",
    "Business Continuity Starter Plan":
      "We help you create a basic business continuity plan covering critical functions, response procedures, and communication. You get a documented plan that reduces downtime when unexpected events occur.",
    "Emergency Contact Sheet":
      "We gather and organize all your critical IT vendor, support, and utility contact information into a single document. You get a printed and digital emergency contact sheet accessible to key staff.",
    "Outage Response Plan":
      "We document step-by-step procedures for common IT outage scenarios with clear roles and communication plans. You get a practical response plan that minimizes downtime through faster, organized response.",
    "Power Protection Review":
      "We audit your critical equipment for UPS and surge protection coverage, assessing sizing and placement. You get power protection recommendations that reduce the risk of equipment damage from power events.",
    "Internet Failover Setup":
      "We configure a secondary internet connection with automatic failover when your primary connection goes down. You get seamless internet redundancy with tested failover operation.",
    "Critical Account Recovery Kit":
      "We inventory your critical accounts, document recovery procedures, and securely store backup access codes. You get a documented recovery kit that prevents being locked out of essential services.",
    "Tabletop Exercise":
      "We facilitate a practice incident response exercise with your team, walking through a realistic scenario. You get tested procedures, identified gaps, and team familiarity with their roles during incidents.",
    "Continuity Binder":
      "We create a physical binder with all your continuity, recovery, and emergency contact information. You get a printed resource that provides quick access to critical information during emergencies.",
    "Small Business Resilience Pack":
      "We combine cloud backup, disaster recovery planning, business continuity preparation, and quarterly reviews into a comprehensive resilience package. You get complete preparedness with tested recovery procedures.",

    // Website & SEO
    "Website Health Check":
      "We test your website's performance, security, and SEO basics, identifying issues and recommending fixes. You get a comprehensive website health report with prioritized improvement recommendations.",
    "Website Speed Snapshot":
      "We benchmark your website's loading speed across devices and identify performance bottlenecks. You get a speed report with specific optimization recommendations.",
    "Website Security Review":
      "We scan your website for vulnerabilities, check SSL/TLS configuration, and verify malware status. You get a security assessment with identified risks and recommended fixes.",
    "Website Backup Setup":
      "We configure automated website backups with off-site storage and restore capability. You get protected website content with point-in-time restore capability.",
    "Monthly Website Care Plan":
      "We perform monthly updates, security scans, backup monitoring, and performance checks for your website. You get proactive website maintenance that prevents issues before they affect your visitors.",
    "Landing Page Build":
      "We design and build a focused landing page for your campaign or service with clear calls-to-action. You get a professional, mobile-responsive page optimized for conversions.",
    "Local SEO Page Build":
      "We create SEO-optimized local service pages with keyword research, content, and local business schema markup. You get pages designed to rank in local search results.",
    "Contact Form Fix":
      "We diagnose and repair broken contact forms, add spam protection, and configure submission notifications. You get a reliable contact form that actually delivers submissions to your team.",
    "Analytics Setup":
      "We install and configure website analytics (GA4 or similar) with key events and goals. You get data-driven insights into your website traffic and conversions.",
    "Cookie/Privacy Basics Review":
      "We audit your website cookies, install a consent banner, and review your privacy policy. You get basic privacy compliance with cookie consent and updated privacy documentation.",
    "Local SEO Snapshot":
      "We assess your current local search visibility, Google Business Profile, and local citations. You get a local SEO baseline with optimization recommendations.",
    "Google Business Profile Optimization":
      "We optimize your Google Business Profile with complete information, photos, categories, and posts. You get improved local search visibility and more customer engagement.",
    "Local Service Page Pack":
      "We create multiple location-specific service pages optimized for local search across your target areas. You get improved visibility in each location with local schema markup.",
    "Blog Starter Pack":
      "We set up a blog on your website with SEO-optimized structure, content strategy, and starter posts. You get a foundation for content marketing and improved search rankings.",
    "Technical SEO Fix Pack":
      "We audit and fix technical SEO issues — crawl errors, broken links, slow pages, and schema markup problems. You get a technically optimized website that search engines can properly index.",
    "Monthly Local SEO Plan":
      "We manage your local SEO monthly — GBP optimization, citation building, review monitoring, and performance reporting. You get ongoing local search improvements and active reputation management.",
    "Review Request System Setup":
      "We configure an automated system that requests customer reviews after service. You get more reviews on Google and other platforms with monitoring and response management.",
    "Schema Markup Setup":
      "We implement structured data markup on your website — LocalBusiness, FAQ, Service, or other relevant schema types. You get rich search results that improve click-through rates.",
    "Website Safety Bundle":
      "We combine backup, security monitoring, SSL configuration, and monthly security scans into a comprehensive website protection package. You get automated protection with proactive threat detection.",
    "Local SEO Starter":
      "We set up or optimize your Google Business Profile, audit local citations, and create a basic local keyword strategy. You get a local SEO foundation with actionable next steps.",
    "Website Growth Bundle":
      "We combine technical SEO, content strategy, analytics configuration, and monthly performance reviews into a comprehensive website growth package. You get data-driven improvements that increase traffic and conversions.",
    "Cloudflare Basic Setup":
      "We configure Cloudflare for your website — DNS, CDN, SSL, and basic security settings. You get faster loading through CDN caching and basic DDoS protection.",
    "Cloudflare Security Tune-Up":
      "We harden your Cloudflare security configuration — WAF rules, rate limiting, bot management, and security settings. You get advanced protection against web threats and attacks.",
    "DNS Cleanup":
      "We audit your DNS zone, identify stale records, and clean up unnecessary entries. You get a clean, documented DNS configuration with reduced security risk.",
    "Email DNS Authentication Fix":
      "We configure SPF, DKIM, and DMARC records for your domain to improve email deliverability and prevent spoofing. You get authenticated email that reaches inboxes instead of spam folders.",
    "Domain Registrar Security Setup":
      "We secure your domain registrar account with MFA, domain locks, and transfer protection. You get reduced risk of domain hijacking with documented management procedures.",
    "Cloudflare Turnstile Setup":
      "We integrate Cloudflare Turnstile on your website forms for bot protection without privacy-invasive CAPTCHAs. You get spam reduction with a frictionless visitor experience.",
    "Cloudflare Redirect Setup":
      "We configure URL redirects in Cloudflare — www to non-www, old URLs to new, and any custom redirect rules. You get properly configured redirects with no broken chains or loops.",
    "Domain Expiration Protection":
      "We audit your domain expiration dates, enable auto-renewal, and set up monitoring alerts. You get protection against accidental domain loss with proactive expiration management.",
    "Cloudflare Monthly Management":
      "We perform monthly Cloudflare reviews — security settings, performance, caching, and recommendations. You get proactive Cloudflare optimization with a monthly recommendations report.",
    "Domain Protection Pack":
      "We audit all your domains, harden security settings, enable auto-renewal, and set up expiration monitoring. You get comprehensive domain protection against loss, hijacking, and expiration.",

    // Compliance & Policies
    "Cyber Insurance Questionnaire Help":
      "We review your cyber insurance application, map your security controls to insurance questions, and help you prepare accurate answers. You get a completed application that accurately represents your security posture.",
    "Acceptable Use Policy Starter":
      "We customize an acceptable use policy template for your business, covering appropriate technology use, prohibited activities, and consequences. You get a clear policy document that protects your business.",
    "Password Policy Starter":
      "We customize a password policy document covering complexity requirements, rotation schedules, and MFA integration. You get clear password standards that meet insurance requirements.",
    "Data Backup Policy Starter":
      "We customize a data backup policy document covering backup schedules, retention requirements, and restore testing procedures. You get documented backup procedures that support compliance requirements.",
    "Incident Response Policy Starter":
      "We customize an incident response policy document covering incident classification, escalation procedures, and notification requirements. You get a documented IR process that meets insurance requirements.",
    "Vendor Access Policy Starter":
      "We customize a vendor access policy document covering access requirements, review procedures, and termination processes. You get documented third-party access controls that reduce vendor risk.",
    "Employee Offboarding Checklist":
      "We create a customized employee offboarding checklist covering account removal, data preservation, and device recovery. You get a consistent process that prevents data loss when employees leave.",
    "Asset Inventory Starter":
      "We discover and document your technology assets — hardware, software, and licenses. You get a complete asset inventory with tracking recommendations.",
    "Security Awareness Policy Starter":
      "We customize a security awareness training policy document covering training frequency, content requirements, and phishing simulation guidelines. You get documented training requirements that meet compliance standards.",
    "Remote Work Policy Starter":
      "We customize a remote work policy document covering device requirements, connection security, and data protection rules. You get clear remote work guidelines that protect your business data.",
    "Cyber Insurance Readiness Bundle":
      "We combine insurance questionnaire assistance, policy document creation, security gap assessment, and remediation guidance into a comprehensive insurance readiness package. You get everything needed to apply for or renew cyber insurance with confidence.",
    "Small Business Policy Pack":
      "We provide a complete set of customized IT policies — acceptable use, password, data backup, and incident response. You get insurance-ready documentation that establishes clear rules for your organization.",
    "Compliance Foundation Bundle":
      "We combine policy creation, asset inventory, access review, and compliance gap assessment into a comprehensive foundation package. You get documented policies, asset tracking, and a clear compliance roadmap.",
    "Risk Register Starter":
      "We facilitate a risk assessment workshop and create a documented risk register with scored risks and treatment plans. You get a formal risk management process that supports insurance and compliance requirements.",
    "Quarterly Access Review":
      "We review user access across your systems quarterly, identifying excessive or inappropriate access. You get clean access controls with an audit trail of each review.",
    "Data Handling Checklist":
      "We assess your data flows, create classification guidelines, and document handling procedures. You get clear data handling rules that reduce breach risk.",
    "PCI/Payment Handling Readiness Review":
      "We review your payment processing flow and assess compliance with PCI requirements. You get a clear understanding of your PCI gaps with a remediation roadmap.",
    "HIPAA-Oriented IT Readiness Review":
      "We review your IT environment against HIPAA security requirements and identify compliance gaps. You get a HIPAA readiness assessment with policy and procedure recommendations.",
    "CMMC/NIST Starter Gap Review":
      "We review your security controls against CMMC or NIST requirements and identify compliance gaps. You get a starter gap analysis with a compliance roadmap.",

    // Monthly IT Plans
    "MCT Essential Care":
      "We provide basic monitoring of your critical systems, help desk support during business hours, monthly health checks, and quarterly reviews. You get entry-level managed IT that catches problems early at a predictable monthly price.",
    "MCT Business Care":
      "We provide full system monitoring, priority help desk support, antivirus and patch management, and monthly reporting. You get comprehensive IT support that keeps your business running smoothly.",
    "MCT Secure Care":
      "We provide everything in Business Care plus advanced endpoint protection (EDR), quarterly security assessments, and security incident response. You get security-focused managed IT that actively protects your business.",
    "MCT Complete Care":
      "We provide everything in Secure Care plus 24/7 monitoring and support, strategic IT planning, roadmap development, and quarterly business reviews. You get complete IT management with no surprises and strategic guidance.",
    "MCT Co-Managed IT":
      "We provide help desk escalation support, project assistance, after-hours coverage, and quarterly strategy reviews to supplement your existing IT team. You get professional backup and specialized expertise without hiring additional staff.",
    "Cyber Basic":
      "We provide basic threat monitoring, weekly vulnerability scanning, and monthly security summary reports. You get entry-level cybersecurity monitoring that alerts you to common threats.",
    "Cyber Plus":
      "We provide everything in Cyber Basic plus advanced endpoint protection (EDR), 24/7 threat monitoring, quarterly security assessments, and incident response support. You get enhanced cybersecurity with active threat detection and response.",
    "Cyber Complete":
      "We provide everything in Cyber Plus plus advanced threat hunting, security awareness training, and quarterly executive security briefings. You get a comprehensive cybersecurity program with proactive threat hunting and strategic guidance.",
    "Managed DNS Plan":
      "We provide professional DNS management, monitoring, security configuration, and change management. You get reliable DNS with security protection and monthly health reporting.",
    "UniFi Monthly Management":
      "We perform monthly UniFi health checks, firmware updates, and performance monitoring. You get a professionally managed UniFi environment with proactive issue detection.",
    "Camera Maintenance Plan":
      "We perform quarterly camera checks, recording verification, remote access testing, and storage review. You get proactive camera maintenance that extends system life.",
    "Backup Monitoring Plan":
      "We provide automated backup monitoring, failure alerts, monthly status reports, and quarterly restore testing. You get verified backup success with proactive failure notification.",
    "Monthly Website Care Plan":
      "We perform monthly website updates, security scans, backup monitoring, and performance checks. You get proactive website maintenance that prevents issues.",
    "Monthly Local SEO Plan":
      "We manage your local SEO monthly — GBP optimization, citation building, review monitoring, and performance reporting. You get ongoing local search improvements.",
    "Compliance Quarterly Review":
      "We review your compliance posture quarterly — access controls, policy updates, security controls, and documentation. You get ongoing compliance maintenance with quarterly assessments.",

    // Emergency Support
    "Emergency Remote Support":
      "We connect remotely to diagnose and resolve your urgent technology issue as quickly as possible. You get immediate remote assistance with documentation of the issue and resolution.",
    "Emergency On-Site Visit":
      "We dispatch a technician to your location for urgent hardware, network, or system issues that require physical presence. You get on-site diagnosis and repair with minimal business disruption.",
    "Email Compromise Response":
      "We respond immediately to secure compromised email accounts, remove unauthorized access, and restore normal operation. You get rapid containment and recovery of compromised email with post-incident recommendations.",
    "Ransomware First Response":
      "We respond immediately to contain a ransomware attack, assess the scope, and initiate recovery procedures. You get rapid containment to prevent spread with a documented recovery plan.",
    "Website Down Emergency":
      "We diagnose and restore your website as quickly as possible, identifying the root cause. You get immediate website recovery with root cause analysis and prevention recommendations.",
    "Network Down Emergency":
      "We diagnose and restore your network connectivity, identifying the root cause of the outage. You get immediate network recovery with documented root cause and prevention steps.",
    "Computer Won't Boot Support":
      "We diagnose and repair computers that won't start, recovering data if needed. You get a working computer or recovered data with diagnosis of the root cause.",
    "Data Recovery Coordination":
      "We assess your data loss situation and coordinate with professional data recovery specialists if needed. You get a coordinated recovery attempt with professional handling of your storage media.",
    "Emergency Support Retainer":
      "We provide guaranteed priority dispatch for emergency incidents with a dedicated emergency contact and guaranteed response time. You get predictable emergency support costs with priority access when you need it most.",
    "Critical Account Lockout Help":
      "We help you regain access to locked-out critical accounts and set up backup access methods. You get restored account access with documented recovery procedures and lockout prevention recommendations.",

    // Business Starter Packs
    "Small Business IT Starter Pack":
      "We combine Microsoft 365 tenant setup (up to 5 users), basic security configuration, workstation security setup, and backup readiness check into a coordinated new business package. You get a complete technology foundation for your new business at a package price.",
    "New Business Technology Setup":
      "We coordinate Microsoft 365 setup, business internet and Wi-Fi configuration, workstation setup, and basic website or landing page for your new business. You get a complete technology environment from day one.",
    "Business Owner Peace of Mind Pack":
      "We perform a full security assessment, backup verification, and network health check, then provide 30 days of priority support. You get a complete technology health check with immediate issue resolution and peace of mind.",
    "Local Business Online Presence Pack":
      "We combine website health check, Google Business Profile optimization, local SEO setup, and review request system into a coordinated online presence package. You get improved visibility across search, maps, and reviews.",
    "New Client Foundation":
      "We perform a full technology assessment, security baseline review, and backup verification as part of onboarding to Maine Cyber Tech managed services. You get a smooth transition with immediate issues addressed.",
    "New Business IT Setup":
      "We coordinate Microsoft 365 tenant setup, business internet and Wi-Fi installation, workstation procurement and setup, and basic security configuration. You get a complete technology infrastructure for your new business.",
    "New Employee Setup Bundle":
      "We provide computer setup or procurement, Microsoft 365 account and email setup, required software installation, and security baseline configuration for each new hire. You get a consistent, efficient employee onboarding experience.",
    "Employee Exit Lockdown Bundle":
      "We remove account access, preserve email and data, recover devices, and document the complete offboarding process. You get a thorough employee exit that protects company data and provides an audit trail.",
    "Office Move IT Planning":
      "We conduct a new location site survey, plan network infrastructure, coordinate internet service, and provide move-day IT support. You get IT infrastructure ready at your new location on move-in day with minimal disruption.",
    "Vendor Transition Package":
      "We review current vendor documentation, inventory systems, transfer access, and coordinate new provider onboarding. You get a smooth transition between IT providers with no gaps in support or security.",
    "IT Documentation Rebuild":
      "We create complete network documentation, system and account inventory, password and access documentation, and procedure documentation. You get professional IT documentation that reduces dependency on tribal knowledge.",
    "Asset Inventory Buildout":
      "We perform on-site asset discovery, create an asset database, track warranties and licenses, and provide management recommendations. You get a complete technology asset inventory with lifecycle tracking.",
    "IT Roadmap Session":
      "We facilitate a business and technology strategy session, assess your current state, and create a documented technology roadmap. You get a 12-24 month technology plan aligned with your business priorities.",
    "Quarterly Business Review":
      "We review your IT performance, project status, and technology roadmap each quarter, providing strategic guidance and recommendations. You get regular strategic IT reviews that keep your technology aligned with business goals.",
    "Phone System Readiness Review":
      "We assess your current phone system, evaluate VoIP readiness, and recommend options. You get a clear understanding of your phone system needs with migration options and cost estimates.",
    "VoIP Vendor Selection Help":
      "We compare VoIP providers based on your business needs, features, and pricing. You get an unbiased recommendation with side-by-side comparison.",
    "VoIP Cutover Support":
      "We coordinate your phone system migration with configuration, programming, and testing. You get a smooth transition to your new phone system with minimal interruption.",
    "Auto Attendant Setup":
      "We design and configure a professional auto attendant phone menu with call routing. You get a professional phone greeting that routes callers to the right people.",
    "Business Voicemail Setup":
      "We configure voicemail for all users with voicemail-to-email delivery. You get professional voicemail that reaches your inbox.",
    "Phone Number Port Coordination":
      "We manage the phone number porting process between providers. You get your existing numbers transferred without service interruption.",
    "Teams Phone Readiness Check":
      "We assess your Microsoft 365 environment for Teams Phone readiness and identify requirements. You get a Teams Phone deployment roadmap with cost estimates.",
    "Small Business Phone Refresh":
      "We provide new VoIP phones, installation, configuration, and staff training. You get a modern phone system with improved call quality and features.",
    "Church Technology Health Check":
      "We assess your church's technology — Wi-Fi, sound, streaming, and volunteer accounts. You get practical, budget-conscious recommendations for your church's technology.",
    "Livestream Setup Support":
      "We configure livestreaming with platform setup, audio/video integration, and testing. You get a working livestream with simple instructions for volunteer operators.",
    "Guest Wi-Fi for Churches":
      "We configure a secure guest Wi-Fi network with content filtering appropriate for a family environment. You get guest connectivity that protects your church's network.",
    "Volunteer Account Cleanup":
      "We audit volunteer accounts, remove stale access, and set up account management processes. You get cleaned-up volunteer access with reduced security risk.",
    "Church IT Foundation":
      "We provide Wi-Fi and network setup, basic security configuration, and volunteer IT training. You get a solid technology foundation for your church's ministry.",
    "Marina Connectivity Pack":
      "We provide outdoor Wi-Fi site survey, weather-resistant access point installation, and guest network configuration. You get Wi-Fi coverage across your marina for boaters and staff.",
    "Outdoor Wi-Fi Planning for Marinas":
      "We assess your marina's outdoor Wi-Fi needs with environmental analysis and coverage planning. You get a detailed outdoor Wi-Fi plan with equipment recommendations for the marine environment.",
    "Security Camera Planning for Marinas":
      "We assess your marina's security needs and create a camera placement plan for waterfront areas. You get security camera recommendations designed for the marine environment.",
    "Gate and Sign Connectivity Review":
      "We assess connectivity options for remote gates, signs, or IoT devices on your property. You get connectivity recommendations with equipment and installation cost estimates.",
    "Seasonal Business IT Readiness":
      "We assess your seasonal business technology needs and prepare for the busy season. You get a pre-season readiness checklist with any equipment or configuration changes needed.",
    "Wellness Office Security Pack":
      "We provide basic security assessment, patient data handling review, and privacy policy guidance for wellness and healthcare offices. You get essential security and privacy measures for handling client health information.",
    "Patient Wi-Fi Separation":
      "We configure a separate patient Wi-Fi network isolated from clinical systems. You get protected patient data with compliant network segmentation.",
    "Contractor Digital Office":
      "We set up Microsoft 365 Business Basic, cloud file storage, mobile device configuration, and basic digital workflow guidance. You get a cloud-based digital office for your contracting business.",
    "Field Laptop Setup":
      "We configure laptops for field use with offline capabilities, mobile connectivity, and remote management. You get field-ready laptops with durable setup and secure remote access.",
    "Cloud File Setup for Job Photos":
      "We configure cloud storage and mobile app for organizing and sharing job site photos. You get automatic photo backup with easy sharing to clients and team members.",
    "Mobile Device Security Setup":
      "We configure mobile device management with security policies, app installation, and remote wipe capability. You get secured company phones and tablets with managed policies.",
    "Blueberry Business Starter":
      "We provide Microsoft 365 setup, basic internet and Wi-Fi, device configuration, and agricultural technology recommendations. You get a basic technology foundation for your agricultural business.",
    "Pine Tree Protection Pack":
      "We configure MFA on critical accounts, install endpoint protection, harden email security, and verify backup. You get essential cybersecurity protections that address the most common small business risks.",
    "Harbor Wi-Fi Bundle":
      "We provide outdoor Wi-Fi coverage assessment, weather-resistant equipment installation, and guest network configuration for your harbor. You get Wi-Fi connectivity for boaters with marine-grade equipment.",
    "Anchor Backup Plan":
      "We configure cloud backup, monitoring, and restore testing for your marina business data. You get automated backup protection with verified restore capability.",
    "North Star Cyber Plan":
      "We provide a full security assessment, security control implementation, monitoring setup, and incident response planning. You get a comprehensive cybersecurity program for your small business.",
  };

  const detail =
    details[name] ||
    `We provide a focused, practical approach to addressing your ${cat.toLowerCase()} needs with clear scope, professional execution, and plain-English documentation.`;
  return `${name} is a practical service for Maine businesses that need clear, scoped technology help. ${detail}`;
}

// ============================================================
// Expand outcomes and includes for larger products
// ============================================================
function expandOutcomes(p) {
  const name = p.name;
  const isBundle = name.includes("Bundle") || name.includes("Pack") || name.includes("Complete");
  const isPlan =
    name.includes("Care") ||
    name.includes("Plan") ||
    name.includes("Plus") ||
    name === "Cyber Complete";
  const hasLowerTier =
    name.includes("Business") ||
    name.includes("Complete") ||
    name.includes("Secure") ||
    name.includes("Plus") ||
    name === "Cyber Complete";

  let outcomes = [...p.customerOutcomes];

  if (isBundle || isPlan) {
    outcomes.push(
      "Coordinated delivery across all included services with a single point of contact",
    );
    outcomes.push("Better value than purchasing each service separately");
  }
  if (hasLowerTier) {
    outcomes.push("Includes all features of the lower-tier option plus additional capabilities");
  }
  if (
    name.includes("Complete") ||
    name === "MCT Complete Care" ||
    name === "Cyber Complete" ||
    name === "Camera Complete Bundle"
  ) {
    outcomes.push("Maximum coverage with enterprise-grade features and ongoing support");
    outcomes.push("Strategic guidance and regular business reviews");
  }
  if (name.includes("Secure") || name === "MCT Secure Care") {
    outcomes.push("Advanced threat detection and response capabilities");
    outcomes.push("Quarterly security assessments and improvement recommendations");
  }

  return outcomes.slice(0, 5);
}

function expandIncludes(p) {
  const name = p.name;
  let includes = [...p.whatIsIncluded];

  // Add "everything in lower" sections for services that build on lower tiers
  if (name === "MCT Business Care") includes.unshift("Everything in MCT Essential Care, plus:");
  if (name === "MCT Secure Care") includes.unshift("Everything in MCT Business Care, plus:");
  if (name === "MCT Complete Care") includes.unshift("Everything in MCT Secure Care, plus:");
  if (name === "Cyber Plus") includes.unshift("Everything in Cyber Basic, plus:");
  if (name === "Cyber Complete") includes.unshift("Everything in Cyber Plus, plus:");
  if (name === "Managed Workstation Protect")
    includes.unshift("Everything in Managed Workstation Essentials, plus:");
  if (name === "Managed Workstation Complete")
    includes.unshift("Everything in Managed Workstation Protect, plus:");
  if (name === "Camera Business Bundle")
    includes.unshift("Everything in Camera Starter Bundle, plus:");
  if (name === "Camera Complete Bundle")
    includes.unshift("Everything in Camera Business Bundle, plus:");
  if (name === "Backup Business Bundle")
    includes.unshift("Everything in Backup Starter Bundle, plus:");
  if (name === "Backup Resilience Bundle")
    includes.unshift("Everything in Backup Business Bundle, plus:");
  if (name === "M365 Secure Bundle") includes.unshift("Everything in M365 Launch Bundle, plus:");
  if (name === "M365 Managed Bundle") includes.unshift("Everything in M365 Cleanup Bundle, plus:");
  if (name === "Website Growth Bundle")
    includes.unshift("Everything in Website Safety Bundle, plus:");
  if (name === "Cyber Insurance Readiness Bundle")
    includes.unshift("Everything in individual policy starters, plus:");
  if (name === "Compliance Foundation Bundle")
    includes.unshift("Everything in Small Business Policy Pack, plus:");

  // Add an "includes all lower" summary for any product with "Bundle" or "Pack" in name
  if (name.includes("Bundle") || name.includes("Pack")) {
    includes.push("Single coordinated delivery with one point of contact");
    includes.push("Package pricing at a better value than individual services");
  }

  return includes.slice(0, 7);
}

// ============================================================
// Apply all changes
// ============================================================
let changes = { marketingCopy: 0, outcomes: 0, includes: 0 };
for (const p of products) {
  const newCopy = generateMarketingCopy(p);
  if (p.marketingCopy !== newCopy) {
    p.marketingCopy = newCopy;
    changes.marketingCopy++;
  }

  const newOutcomes = expandOutcomes(p);
  if (JSON.stringify(p.customerOutcomes) !== JSON.stringify(newOutcomes)) {
    p.customerOutcomes = newOutcomes;
    changes.outcomes++;
  }

  const newIncludes = expandIncludes(p);
  if (JSON.stringify(p.whatIsIncluded) !== JSON.stringify(newIncludes)) {
    p.whatIsIncluded = newIncludes;
    changes.includes++;
  }
}

fs.writeFileSync(
  "apps/web/lib/catalog/data/products.json",
  JSON.stringify(products, null, 2),
  "utf8",
);
console.log("Changes applied:", changes);

// Verify uniqueness
const copies = {};
for (const p of products) {
  const c = p.marketingCopy;
  copies[c] = copies[c] || [];
  copies[c].push(p.name);
}
const dups = Object.entries(copies).filter(([, names]) => names.length > 1);
console.log("marketingCopy unique:", dups.length === 0 ? "YES" : "NO - " + dups.length + " dupes");
if (dups.length > 0) {
  for (const [copy, names] of dups) {
    console.log("  DUPE:", names.join(", "));
  }
}

// Show expanded products
for (const name of [
  "MCT Complete Care",
  "Backup Resilience Bundle",
  "Camera Complete Bundle",
  "MCT Secure Care",
  "Cyber Plus",
]) {
  const p = products.find((x) => x.name === name);
  if (p) {
    console.log(`\n=== ${name} ===`);
    console.log("outcomes:", p.customerOutcomes.length);
    p.customerOutcomes.forEach((o) => console.log("  -", o));
    console.log("includes:", p.whatIsIncluded.length);
    p.whatIsIncluded.forEach((i) => console.log("  -", i));
  }
}
