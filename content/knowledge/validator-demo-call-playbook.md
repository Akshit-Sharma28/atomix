---
title: Validator Demo Call Playbook
source: Atomix Library
documentType: Playbook
summary: Scope-intake checklist for validators before a security review starts.
---
# Validator Demo Call Playbook

Use this during review intake or demo-call preparation. The validator confirms that the project team has enough information ready for a clean review start.

## Required intake fields
- Application name, review record, project manager, security consultant, reviewer, and target environment.
- URL, IP address, authentication model, user roles, data sensitivity, and expected traffic path.
- Application type: Web, API, LLM, Web + LLM, Thick Client, or mixed scope.
- Risk profile: confidentiality, integrity, availability, overall risk, attack vector, and authentication level.

## Evidence readiness
- FEAD is present for frontend/web controls.
- BEAD is present when backend, API, service-side logic, or data-processing behavior is in scope.
- LLM FEAD is present when the app uses model, prompt, RAG, tool-calling, plugin, or autonomous workflow behavior.
- Scan reports are attached or explicitly marked not applicable.

## Demo-call questions
- Which roles need credentials for testing?
- Is SSO, form login, JWT, API key, or multiple authentication paths used?
- Does the app process confidential, personal, regulated, or business-sensitive data?
- Are file uploads, redirects, webhooks, forms-based email, admin actions, or report generation in scope?
- Are any test constraints, blackout periods, known exceptions, or environment readiness issues present?

## Output
Create a pre-review scope document with open questions, required evidence, in-scope controls, and start readiness status.
