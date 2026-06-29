export type FeadContext = {
  scope: string;
  authentication: string;
  tenantType: string;
  publicInternal: string;
  internetExposed: string;
  apiAvailable: string;
  llmUsage: string;
};

export type FeadControl = {
  id: string;
  section: string;
  title: string;
  testing: string;
  artifacts: string;
  naReason?: (context: FeadContext) => string | null;
};

function isApiScope(context: FeadContext) {
  return context.scope === "API";
}

function isLlmScope(context: FeadContext) {
  return context.scope === "Web + LLM" || context.scope === "LLM only" || context.llmUsage === "Yes";
}

function isThickClientScope(context: FeadContext) {
  return context.scope === "Thick Client";
}

function noAuthentication(context: FeadContext) {
  return context.authentication === "N - No authentication";
}

function notInternetFacing(context: FeadContext) {
  return context.internetExposed === "No" && context.publicInternal === "Internal";
}

export function resolveFeadControl(
  control: FeadControl,
  context: FeadContext,
) {
  const reason = control.naReason?.(context) ?? null;

  return {
    status: reason ? "NA" : "Open",
    reviewerComment:
      reason ??
      "Reviewer to validate control applicability, record observations, and update status with supporting evidence.",
  };
}

export const feadControls: FeadControl[] = [
  {
    id: "0.1",
    section: "0. Review Authorization",
    title: "Application owner(s) and required groups must be informed before the security review.",
    testing: "Confirm security review authorization, app-team awareness, contacts, and planned testing window before testing starts.",
    artifacts: "Approval email, kickoff notes, app owner confirmation, test schedule.",
  },
  {
    id: "0.3",
    section: "0. Review Authorization",
    title: "New technologies must have an approved Minimum Security Baseline (MSB).",
    testing: "Identify technology stack and confirm an approved MSB exists for unsupported or newly introduced platforms.",
    artifacts: "MSB reference, architecture notes, technology inventory.",
  },
  {
    id: "2.2",
    section: "2. Identification and Registration",
    title: "Information systems must provide unique usernames.",
    testing: "Verify user identities are unique and cannot be shared across separate users or roles.",
    artifacts: "User administration screenshots, registration workflow evidence.",
    naReason: (context) =>
      noAuthentication(context)
        ? "Marked NA because demo-call intake says the application has no authentication or user registration workflow."
        : null,
  },
  {
    id: "2.3",
    section: "2. Identification and Registration",
    title: "Self-registration must establish the user identity for authorized individuals.",
    testing: "Review registration controls, identity proofing, approval gates, and restricted onboarding paths.",
    artifacts: "Self-registration screenshots, approval workflow evidence.",
    naReason: (context) =>
      noAuthentication(context)
        ? "Marked NA because no authentication or self-registration process is in scope."
        : null,
  },
  {
    id: "2.5",
    section: "2. Identification and Registration",
    title: "Self-registration must require a two-step registration process.",
    testing: "Validate registration confirmation, approval, verification, or activation steps after user self-identification.",
    artifacts: "Registration flow screenshots and confirmation messages.",
    naReason: (context) =>
      noAuthentication(context)
        ? "Marked NA because the application does not include self-registration in the selected scope."
        : null,
  },
  {
    id: "2.6",
    section: "2. Identification and Registration",
    title: "Usernames, IDs, or identifiers should not reveal user privileges.",
    testing: "Inspect usernames, IDs, account numbers, API users, and role labels for privilege disclosure.",
    artifacts: "User list screenshots, account examples with sensitive values redacted.",
    naReason: (context) =>
      noAuthentication(context)
        ? "Marked NA because no user identifiers are exposed in the selected unauthenticated scope."
        : null,
  },
  {
    id: "3.1",
    section: "3. Passwords",
    title: "Information systems must enforce password length, complexity, aging, and history standards.",
    testing: "Validate password policy during account creation, password change, reset, and administrative reset flows.",
    artifacts: "Password policy screenshots, failed/accepted password evidence.",
    naReason: (context) =>
      noAuthentication(context)
        ? "Marked NA because password authentication is not used for this application scope."
        : null,
  },
  {
    id: "3.2",
    section: "3. Passwords",
    title: "Users must change temporary passwords after first login.",
    testing: "Create or reset a test account and confirm first-login password change is enforced.",
    artifacts: "Temporary password reset evidence and first-login prompt.",
    naReason: (context) =>
      noAuthentication(context)
        ? "Marked NA because password login is not used."
        : null,
  },
  {
    id: "3.3",
    section: "3. Passwords",
    title: "Systems not using Active Directory SSO must provide secure self-service password change.",
    testing: "Validate self-service password change, identity checks, and protection against unauthorized reset.",
    artifacts: "Password change screenshots and validation evidence.",
    naReason: (context) =>
      noAuthentication(context)
        ? "Marked NA because no password-based account flow is in scope."
        : null,
  },
  {
    id: "3.4",
    section: "3. Passwords",
    title: "Password reset functions must generate temporary credentials securely.",
    testing: "Trigger reset flow and verify randomness, delivery channel, expiry, and no disclosure of existing password.",
    artifacts: "Reset workflow screenshots, email/SMS template with secrets redacted.",
    naReason: (context) =>
      noAuthentication(context)
        ? "Marked NA because password reset is not applicable."
        : null,
  },
  {
    id: "3.5",
    section: "3. Passwords",
    title: "Passwords must not be delivered in the same email as a user's identity or system URL.",
    testing: "Review password delivery communications and verify credentials are not bundled with identity/system URL details.",
    artifacts: "Credential delivery template with sensitive values redacted.",
    naReason: (context) =>
      noAuthentication(context)
        ? "Marked NA because password delivery is not used."
        : null,
  },
  {
    id: "3.6",
    section: "3. Passwords",
    title: "Systems must not retrieve or recover passwords from the server.",
    testing: "Verify forgotten-password flow resets secrets instead of retrieving existing passwords.",
    artifacts: "Forgot-password screenshots and backend behavior notes.",
    naReason: (context) =>
      noAuthentication(context)
        ? "Marked NA because password recovery is not in scope."
        : null,
  },
  {
    id: "3.7",
    section: "3. Passwords",
    title: "Information systems must not display passwords.",
    testing: "Inspect login, reset, profile, admin, logs, and export screens for password disclosure.",
    artifacts: "Screenshots of password fields and relevant logs with secrets redacted.",
    naReason: (context) =>
      noAuthentication(context)
        ? "Marked NA because no password entry/display workflow exists."
        : null,
  },
  {
    id: "3.9",
    section: "3. Passwords",
    title: "Systems must not cache or store credentials outside the credential repository.",
    testing: "Review browser storage, local storage, logs, exports, and client-side state for credential caching.",
    artifacts: "Storage inspection screenshots and log review notes.",
    naReason: (context) =>
      noAuthentication(context)
        ? "Marked NA because credentials are not used in the selected scope."
        : null,
  },
  {
    id: "3.10",
    section: "3. Passwords",
    title: "Initial and administratively reset passwords must be randomly generated.",
    testing: "Request multiple resets and verify temporary passwords/tokens are random and not predictable.",
    artifacts: "Reset examples with values redacted and entropy notes.",
    naReason: (context) =>
      noAuthentication(context)
        ? "Marked NA because administrative password reset is not applicable."
        : null,
  },
  {
    id: "3.11",
    section: "3. Passwords",
    title: "Initial and reset passwords must expire after first use or within 24 hours.",
    testing: "Validate expiry behavior after first use and after the configured time window.",
    artifacts: "Expiry screenshots and reset token lifecycle evidence.",
    naReason: (context) =>
      noAuthentication(context)
        ? "Marked NA because temporary passwords are not used."
        : null,
  },
  {
    id: "3.12",
    section: "3. Passwords",
    title: "Systems should require entry of new passwords twice during self-service password change.",
    testing: "Check password change form confirms new password entry and rejects mismatched values.",
    artifacts: "Password change screenshots and mismatch evidence.",
    naReason: (context) =>
      noAuthentication(context)
        ? "Marked NA because self-service password change is not applicable."
        : null,
  },
  {
    id: "4.1",
    section: "4. Challenge & Response",
    title: "Challenge and response must not be used for authentication.",
    testing: "Review challenge-response usage and confirm it is not the primary authentication factor.",
    artifacts: "Authentication flow screenshots and challenge-response configuration.",
    naReason: (context) =>
      noAuthentication(context)
        ? "Marked NA because authentication challenge-response mechanisms are not in scope."
        : null,
  },
  {
    id: "4.2",
    section: "4. Challenge & Response",
    title: "The user's current password must be validated while changing challenge questions and responses.",
    testing: "Attempt to change challenge questions without current-password validation and confirm it is blocked.",
    artifacts: "Challenge question change screenshots.",
    naReason: (context) =>
      noAuthentication(context)
        ? "Marked NA because challenge question management is not applicable."
        : null,
  },
  {
    id: "4.3",
    section: "4. Challenge & Response",
    title: "Challenge questions must be chosen from an approved list.",
    testing: "Review available questions and confirm custom weak or guessable questions are not allowed.",
    artifacts: "Approved challenge question list and UI screenshots.",
    naReason: (context) =>
      noAuthentication(context)
        ? "Marked NA because challenge questions are not used."
        : null,
  },
  {
    id: "4.5",
    section: "4. Challenge & Response",
    title: "CAPTCHA implementations must not be susceptible to replay attacks.",
    testing: "Attempt CAPTCHA token reuse, replay, and repeated submission across sessions.",
    artifacts: "CAPTCHA request/response evidence and replay test notes.",
  },
  {
    id: "4.6",
    section: "4. Challenge & Response",
    title: "CAPTCHA must be random and not generated or displayed as client-side text.",
    testing: "Inspect CAPTCHA generation and ensure the solution is not present in HTML, JS, or predictable client-side state.",
    artifacts: "Browser inspector screenshots and request samples.",
  },
  {
    id: "4.7",
    section: "4. Challenge & Response",
    title: "OTP or two-factor authentication PIN must be minimum six characters.",
    testing: "Validate OTP/PIN length, character rules, and rejection of shorter codes.",
    artifacts: "OTP setup and verification screenshots.",
    naReason: (context) =>
      noAuthentication(context)
        ? "Marked NA because OTP/MFA is not used in unauthenticated scope."
        : null,
  },
  {
    id: "4.8",
    section: "4. Challenge & Response",
    title: "OTP or two-factor authentication PIN must be randomly generated.",
    testing: "Request multiple OTPs and verify unpredictability, uniqueness, and short validity windows.",
    artifacts: "OTP delivery examples with secrets redacted.",
    naReason: (context) =>
      noAuthentication(context)
        ? "Marked NA because OTP/MFA is not used."
        : null,
  },
  {
    id: "4.9",
    section: "4. Challenge & Response",
    title: "OTP or two-factor PIN lifetime must be limited.",
    testing: "Validate expiry, reuse prevention, and maximum attempts for OTP or two-factor tokens.",
    artifacts: "OTP expiry screenshots and replay evidence.",
    naReason: (context) =>
      noAuthentication(context)
        ? "Marked NA because OTP/MFA is not used."
        : null,
  },
  {
    id: "6.1",
    section: "6. Authentication",
    title: "Systems storing non-public data or protected functions must implement authentication.",
    testing: "Identify protected functions and verify authentication is enforced before access.",
    artifacts: "Unauthenticated access tests and protected route screenshots.",
    naReason: (context) =>
      noAuthentication(context)
        ? "Marked NA because the selected demo scope has no protected functions requiring user authentication."
        : null,
  },
  {
    id: "6.2",
    section: "6. Authentication",
    title: "Systems must not implement more than one authentication sequence or replicate credential stores.",
    testing: "Map authentication flows and confirm credential stores are not duplicated across flows.",
    artifacts: "Architecture notes, auth flow diagrams, identity provider configuration.",
    naReason: (context) =>
      noAuthentication(context)
        ? "Marked NA because no authentication sequence is implemented."
        : null,
  },
  {
    id: "6.3",
    section: "6. Authentication",
    title: "Authentication controls must be enforced server-side and resist circumvention.",
    testing: "Bypass client-side controls and directly request protected endpoints to confirm server-side enforcement.",
    artifacts: "Request/response evidence from protected endpoint tests.",
    naReason: (context) =>
      noAuthentication(context)
        ? "Marked NA because no authenticated endpoints are in scope."
        : null,
  },
  {
    id: "6.4",
    section: "6. Authentication",
    title: "Systems must not implement Basic, Digest, LAN Manager, or NTLMv1 authentication.",
    testing: "Inspect authentication headers, server configuration, and login flows for disallowed mechanisms.",
    artifacts: "HTTP authentication evidence and server configuration notes.",
    naReason: (context) =>
      noAuthentication(context)
        ? "Marked NA because no authentication protocol is used."
        : null,
  },
  {
    id: "6.6",
    section: "6. Authentication",
    title: "Systems must use POST over TLS when transmitting authentication credentials via HTTP.",
    testing: "Verify credential submissions use POST over HTTPS and credentials are not sent via URL parameters.",
    artifacts: "Login request screenshots and proxy capture with secrets redacted.",
    naReason: (context) =>
      noAuthentication(context)
        ? "Marked NA because no credentials are transmitted."
        : null,
  },
  {
    id: "6.7",
    section: "6. Authentication",
    title: "Systems must enforce account lockout policies.",
    testing: "Attempt repeated failed login attempts and validate lockout, throttling, or detection behavior.",
    artifacts: "Failed login sequence evidence and lockout message.",
    naReason: (context) =>
      noAuthentication(context)
        ? "Marked NA because login attempts and account lockout are not applicable."
        : null,
  },
  {
    id: "7.1",
    section: "7. Authorization",
    title: "Systems storing non-public data must enforce authorization controls.",
    testing: "Validate horizontal and vertical access control across roles, records, functions, APIs, and direct object references.",
    artifacts: "Role matrix, access control screenshots, IDOR test evidence.",
    naReason: (context) =>
      noAuthentication(context)
        ? "Marked NA because no authenticated users or protected roles are in scope."
        : null,
  },
  {
    id: "7.2",
    section: "7. Authorization",
    title: "Information systems must not be susceptible to circumvention of authorization controls.",
    testing: "Attempt direct URL/API access, parameter tampering, role switching, and cross-tenant access where applicable.",
    artifacts: "Access-control test cases and proxy evidence.",
    naReason: (context) =>
      context.tenantType === "Single tenant" && noAuthentication(context)
        ? "Marked NA because demo-call intake shows a single-tenant unauthenticated application with no role-based authorization surface."
        : null,
  },
  {
    id: "8.1",
    section: "8. Session Management",
    title: "Session tokens must be generated using strong, non-predictable algorithms.",
    testing: "Inspect session token entropy, randomness, length, and predictability across multiple sessions.",
    artifacts: "Token samples with values redacted and entropy notes.",
    naReason: (context) =>
      noAuthentication(context)
        ? "Marked NA because no login session token is used."
        : null,
  },
  {
    id: "8.2",
    section: "8. Session Management",
    title: "Session state must not be susceptible to session fixation.",
    testing: "Confirm session identifiers rotate after authentication and cannot be fixed before login.",
    artifacts: "Before/after login cookie evidence.",
    naReason: (context) =>
      noAuthentication(context)
        ? "Marked NA because authenticated sessions are not established."
        : null,
  },
  {
    id: "8.3",
    section: "8. Session Management",
    title: "Client-side session state must be protected from modification through server-side controls.",
    testing: "Tamper with cookies, local storage, hidden fields, and client state to verify server-side rejection.",
    artifacts: "Tampering request/response evidence.",
    naReason: (context) =>
      noAuthentication(context)
        ? "Marked NA because no authenticated client-side session state is used."
        : null,
  },
  {
    id: "8.4",
    section: "8. Session Management",
    title: "Session tokens must be stored in session cookies and transmitted via HTTP cookie headers.",
    testing: "Inspect token storage and verify session tokens are not exposed in URLs, local storage, or scripts.",
    artifacts: "Cookie inspector screenshots with token values redacted.",
    naReason: (context) =>
      noAuthentication(context)
        ? "Marked NA because no session tokens are present."
        : null,
  },
  {
    id: "8.5",
    section: "8. Session Management",
    title: "Sessions must expire automatically after inactivity.",
    testing: "Validate idle timeout and maximum session duration behavior.",
    artifacts: "Timeout screenshots and session lifecycle notes.",
    naReason: (context) =>
      noAuthentication(context)
        ? "Marked NA because no authenticated session is maintained."
        : null,
  },
  {
    id: "8.6",
    section: "8. Session Management",
    title: "Systems must provide a user logout function.",
    testing: "Validate logout terminates server-side session and prevents back-button reuse.",
    artifacts: "Logout screenshots and post-logout request evidence.",
    naReason: (context) =>
      noAuthentication(context)
        ? "Marked NA because logout is not applicable without authentication."
        : null,
  },
  {
    id: "8.7",
    section: "8. Session Management",
    title: "HTTPOnly must be set on cookies containing session tokens.",
    testing: "Inspect session cookies and confirm HTTPOnly is set.",
    artifacts: "Cookie attribute screenshots.",
    naReason: (context) =>
      noAuthentication(context)
        ? "Marked NA because session-token cookies are not used."
        : null,
  },
  {
    id: "8.8",
    section: "8. Session Management",
    title: "Secure flag must be set on cookies containing session tokens.",
    testing: "Inspect session cookies and confirm Secure is set for HTTPS transmission only.",
    artifacts: "Cookie attribute screenshots.",
    naReason: (context) =>
      noAuthentication(context)
        ? "Marked NA because session-token cookies are not used."
        : null,
  },
  {
    id: "8.9",
    section: "8. Session Management",
    title: "Systems must not be susceptible to Cross-Site Request Forgery (CSRF).",
    testing: "Attempt state-changing requests without anti-CSRF protection and validate server-side rejection.",
    artifacts: "CSRF proof-of-concept request and response evidence.",
  },
  {
    id: "8.12",
    section: "8. Session Management",
    title: "Session tokens must be created or regenerated after successful authentication.",
    testing: "Compare token before and after login to confirm session regeneration.",
    artifacts: "Cookie/token rotation evidence.",
    naReason: (context) =>
      noAuthentication(context)
        ? "Marked NA because successful authentication does not occur."
        : null,
  },
  {
    id: "8.16",
    section: "8. Session Management",
    title: "Concurrent sessions by the same user must be prevented by terminating the existing session.",
    testing: "Login with the same account from two browsers/devices and verify previous session termination.",
    artifacts: "Concurrent login evidence.",
    naReason: (context) =>
      noAuthentication(context)
        ? "Marked NA because user sessions are not supported."
        : null,
  },
  {
    id: "9.1",
    section: "9. Input Validation",
    title: "All input must be validated server-side to allow only permitted characters and lengths.",
    testing: "Submit boundary values, unexpected characters, encodings, and oversized input to server-side endpoints.",
    artifacts: "Validation test cases and request/response evidence.",
  },
  {
    id: "9.2",
    section: "9. Input Validation",
    title: "Systems must not be susceptible to buffer overflow attacks.",
    testing: "Send oversized payloads and malformed data to input fields, upload functions, APIs, and parsers.",
    artifacts: "Payload evidence and application response screenshots.",
  },
  {
    id: "9.3",
    section: "9. Input Validation",
    title: "Systems must not be susceptible to Cross-Site Scripting (XSS).",
    testing: "Test reflected, stored, and DOM XSS across user-controllable inputs and rich text fields.",
    artifacts: "Payloads, screenshots, and encoded output evidence.",
  },
  {
    id: "9.4",
    section: "9. Input Validation",
    title: "Systems must not be susceptible to command injection attacks.",
    testing: "Test command, SQL, LDAP, XML, and XPath injection where user input reaches interpreters or query layers.",
    artifacts: "Injection payloads and safe error/blocked response evidence.",
  },
  {
    id: "9.5",
    section: "9. Input Validation",
    title: "Systems must not be susceptible to cross-frame scripting or clickjacking.",
    testing: "Inspect frame headers and attempt to embed sensitive screens in attacker-controlled frames.",
    artifacts: "X-Frame-Options/CSP evidence and framing test screenshots.",
  },
  {
    id: "9.6",
    section: "9. Input Validation",
    title: "Systems must not be susceptible to header injection attacks.",
    testing: "Submit CRLF and header injection payloads in inputs reflected into HTTP headers.",
    artifacts: "Request/response evidence showing blocked CRLF injection.",
  },
  {
    id: "9.7",
    section: "9. Input Validation",
    title: "Systems must not be susceptible to URL redirection attacks.",
    testing: "Test redirect parameters and navigation flows for arbitrary external redirects.",
    artifacts: "Redirect test cases and blocked/allowed destination evidence.",
  },
  {
    id: "9.8",
    section: "9. Input Validation",
    title: "Systems must not be susceptible to directory traversal attacks.",
    testing: "Submit traversal payloads to file, download, import, template, and path parameters.",
    artifacts: "Traversal payloads and safe response evidence.",
  },
  {
    id: "9.9",
    section: "9. Input Validation",
    title: "Systems must not be susceptible to RFI or LFI.",
    testing: "Attempt local and remote file inclusion through path, template, URL, and import parameters.",
    artifacts: "RFI/LFI payload evidence and blocked responses.",
  },
  {
    id: "9.10",
    section: "9. Input Validation",
    title: "Systems must not be susceptible to Server-Side Request Forgery (SSRF).",
    testing: "Test URL-fetching functions for internal network, metadata, and restricted destination access.",
    artifacts: "SSRF test evidence and egress restriction notes.",
  },
  {
    id: "9.11",
    section: "9. Input Validation",
    title: "File upload features must validate file size and content type.",
    testing: "Upload oversized files, double extensions, mismatched MIME types, and executable payloads.",
    artifacts: "Upload validation screenshots and proxy evidence.",
  },
  {
    id: "9.12",
    section: "9. Input Validation",
    title: "Systems must not be susceptible to Reflected File Download (RFD).",
    testing: "Test reflected content endpoints for filename/content-type abuse and forced download behavior.",
    artifacts: "RFD request/response evidence.",
  },
  {
    id: "9.15",
    section: "9. Input Validation",
    title: "Information systems must use deserialization securely.",
    testing: "Identify serialized inputs and validate safe parser configuration and object allowlisting.",
    artifacts: "Serialized request samples and parser configuration notes.",
  },
  {
    id: "9.16",
    section: "9. Input Validation",
    title: "Systems must not be susceptible to XML External Entity (XXE) injection.",
    testing: "Submit XXE payloads to XML parsers, imports, SOAP endpoints, and document-processing features.",
    artifacts: "XXE payload evidence and parser hardening notes.",
  },
  {
    id: "9.18",
    section: "9. Input Validation",
    title: "Sub-resource Integrity (SRI) misconfiguration check.",
    testing: "Inspect externally loaded scripts/styles and verify SRI where applicable.",
    artifacts: "HTML source screenshots and SRI attribute evidence.",
  },
  {
    id: "10.2",
    section: "10. Cryptography",
    title: "Digital certificates must be current, trusted, and associated with the correct hostname.",
    testing: "Review TLS certificate chain, hostname match, expiry, trust, and weak signature algorithms.",
    artifacts: "TLS scan screenshots and certificate details.",
  },
  {
    id: "10.15",
    section: "10. Cryptography",
    title: "Self-signed or wildcard certificates are not to be used.",
    testing: "Inspect certificates for self-signed issuers or wildcard usage and document accepted exceptions.",
    artifacts: "Certificate screenshots and scan results.",
  },
  {
    id: "11.1",
    section: "11. Secure Communications (Data in Transit)",
    title: "Passwords, passphrases, PINs, and tokens must be protected during network transmission.",
    testing: "Verify sensitive values are only transmitted over secure channels and are not exposed in URLs.",
    artifacts: "Proxy captures with secrets redacted and TLS evidence.",
  },
  {
    id: "11.2",
    section: "11. Secure Communications (Data in Transit)",
    title: "Session tokens must be protected during network transmission.",
    testing: "Inspect transport security and confirm session tokens are never transmitted over insecure channels.",
    artifacts: "Cookie and transport evidence.",
    naReason: (context) =>
      noAuthentication(context)
        ? "Marked NA because session tokens are not used in this scope."
        : null,
  },
  {
    id: "11.3",
    section: "11. Secure Communications (Data in Transit)",
    title: "Confidential information and PII must be protected during network transmission.",
    testing: "Validate TLS coverage for data submission, APIs, downloads, and integrations handling sensitive data.",
    artifacts: "TLS evidence and sensitive-flow request screenshots with data redacted.",
  },
  {
    id: "11.6",
    section: "11. Secure Communications (Data in Transit)",
    title: "Internet-facing systems must implement HTTP Strict-Transport-Security.",
    testing: "Inspect HSTS headers and preload suitability for public or internet-facing endpoints.",
    artifacts: "Response header screenshots and TLS scan output.",
    naReason: (context) =>
      notInternetFacing(context)
        ? "Marked NA because demo-call intake says the application is internal and not internet exposed."
        : null,
  },
  {
    id: "11.7",
    section: "11. Secure Communications (Data in Transit)",
    title: "Sensitive information must be transmitted in the HTTP message body, not URL parameters.",
    testing: "Inspect requests for sensitive values in query strings, fragments, referrers, and logs.",
    artifacts: "Request evidence with sensitive values redacted.",
  },
  {
    id: "11.8",
    section: "11. Secure Communications (Data in Transit)",
    title: "Insecure and obsolete protocols must not be used.",
    testing: "Scan and verify FTP, Telnet, SSHv1, RSH, and other obsolete services are not enabled.",
    artifacts: "Network scan results and service inventory.",
  },
  {
    id: "11.9",
    section: "11. Secure Communications (Data in Transit)",
    title: "Vulnerable communication protocols such as SMBv1 must not be used.",
    testing: "Review infrastructure and scan results for SMBv1 and deprecated protocol support.",
    artifacts: "Protocol scan screenshots and platform configuration.",
  },
  {
    id: "11.10",
    section: "11. Secure Communications (Data in Transit)",
    title: "Internet-facing applications must implement encrypted client/server channels.",
    testing: "Confirm HTTPS is enforced for all internet-facing endpoints and downgrade is not possible.",
    artifacts: "HTTP-to-HTTPS redirect evidence and TLS scan output.",
    naReason: (context) =>
      notInternetFacing(context)
        ? "Marked NA because the application is internal and not internet facing."
        : null,
  },
  {
    id: "12.3",
    section: "12. Data Confidentiality (Data at Rest)",
    title: "Systems must not store unnecessary data.",
    testing: "Review data fields, retention, logs, exports, and storage locations for unnecessary sensitive data.",
    artifacts: "Data inventory and retention notes.",
  },
  {
    id: "12.5",
    section: "12. Data Confidentiality (Data at Rest)",
    title: "Systems must prevent confidential information and PII from persistent cookies or cache.",
    testing: "Inspect cookies, browser cache, local storage, and autocomplete for confidential/PII values.",
    artifacts: "Browser storage screenshots with values redacted.",
  },
  {
    id: "12.6",
    section: "12. Data Confidentiality (Data at Rest)",
    title: "Form autocomplete must be disabled on fields collecting credentials, confidential information, and PII.",
    testing: "Inspect sensitive forms and browser autocomplete behavior.",
    artifacts: "Form HTML screenshots and autocomplete behavior evidence.",
  },
  {
    id: "12.7",
    section: "12. Data Confidentiality (Data at Rest)",
    title: "Systems processing confidential or sensitive data must not allow form replay.",
    testing: "Attempt browser back/replay/resubmission of sensitive forms and verify safe handling.",
    artifacts: "Replay test evidence.",
  },
  {
    id: "14.1",
    section: "14. Information Leakage",
    title: "Internal error details must not be displayed to users.",
    testing: "Trigger error conditions and verify stack traces, paths, SQL, hostnames, and debug values are not shown.",
    artifacts: "Error screenshots and safe error message evidence.",
  },
  {
    id: "14.2",
    section: "14. Information Leakage",
    title: "Server-side code must not be sent to end users except explicit presentation code.",
    testing: "Inspect responses, downloads, source maps, and exposed bundles for server-side code leakage.",
    artifacts: "Response/source screenshots.",
  },
  {
    id: "14.3",
    section: "14. Information Leakage",
    title: "Systems must not be susceptible to directory or file enumeration.",
    testing: "Attempt predictable file, path, backup, and directory enumeration.",
    artifacts: "Enumeration request/response evidence.",
  },
  {
    id: "14.4",
    section: "14. Information Leakage",
    title: "Systems must not disclose web service details to unauthenticated users.",
    testing: "Inspect WSDL, OpenAPI, service metadata, and unauthenticated service discovery endpoints.",
    artifacts: "Service metadata access screenshots.",
  },
  {
    id: "14.5",
    section: "14. Information Leakage",
    title: "Systems must prevent username harvesting by unauthenticated users.",
    testing: "Compare login, registration, forgot-password, and invite responses for user enumeration.",
    artifacts: "Enumeration test matrix screenshots.",
    naReason: (context) =>
      noAuthentication(context)
        ? "Marked NA because no username-based authentication workflow is in scope."
        : null,
  },
  {
    id: "14.6",
    section: "14. Information Leakage",
    title: "Sensitive comments embedded in client-side code must be removed.",
    testing: "Inspect HTML, JavaScript, source maps, comments, and bundled files for secrets or internal notes.",
    artifacts: "Client source inspection screenshots.",
  },
  {
    id: "14.7",
    section: "14. Information Leakage",
    title: "Network services should not disclose versions, packages, configuration, or usernames unnecessarily.",
    testing: "Review banners, headers, error messages, service probes, and package metadata exposure.",
    artifacts: "Header and network service screenshots.",
  },
  {
    id: "14.8",
    section: "14. Information Leakage",
    title: "Systems should not disclose username lists to authenticated users.",
    testing: "Check exports, search, autocomplete, assignments, and directory-style pages for unauthorized username disclosure.",
    artifacts: "Authenticated user listing evidence.",
    naReason: (context) =>
      noAuthentication(context)
        ? "Marked NA because authenticated user directories are not in scope."
        : null,
  },
  {
    id: "15.9",
    section: "15. System Design & Architecture",
    title: "Access to forms-based email functions must be authenticated.",
    testing: "Attempt direct access and abuse of contact/email forms without authentication or anti-abuse controls.",
    artifacts: "Email function screenshots and request evidence.",
  },
  {
    id: "15.10",
    section: "15. System Design & Architecture",
    title: "Systems of record data must not be modifiable by the information system.",
    testing: "Identify SOR integrations and verify downstream data cannot be modified beyond approved interfaces.",
    artifacts: "Integration diagram and SOR access notes.",
  },
  {
    id: "15.14",
    section: "15. System Design & Architecture",
    title: "Anti-virus scanning must be performed in real time on files transmitted to the system.",
    testing: "Upload safe malware test files where permitted and verify scanning/quarantine behavior.",
    artifacts: "AV scan evidence and upload workflow screenshots.",
  },
  {
    id: "15.15",
    section: "15. System Design & Architecture",
    title: "Forms-based email submissions must enforce static sender address and prevent modification.",
    testing: "Tamper sender/recipient fields and verify server-side enforcement.",
    artifacts: "Email submission request/response evidence.",
  },
  {
    id: "15.18",
    section: "15. System Design & Architecture",
    title: "DMARC validation.",
    testing: "Verify email-sending domains have DMARC alignment and protection where applicable.",
    artifacts: "DNS/DMARC lookup evidence.",
  },
  {
    id: "15.19",
    section: "15. System Design & Architecture",
    title: "Internet-accessible sites and services must be HTTPS-protected.",
    testing: "Validate all public endpoints are accessible only over HTTPS with correct redirects and no mixed content.",
    artifacts: "HTTPS redirect and mixed-content evidence.",
    naReason: (context) =>
      notInternetFacing(context)
        ? "Marked NA because the application is internal and not accessible from internet or non-EY networks."
        : null,
  },
  {
    id: "16.4",
    section: "16. System Configuration",
    title: "Unnecessary network and system services must be disabled.",
    testing: "Review exposed services and confirm only required ports and services are enabled.",
    artifacts: "Network scan output and service inventory.",
  },
  {
    id: "16.7",
    section: "16. System Configuration",
    title: "Systems must implement vendor-recommended security controls.",
    testing: "Compare platform hardening against vendor and EY baseline recommendations.",
    artifacts: "Hardening checklist and configuration screenshots.",
  },
  {
    id: "16.9",
    section: "16. System Configuration",
    title: "Web servers must support only HTTP methods required for application operation.",
    testing: "Use a web proxy such as Burp to send OPTIONS and validate insecure methods like PUT, DELETE, LOCK, UNLOCK, and TRACE are disabled unless justified.",
    artifacts: "Burp OPTIONS screenshot and evidence of blocked insecure method execution.",
  },
  {
    id: "16.10",
    section: "16. System Configuration",
    title: "Systems implementing HTML5 must adhere to the HTML5 Security Standard.",
    testing: "Review HTML5 storage, CORS, postMessage, WebSockets, APIs, and browser features against the HTML5 security baseline.",
    artifacts: "Local storage, response headers, and origin header tests.",
  },
  {
    id: "16.12",
    section: "16. System Configuration",
    title: "Network services must adhere to SSL/TLS Communications Standard.",
    testing: "Run TLS configuration checks for protocol, cipher, certificate, and downgrade resistance.",
    artifacts: "TLS scan screenshots.",
  },
  {
    id: "16.14",
    section: "16. System Configuration",
    title: "Internet-facing systems must implement secure HTTP headers.",
    testing: "Inspect Content-Security-Policy, Cache-Control, X-XSS-Protection, X-Content-Type-Options, Referrer-Policy, and related headers.",
    artifacts: "Response header screenshots.",
    naReason: (context) =>
      notInternetFacing(context)
        ? "Marked NA because the application is internal and not internet facing."
        : null,
  },
  {
    id: "16.15",
    section: "16. System Configuration",
    title: "Web servers must be configured to disallow directory listing.",
    testing: "Attempt directory browsing on common paths and verify listing is disabled.",
    artifacts: "Directory listing test evidence.",
  },
  {
    id: "17.7",
    section: "17. Secure Development",
    title: "Adobe Flash technology must not be used for new web deployments.",
    testing: "Inspect pages, dependencies, and build artifacts for Flash/SWF usage.",
    artifacts: "Source and dependency evidence.",
  },
  {
    id: "17.8",
    section: "17. Secure Development",
    title: "Existing Adobe Flash technology must be replaced with secure alternatives.",
    testing: "Identify legacy Flash usage and confirm migration plan or replacement evidence.",
    artifacts: "Flash inventory and remediation notes.",
  },
  {
    id: "17.9",
    section: "17. Secure Development",
    title: "Dynamic scanning of web applications must be performed using approved tools.",
    testing: "Confirm approved DAST scan coverage, date, scope, and unresolved findings.",
    artifacts: "Burp/WebInspect/approved scan report.",
  },
  {
    id: "17.11",
    section: "17. Secure Development",
    title: "Systems must not use non-EY external resources unless authorized.",
    testing: "Inspect third-party scripts, APIs, fonts, embeds, package/CDN usage, and external calls.",
    artifacts: "External dependency inventory and approval evidence.",
  },
  {
    id: "19.1",
    section: "19. Web API Validation and Authentication",
    title: "Use a random complicated key, such as JWT Secret, to deter brute forcing the token.",
    testing: "Review token signing configuration and verify strong, random secrets or asymmetric keys.",
    artifacts: "JWT configuration evidence with secrets redacted.",
    naReason: (context) =>
      !isApiScope(context) && context.apiAvailable !== "Yes"
        ? "Marked NA because APIs/JWT token handling were not identified in the demo-call scope."
        : null,
  },
  {
    id: "19.2",
    section: "19. Web API Validation and Authentication",
    title: "Do not allow extraction of algorithms from the payload; force the algorithm in the backend.",
    testing: "Inspect JWT validation to confirm the backend enforces allowed algorithms such as HS256 or RS256.",
    artifacts: "JWT validation code/configuration notes.",
    naReason: (context) =>
      !isApiScope(context) && context.apiAvailable !== "Yes"
        ? "Marked NA because API/JWT validation is not in scope."
        : null,
  },
  {
    id: "19.3",
    section: "19. Web API Validation and Authentication",
    title: "Sensitive data must not be stored in the JWT payload where it can be decoded easily.",
    testing: "Decode JWTs and check for confidential application data, sensitive user information, or system data.",
    artifacts: "Decoded JWT screenshot with values redacted.",
    naReason: (context) =>
      !isApiScope(context) && context.apiAvailable !== "Yes"
        ? "Marked NA because JWT/API tokens are not in scope."
        : null,
  },
  {
    id: "19.4",
    section: "19. Web API Validation and Authentication",
    title: "Content-Type header must be configured securely for request and response.",
    testing: "Verify supported formats, rejected mismatches, response content types, and 406/415 behavior where applicable.",
    artifacts: "Content-Type request/response screenshots.",
    naReason: (context) =>
      !isApiScope(context) && context.apiAvailable !== "Yes"
        ? "Marked NA because API request/response content-type validation is not in scope."
        : null,
  },
  {
    id: "19.5",
    section: "19. Web API Validation and Authentication",
    title: "Applications must avoid user identities in requests to access resources.",
    testing: "Review API identifiers and ensure access decisions do not rely on tamperable user identifiers.",
    artifacts: "API request examples and access-control test evidence.",
    naReason: (context) =>
      !isApiScope(context) && context.apiAvailable !== "Yes"
        ? "Marked NA because APIs are not in scope."
        : null,
  },
  {
    id: "19.6",
    section: "19. Web API Validation and Authentication",
    title: "Enforce usage quotas and rate limits for all APIs.",
    testing: "Attempt burst, brute-force, and high-volume API calls to confirm throttling and quota enforcement.",
    artifacts: "Rate-limit test evidence and response headers.",
    naReason: (context) =>
      !isApiScope(context) && context.apiAvailable !== "Yes"
        ? "Marked NA because API endpoints are not in scope."
        : null,
  },
  {
    id: "20.1",
    section: "20. Thick Client Security Checks",
    title: "Sensitive data on client side must be stored only in encrypted form.",
    testing: "Inspect local files, registry, caches, preferences, and client storage for plaintext sensitive data.",
    artifacts: "Client storage screenshots with sensitive values redacted.",
    naReason: (context) =>
      !isThickClientScope(context)
        ? "Marked NA because the demo-call scope is not a thick-client application."
        : null,
  },
  {
    id: "20.2",
    section: "20. Thick Client Security Checks",
    title: "Application executables must be signed by a trusted certificate authority.",
    testing: "Inspect executable signature, certificate chain, publisher, expiry, and tamper warnings.",
    artifacts: "Executable signature screenshots.",
    naReason: (context) =>
      !isThickClientScope(context)
        ? "Marked NA because no thick-client executable is in scope."
        : null,
  },
  {
    id: "20.3",
    section: "20. Thick Client Security Checks",
    title: "Application must be prevented from decompilation using techniques like obfuscation.",
    testing: "Review binary protections, obfuscation, debug symbols, and reverse-engineering resistance.",
    artifacts: "Binary inspection evidence.",
    naReason: (context) =>
      !isThickClientScope(context)
        ? "Marked NA because no thick-client binary is in scope."
        : null,
  },
  {
    id: "20.4",
    section: "20. Thick Client Security Checks",
    title: "Application must not contain hardcoded database queries.",
    testing: "Inspect binary/configuration for embedded SQL, connection strings, credentials, and direct database logic.",
    artifacts: "Binary/static analysis evidence.",
    naReason: (context) =>
      !isThickClientScope(context)
        ? "Marked NA because no thick-client package is in scope."
        : null,
  },
  {
    id: "20.5",
    section: "20. Thick Client Security Checks",
    title: "Application executables must have anti-tamper protection.",
    testing: "Review integrity checks, tamper detection, code signing, and runtime protection.",
    artifacts: "Tamper protection evidence.",
    naReason: (context) =>
      !isThickClientScope(context)
        ? "Marked NA because executable tamper protection is not applicable."
        : null,
  },
  {
    id: "21.1",
    section: "21. Large Language Model (LLM) Application Security",
    title: "Information systems must not be susceptible to Model Denial of Service.",
    testing: "Test prompt and input limits, token exhaustion, expensive-tool abuse, and throttling for LLM features.",
    artifacts: "LLM abuse test evidence and rate-limit screenshots.",
    naReason: (context) =>
      !isLlmScope(context)
        ? "Marked NA because demo-call intake indicates no LLM/AI usage for this application."
        : null,
  },
];

export const webFeadControls = feadControls.filter(
  (control) =>
    control.section !== "21. Large Language Model (LLM) Application Security",
);

const llmNotInScope = (context: FeadContext) =>
  !isLlmScope(context)
    ? "Marked NA because demo-call intake indicates no LLM/AI usage and LLM FEAD is not required."
    : null;

export const llmFeadControls: FeadControl[] = [
  {
    id: "0.1",
    section: "0. LLM Review Authorization",
    title: "Security review notification and stakeholder awareness must be confirmed.",
    testing: "Confirm LLM feature owner, model owner, data owner, security reviewer, and business stakeholders are aware of the LLM security review scope.",
    artifacts: "Review authorization, demo-call notes, stakeholder approval, LLM feature inventory.",
    naReason: llmNotInScope,
  },
  {
    id: "6.3",
    section: "6. Authentication",
    title: "Authentication controls must be enforced server-side and cannot be bypassed.",
    testing: "Validate authenticated access to LLM features, model endpoints, plugin/tool invocation, prompt history, and admin functions.",
    artifacts: "Authentication flow screenshots, access-control test evidence, server-side enforcement notes.",
    naReason: llmNotInScope,
  },
  {
    id: "7.1",
    section: "7. Authorization",
    title: "Authorization controls must enforce access to data, functions, model operations, and services.",
    testing: "Verify users cannot access unauthorized prompts, conversations, files, embeddings, vector stores, tools, or model operations.",
    artifacts: "RBAC matrix, authorization bypass test evidence, prompt/session access screenshots.",
    naReason: llmNotInScope,
  },
  {
    id: "9.3",
    section: "9. Input Validation",
    title: "LLM-enabled interfaces must not be susceptible to Cross-Site Scripting.",
    testing: "Test prompt input, output rendering, chat history, markdown/HTML rendering, file summaries, and model-generated links for stored/reflected XSS.",
    artifacts: "Payload evidence, rendered output screenshots, sanitization notes.",
    naReason: llmNotInScope,
  },
  {
    id: "9.4",
    section: "9. Input Validation",
    title: "LLM workflows must not be susceptible to command injection.",
    testing: "Validate inputs passed from prompts to tools, scripts, shells, agents, plugins, retrieval jobs, and backend commands cannot inject executable instructions.",
    artifacts: "Tool invocation tests, command execution safeguards, failed injection evidence.",
    naReason: llmNotInScope,
  },
  {
    id: "9.10",
    section: "9. Input Validation",
    title: "LLM integrations must not be susceptible to Server Side Request Forgery.",
    testing: "Test URL fetching, plugins, connectors, retrieval importers, browsing tools, and file loaders for SSRF and internal network access.",
    artifacts: "SSRF test screenshots, allowlist/blocklist evidence, connector configuration.",
    naReason: llmNotInScope,
  },
  {
    id: "11.1",
    section: "11. Secure Communications",
    title: "Secure tokens and static access tokens must be protected during transmission.",
    testing: "Confirm LLM API keys, model gateway tokens, plugin tokens, and session credentials are transmitted only over secure channels.",
    artifacts: "TLS evidence, request/response screenshots with secrets redacted, token handling notes.",
    naReason: llmNotInScope,
  },
  {
    id: "14.2",
    section: "14. Information Leakage",
    title: "Server-side code must not be sent to an end-user machine except approved presentation code.",
    testing: "Inspect frontend bundles, model prompts, error traces, debug responses, and generated outputs for server-side code disclosure.",
    artifacts: "Bundle review, response screenshots, error handling evidence.",
    naReason: llmNotInScope,
  },
  {
    id: "14.7",
    section: "14. Information Leakage",
    title: "Network services should not unnecessarily disclose versions or configuration details.",
    testing: "Check model gateway, APIs, plugins, connectors, and error responses for version disclosure, stack traces, model/provider metadata, or infrastructure leakage.",
    artifacts: "Header/error screenshots, service fingerprinting notes.",
    naReason: llmNotInScope,
  },
  {
    id: "15.18",
    section: "15. System Design & Architecture",
    title: "Forms-based email submissions and model-generated email functions must apply sender restrictions.",
    testing: "Validate LLM-assisted email generation or notification flows cannot spoof senders, alter sender addresses, or trigger unauthorized email sends.",
    artifacts: "Email workflow screenshots, sender validation evidence, failed abuse tests.",
    naReason: llmNotInScope,
  },
  {
    id: "16.14",
    section: "16. System Configuration",
    title: "Security headers including CSP, Cache-Control, and X-Content-Type-Options must be implemented.",
    testing: "Verify LLM UI, chat pages, file viewers, rendered responses, and model output pages enforce appropriate browser security headers.",
    artifacts: "Response header screenshots and CSP/cache-control validation evidence.",
    naReason: llmNotInScope,
  },
  {
    id: "19.1",
    section: "19. Web API Validation and Authentication",
    title: "JWT secrets and token signing keys must be strong and protected.",
    testing: "Review model/API gateway JWT configuration, token signing, secret management, and brute-force resistance.",
    artifacts: "JWT configuration notes with secrets redacted.",
    naReason: llmNotInScope,
  },
  {
    id: "19.2",
    section: "19. Web API Validation and Authentication",
    title: "JWT algorithms must be enforced server-side and not accepted from payload/user input.",
    testing: "Verify token validation pins allowed algorithms and rejects none/weak/algorithm-confusion cases.",
    artifacts: "JWT validation evidence and failed algorithm manipulation tests.",
    naReason: llmNotInScope,
  },
  {
    id: "19.3",
    section: "19. Web API Validation and Authentication",
    title: "Sensitive data must not be stored in JWT payloads or easily decoded tokens.",
    testing: "Decode LLM/API tokens and validate they do not expose confidential application, user, prompt, model, or system information.",
    artifacts: "Decoded token evidence with values redacted.",
    naReason: llmNotInScope,
  },
  {
    id: "19.4",
    section: "19. Web API Validation and Authentication",
    title: "Content-Type headers must be configured securely for LLM/API requests and responses.",
    testing: "Validate accepted content types for prompt, file upload, embedding, chat, plugin, and response endpoints.",
    artifacts: "Request/response content-type evidence and rejected mismatch tests.",
    naReason: llmNotInScope,
  },
  {
    id: "19.5",
    section: "19. Web API Validation and Authentication",
    title: "Applications must avoid user identities in requests to access resources.",
    testing: "Confirm LLM endpoints cannot access another user's prompt history, files, embeddings, or conversations by tampering with user identifiers.",
    artifacts: "IDOR/access-control evidence for LLM resources.",
    naReason: llmNotInScope,
  },
  {
    id: "19.6",
    section: "19. Web API Validation and Authentication",
    title: "Usage quotas and rate limits must be enforced for LLM/API endpoints.",
    testing: "Test rate limits for prompts, completions, embeddings, file uploads, retrieval, plugin/tool calls, and expensive model operations.",
    artifacts: "Rate-limit test evidence and quota configuration.",
    naReason: llmNotInScope,
  },
  {
    id: "21.1",
    section: "21. Large Language Model (LLM) Application Security",
    title: "Information systems must not be susceptible to Model Denial of Service.",
    testing: "Test prompt length, token exhaustion, recursive agent loops, expensive retrieval, and high-cost model calls for abuse resistance.",
    artifacts: "Model DoS tests, throttling evidence, max-token and timeout configuration.",
    naReason: llmNotInScope,
  },
  {
    id: "21.2",
    section: "21. Large Language Model (LLM) Application Security",
    title: "LLM systems must prevent unauthorized data exfiltration.",
    testing: "Validate prompts, retrieval, tools, plugins, and model outputs cannot leak confidential data, embeddings, system prompts, secrets, or cross-user information.",
    artifacts: "Exfiltration test evidence, data boundary notes, failed leakage screenshots.",
    naReason: llmNotInScope,
  },
  {
    id: "21.3",
    section: "21. Large Language Model (LLM) Application Security",
    title: "LLM systems must be protected against data poisoning.",
    testing: "Review training, fine-tuning, RAG ingestion, knowledge base uploads, embedding refresh, and source trust controls for poisoning resistance.",
    artifacts: "Data source approvals, ingestion controls, poisoning test evidence.",
    naReason: llmNotInScope,
  },
  {
    id: "21.4",
    section: "21. Large Language Model (LLM) Application Security",
    title: "LLM systems must resist prompt injection and jailbreak attacks.",
    testing: "Test direct, indirect, multi-turn, retrieval-based, file-based, and tool-mediated prompt injection and jailbreak attempts.",
    artifacts: "Prompt injection payloads, model responses, guardrail evidence.",
    naReason: llmNotInScope,
  },
  {
    id: "21.5",
    section: "21. Large Language Model (LLM) Application Security",
    title: "LLM systems must prevent arbitrary plugin or tool invocation.",
    testing: "Validate tools/plugins/connectors require authorization, scoped permissions, allowlisted actions, and user confirmation where required.",
    artifacts: "Tool policy evidence, unauthorized invocation tests, plugin access matrix.",
    naReason: llmNotInScope,
  },
  {
    id: "21.6",
    section: "21. Large Language Model (LLM) Application Security",
    title: "LLM systems must prevent sensitive data leakage.",
    testing: "Check prompts, responses, logs, traces, telemetry, vector stores, cache, and chat history for sensitive data exposure.",
    artifacts: "Sensitive-data leakage tests, logging configuration, redaction evidence.",
    naReason: llmNotInScope,
  },
  {
    id: "21.7",
    section: "21. Large Language Model (LLM) Application Security",
    title: "Open-source models, packages, and LLM components must have approval.",
    testing: "Verify OSS model, package, connector, plugin, agent framework, and embedding component approvals are documented.",
    artifacts: "OSS approval records, component inventory, model/provider approval evidence.",
    naReason: llmNotInScope,
  },
  {
    id: "17.13",
    section: "17. Secure Development",
    title: "EY Responsible AI principles must be followed for LLM features.",
    testing: "Validate fairness, privacy, transparency, accountability, safety, and human oversight are addressed for the LLM use case.",
    artifacts: "Responsible AI assessment, governance approval, use-case risk notes.",
    naReason: llmNotInScope,
  },
  {
    id: "17.14",
    section: "17. Secure Development",
    title: "Model validation and drift monitoring must be defined.",
    testing: "Review model validation, evaluation datasets, output quality checks, monitoring thresholds, and drift response process.",
    artifacts: "Model validation report, monitoring dashboard, drift process evidence.",
    naReason: llmNotInScope,
  },
  {
    id: "17.15",
    section: "17. Secure Development",
    title: "Audit trail and explainability must be available for LLM decisions.",
    testing: "Confirm prompts, tool actions, model decisions, approvals, user actions, and review outcomes are logged with explainability where required.",
    artifacts: "Audit log screenshots, explainability notes, trace IDs, governance workflow evidence.",
    naReason: llmNotInScope,
  },
];
