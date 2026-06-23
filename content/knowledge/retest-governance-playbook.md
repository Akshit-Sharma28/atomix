---
title: Retest Governance Playbook
source: Atomix Library
documentType: Playbook
summary: Tracks retest requests, assignment readiness, extensions, and closure signals.
---
# Retest Governance Playbook

Retest governance begins after the application team claims fixes are ready. The workflow should ensure access, scope, evidence, and reviewer capacity are ready before assignment.

## Retest request fields
- Project, review record, charge code, initial reviewer, requested date, scope, review type, controls in retest, and number of prior iterations.
- Fix readiness confirmation from the app team.
- Test credentials, target environment, and access constraints.
- Assigned retester, status, extension need, due date, and cancellation/completion reason.

## Status model
- Not assigned: request exists but no retester mapped.
- In progress: retester is validating fixes.
- Completed: retest evidence is captured and status is updated.
- Cancelled: retest no longer required or environment is unavailable.
- Overdue: due date passed with incomplete validation.
- Extension needed: retester or app team requires additional time.

## Governance KPIs
- Open retest requests by status.
- Overdue retests and extension pressure.
- Average retest turnaround.
- Repeat retests by project or control.
- Retester pool availability and assignment balance.
