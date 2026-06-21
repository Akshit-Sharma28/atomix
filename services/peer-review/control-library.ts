export type PeerReviewScope =
  | "Web only"
  | "Web + LLM"
  | "API"
  | "LLM only"
  | "Thick Client";

export type PeerReviewControl = {
  id: string;
  title: string;
  category: string;
  appliesTo: PeerReviewScope[];
  evidencePrompt: string;
  missedFindingPrompt: string;
};

export const peerReviewControls: PeerReviewControl[] = [
  {
    id: "0.1",
    title: "Security review notification and stakeholder awareness",
    category: "Review Authorization",
    appliesTo: ["Web only", "Web + LLM", "API", "LLM only", "Thick Client"],
    evidencePrompt:
      "Confirm owner notification, review authorization, scope approval, and stakeholder awareness are present in the artifacts.",
    missedFindingPrompt:
      "Flag missing authorization, missing scope approval, or unclear stakeholder sign-off.",
  },
  {
    id: "2.2-2.6",
    title: "Identification, registration, and non-privileged identifiers",
    category: "Identity",
    appliesTo: ["Web only", "Web + LLM", "API", "Thick Client"],
    evidencePrompt:
      "Look for unique username handling, self-registration identity proofing, two-step registration where applicable, and identifiers that do not disclose privilege.",
    missedFindingPrompt:
      "Flag role-revealing usernames, weak registration flow, or missing uniqueness checks.",
  },
  {
    id: "3.1-3.12",
    title: "Password policy, reset, storage, and display controls",
    category: "Authentication",
    appliesTo: ["Web only", "Web + LLM", "API", "Thick Client"],
    evidencePrompt:
      "Check password length, complexity, history, forced reset, reset expiry, no password display/recovery, no credential caching, and confirmation of new passwords.",
    missedFindingPrompt:
      "Flag weak password standards, credential delivery in unsafe channels, password display/recovery, cached credentials, or non-expiring temporary passwords.",
  },
  {
    id: "4.1-4.18",
    title: "Challenge response, CAPTCHA, OTP, and MFA behavior",
    category: "Authentication",
    appliesTo: ["Web only", "Web + LLM", "API", "Thick Client"],
    evidencePrompt:
      "Review challenge-response use, CAPTCHA randomness/replay resistance, OTP/PIN length and lifetime, and reset challenge safeguards.",
    missedFindingPrompt:
      "Flag challenge questions used as authentication, predictable CAPTCHA/OTP, insufficient OTP length, or response phrase disclosure.",
  },
  {
    id: "6.1-6.9",
    title: "Authentication enforcement and credential transmission",
    category: "Authentication",
    appliesTo: ["Web only", "Web + LLM", "API", "Thick Client"],
    evidencePrompt:
      "Verify protected functions require authentication, controls are server-side, credentials use POST over TLS, account lockout exists, and automatic credential storage is not implemented.",
    missedFindingPrompt:
      "Flag bypassable authentication, Basic/Digest/LM/NTLMv1 use, GET credential submission, missing lockout, or remember-me credential storage.",
  },
  {
    id: "7.1-7.2",
    title: "Authorization enforcement",
    category: "Authorization",
    appliesTo: ["Web only", "Web + LLM", "API", "Thick Client"],
    evidencePrompt:
      "Check role/object/function authorization for non-public data and protected operations.",
    missedFindingPrompt:
      "Flag missing object-level checks, privilege escalation, horizontal access, or authorization bypass paths.",
  },
  {
    id: "8.1-8.16",
    title: "Session management, cookies, logout, CSRF, and concurrency",
    category: "Session Management",
    appliesTo: ["Web only", "Web + LLM", "API", "Thick Client"],
    evidencePrompt:
      "Verify unpredictable tokens, session fixation resistance, cookie HttpOnly/Secure/domain/path, inactivity expiry, logout, CSRF protection, regeneration after auth, and concurrent session handling.",
    missedFindingPrompt:
      "Flag missing HttpOnly/Secure/SameSite evidence, CSRF gaps, keep-alive misuse, token disclosure, or missing session regeneration.",
  },
  {
    id: "9.1-9.18",
    title: "Input validation and injection coverage",
    category: "Input Validation",
    appliesTo: ["Web only", "Web + LLM", "API", "Thick Client"],
    evidencePrompt:
      "Check server-side validation, XSS, command/SQL/LDAP/XML/XPath injection, clickjacking, CRLF/header injection, redirects, traversal, RFI/LFI, SSRF, upload validation, RFD, deserialization, XXE, and SRI.",
    missedFindingPrompt:
      "Flag missing test coverage or evidence for XSS, command injection, SSRF, redirects, upload controls, XXE, deserialization, and client-side-only validation.",
  },
  {
    id: "10.2/10.15",
    title: "Certificates and cryptographic trust",
    category: "Cryptography",
    appliesTo: ["Web only", "Web + LLM", "API", "Thick Client"],
    evidencePrompt:
      "Verify certificates are current, trusted, hostname-valid, and not self-signed or inappropriate wildcard certificates.",
    missedFindingPrompt:
      "Flag expired, untrusted, hostname-mismatched, self-signed, or risky wildcard certificate evidence.",
  },
  {
    id: "11.1-11.10",
    title: "Secure communications and token transmission",
    category: "Secure Communications",
    appliesTo: ["Web only", "Web + LLM", "API", "Thick Client"],
    evidencePrompt:
      "Review HTTPS, HSTS, secure token transmission, no mixed encrypted/unencrypted sessions, sensitive data in body not URL, and no FTP/Telnet/SSHv1/RSH/SMBv1.",
    missedFindingPrompt:
      "Flag token leakage in URLs, missing HSTS, mixed transport, insecure legacy protocols, or missing encrypted client-server channels.",
  },
  {
    id: "12.3-12.7",
    title: "Data at rest, cache, autocomplete, and replay",
    category: "Data Protection",
    appliesTo: ["Web only", "Web + LLM", "API", "Thick Client"],
    evidencePrompt:
      "Check unnecessary data storage, confidential/PII cache controls, autocomplete disabled for sensitive fields, and form replay resistance.",
    missedFindingPrompt:
      "Flag sensitive data in persistent cookies/cache, unnecessary local storage, enabled autocomplete on sensitive fields, or replayable forms.",
  },
  {
    id: "14.1-14.8",
    title: "Information leakage and version disclosure",
    category: "Information Leakage",
    appliesTo: ["Web only", "Web + LLM", "API", "Thick Client"],
    evidencePrompt:
      "Review detailed errors, server-side code exposure, enumeration, web service detail exposure, username harvesting, sensitive comments, version/config disclosure, and username lists.",
    missedFindingPrompt:
      "Flag stack traces, source/code exposure, WSDL/service details, user enumeration, sensitive comments, or disclosed package/server versions.",
  },
  {
    id: "15.9-15.19",
    title: "Design controls for email, SOR integrity, anti-malware, DMARC, and HTTPS",
    category: "System Design",
    appliesTo: ["Web only", "Web + LLM", "API"],
    evidencePrompt:
      "Check authenticated email forms, source-of-record data integrity, antivirus scanning for uploaded files, fixed sender controls, DMARC, and HTTPS for internet/non-network access.",
    missedFindingPrompt:
      "Flag unauthenticated email functions, sender spoofing, missing malware scanning, missing DMARC, or source-of-record tampering risk.",
  },
  {
    id: "16.4-16.15",
    title: "System configuration, HTTP methods, TLS, headers, and directory listing",
    category: "System Configuration",
    appliesTo: ["Web only", "Web + LLM", "API", "Thick Client"],
    evidencePrompt:
      "Review unnecessary services, vendor controls, allowed HTTP methods, HTML5/TLS standards, security headers, and directory listing.",
    missedFindingPrompt:
      "Flag unnecessary services, unsafe HTTP methods, weak TLS posture, missing CSP/Cache-Control/X-Content-Type-Options, or directory listing.",
  },
  {
    id: "17.7-17.15",
    title: "Secure development, approved scanning, and responsible AI controls",
    category: "Secure Development",
    appliesTo: ["Web only", "Web + LLM", "API", "LLM only", "Thick Client"],
    evidencePrompt:
      "Check obsolete technology, approved dynamic scanning, external resource approval, responsible AI principles, model validation/drift, and audit trail/explainability.",
    missedFindingPrompt:
      "Flag missing scanner evidence, unauthorized external resources, missing AI governance evidence, missing model validation, or missing audit trail.",
  },
  {
    id: "19.1-19.6",
    title: "Web API validation, JWT security, identity exposure, and rate limits",
    category: "API Security",
    appliesTo: ["Web + LLM", "API", "LLM only"],
    evidencePrompt:
      "Review JWT secret strength, backend-enforced algorithms, no sensitive JWT payload, secure content-type, no user identity in resource requests, and quotas/rate limits.",
    missedFindingPrompt:
      "Flag weak JWT secrets, alg confusion risk, sensitive JWT claims, insecure content-type, IDOR identity patterns, or missing API rate limits.",
  },
  {
    id: "20.1-20.5",
    title: "Thick client storage, signing, decompilation, hardcoded queries, and anti-tamper",
    category: "Thick Client",
    appliesTo: ["Thick Client"],
    evidencePrompt:
      "Check encrypted client-side sensitive data, signed executables, obfuscation/decompilation resistance, no hardcoded DB queries, and anti-tamper controls.",
    missedFindingPrompt:
      "Flag plaintext client data, unsigned binaries, decompilable sensitive logic, hardcoded queries, or missing anti-tamper evidence.",
  },
  {
    id: "21.1-21.7",
    title: "LLM model DoS, exfiltration, poisoning, prompt injection, plugins, leakage, and OSS approval",
    category: "LLM Security",
    appliesTo: ["Web + LLM", "LLM only"],
    evidencePrompt:
      "Review model DoS, data exfiltration, data poisoning, prompt injection/jailbreak, arbitrary plugin invocation, sensitive data leakage, and OSS/model approval.",
    missedFindingPrompt:
      "Flag missing prompt-injection tests, tool/plugin abuse coverage, sensitive-data leakage tests, model DoS constraints, poisoning paths, or OSS/model approval evidence.",
  },
];

export function controlsForScope(scope: string) {
  return peerReviewControls.filter((control) =>
    control.appliesTo.includes(scope as PeerReviewScope),
  );
}
