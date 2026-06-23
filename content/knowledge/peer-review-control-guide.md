---
title: Peer Review Control Coverage Guide
source: Atomix Library
documentType: Control
summary: Control areas QA reviewers should verify across FEAD, BEAD, and scan evidence.
---
# Peer Review Control Coverage Guide

Peer review should verify that the reviewer tested the controls applicable to the application's scope and risk. The objective is not to redo the full review, but to identify missing evidence, missed controls, and unclear risk decisions.

## Core control groups
- Review authorization and stakeholder awareness.
- Authentication, password, challenge-response, OTP, lockout, and credential transmission.
- Authorization, RBAC, object-level access, and horizontal/vertical privilege checks.
- Session management, cookies, CSRF, logout, token regeneration, and concurrent session controls.
- Input validation: XSS, command injection, SQL/LDAP/XML/XPath injection, redirect, CRLF, traversal, SSRF, upload validation, deserialization, XXE, and SRI.
- Cryptography and secure communications: certificate validity, HSTS, HTTPS-only flows, no weak protocols, no token leakage in URL.
- Information leakage: server errors, directory listing, WSDL/service disclosure, username harvesting, sensitive comments, version disclosure.
- API controls: JWT algorithm enforcement, no sensitive JWT payload, rate limits, content-type, identity exposure, and authorization.

## Peer-review evidence expectations
- Screenshots or scan evidence should map to the control being claimed.
- PASS controls need enough proof to show what was tested.
- FAIL controls need impact, affected role, affected endpoint, reproduction notes, and remediation.
- INFO or not-rated controls need clear justification.
