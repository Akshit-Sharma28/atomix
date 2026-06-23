---
title: Scan Report Evidence Mapping
source: Atomix Library
documentType: Scan Report
summary: How scanner outputs should be categorized and mapped into review evidence.
---
# Scan Report Evidence Mapping

Scan reports support the review but do not replace manual validation. Each report should be linked to project scope, target environment, scan date, scanner type, and the controls it supports.

## Supported scan report categories
- Burp Suite or DAST evidence for web/API behavior.
- Checkmarx or SAST evidence for source-level weakness patterns.
- Mend or SCA evidence for third-party dependency risk.
- AquaSec or container/cloud workload evidence.
- Qualys or infrastructure evidence for host and platform posture.
- Manual screenshots, exports, or notes when automated scanning is not available.

## Evidence mapping rules
- Findings must map to the affected endpoint, role, control, severity, and review record.
- Duplicate scanner findings should be grouped before adding review evidence.
- False positives should include reviewer rationale.
- Missing scan reports should be explicitly marked out of scope or not available.

## Copilot use
Copilot can summarize scan output, identify likely duplicates, suggest control mappings, and draft review questions. Reviewer approval is still required before any finding or status is recorded.
