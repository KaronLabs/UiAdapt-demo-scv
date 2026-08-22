# Trajectory and Rollback Remediation Design

## Goal

Remove the four blockers identified in case `2026-UIA-DIST-V1-PRECOURT-0822` without changing the Distribution Engine algorithm or splitting a user journey across sessions.

## Chosen design

Telemetry policy is evaluated per snapshot. `TelemetryFrame.snapshot.adaptiveEnabled` records the causal presentation mode for that frame, while the session's existing `adaptive_enabled` remains initial metadata. Event source is already stored per event, so the session source remains initial metadata and mixed `REPLAY` then `USER` frames are accepted in one monotonic sequence.

Candidate persistence is validated as a recurrence against the immediately previous snapshot: an ineligible or detected-state candidate has persistence zero; a new eligible candidate starts at one; the same pending candidate advances by exactly one; and a transition requires the previous value two and current value three.

Rollback readiness is capability-aware. A target containing `server/uiadapt-api.mjs` uses static, API, gateway, and authenticated API/DB health checks. A legacy target without that file stops the API service, restarts static and gateway only, and requires the existing authenticated static/public smoke checks.

## Data changes

- Add non-null `adaptive_enabled` to `uiadapt_distribution_snapshots`.
- Add `adaptiveEnabled: boolean` to `DistributionSnapshot` and validate it at the API boundary.
- Persist and return the snapshot value in all trajectory operations.
- Retain session column names to avoid an unnecessary destructive migration; document their initial-metadata meaning in code behavior.

## Compatibility and failure behavior

- Existing R9 session creation remains unchanged.
- Mixed event sources do not weaken event-level provenance because every event retains `event_source`.
- Invalid adaptive/applied-state combinations and discontinuous persistence return `422 TRAJECTORY_INCONSISTENT` before insertion.
- Legacy rollback does not declare API health; API-capable rollback still requires it.

## Test coverage perimeter

- Deployment contract: injected R9 switch failure rolls back to an API-absent R8 fixture.
- DB/API: same session persists `REPLAY` then `USER` in sequence.
- DB/API: same session persists adaptive ON, OFF, ON snapshots with matching applied states.
- Validation/DB: forged persistence `0 -> 2` is rejected with no insert; valid recurrence remains accepted.
- Schema and serialization: snapshot adaptive value is present on insert and readback.
- Full probationary commands from Chapter 6, including disposable MySQL integration with zero skips.

## Non-goals

- No Distribution Engine threshold or state-selection changes.
- No new session lifecycle or `MIXED` enum.
- No deployment, service restart, or production database mutation.

