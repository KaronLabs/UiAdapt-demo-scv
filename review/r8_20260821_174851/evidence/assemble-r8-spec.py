import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
EVIDENCE = Path(__file__).resolve().parent
SPEC = ROOT / "review" / "spec_20260821_182018_uiadapt_investor_stage_nwg_release_r8.md"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def evidence_quote(name: str, observation: str, evidence_type: str) -> dict:
    capture = json.loads((EVIDENCE / name).read_text(encoding="utf-8"))
    return {
        "command": capture["command"],
        "stdout": capture["stdout"],
        "stderr": capture["stderr"],
        "exit_code": capture["exit_code"],
        "observation": observation,
        "timestamp": capture["captured_at_utc"],
        "evidence_type": evidence_type,
        "capture_file": f"r8_20260821_174851/evidence/{name}",
    }


document = {
    "document_title": "R8 재심청구서 및 무결성 영수증 — UIAdapt Investor Stage NWG Release",
    "meta": {
        "created_at_utc": "2026-08-21T09:20:18Z",
        "review_target": "Git commit 00c4c47a63f859d33b4264f6e6ddb3c5ef71913b on codex/uiadapt-investor-r8-remediation",
        "comparison_base": "fba3d9d390c50cf4cdcfd9c51fd3aa616eeb2a91",
        "main_sha": "68ac3a8abc1dfda26aa004d9d6d8e8db179b17d0",
        "live_nwg_release": "fba3d9d390c50cf4cdcfd9c51fd3aa616eeb2a91",
        "status": "READY_FOR_INDEPENDENT_COURT_REVIEW",
        "verdict_scope": "R8 source remediation, non-destructive deployment-test contract, documentation, tracked threat model, exact-head local and remote CI evidence",
        "excluded_scope": [
            "R8 live deployment",
            "merge to main",
            "full host reboot",
            "three-person product-clarity experiment",
            "new public-browser acceptance of R8",
        ],
        "reviewer_access_assumption": "The reviewer receives this spec, the complete review/r8_20260821_174851/evidence directory, Git access to the target and comparison base, and the historical R3 package under review/evidence/run_20260821_020352_uiadapt_investor_stage.",
        "constitution_paths": [
            "E:/03_AllWork/grafana/AGENTS.md",
            "No repository-local AGENTS.md, CLAUDE.md, GEMINI.md or SECURITY.md was claimed for this worktree.",
        ],
    },
    "petition": {
        "requested_disposition": "Dismiss the factually incorrect R3 evidence/live-release absence charges, accept the valid operational and evidence-accessibility findings, and adjudicate the remediated exact R8 source from the sealed package.",
        "remediation_status": "COMPLETED_FOR_DECLARED_SOURCE_SCOPE",
        "live_release_status": "UNCHANGED_R3_FBA3D9D",
        "main_integration_status": "NOT_PERFORMED",
        "product_clarity": "NOT_VERIFIED",
    },
    "rebuttal_matrix": [
        {
            "charge": "R3 evidence package absent",
            "finding": "FACTUALLY_REBUTTED_BUT_ACCESSIBILITY_DEFECT_ACCEPTED",
            "facts": "The append-only R3 package exists locally, contains a self-excluding 40-entry SHA256SUMS manifest, raw command captures, independent receipts and 18 screenshots. The first R8 verification invocation used an invalid CLI option and failed RC 2; the corrected positional invocation verified all 40 files and returned GREEN. The prior materials were untracked and therefore unavailable to a GitHub-only reviewer, so the accessibility criticism is accepted.",
            "evidence": ["r3-manifest-reverify.json", "r3-manifest-reverify-rerun1.json"],
        },
        {
            "charge": "R3 live release not verified",
            "finding": "FACTUALLY_REBUTTED",
            "facts": "Historical R3 runtime/provenance/public-smoke receipts bind nwg current to fba3d9d. A fresh R8 read-only runtime capture again reports current=fba3d9d with static and gateway active/enabled and credential metadata 600 root root. R8 itself is explicitly not deployed.",
            "evidence": ["live-runtime-current-rerun1.json", "review/evidence/run_20260821_020352_uiadapt_investor_stage/runtime-verification.json"],
        },
        {
            "charge": "Deployment contract can delete live projectRoot/www and collide with 5173",
            "finding": "ACCEPTED_AND_REMEDIATED",
            "facts": "The integration now uses mkdtemp-owned staging, dynamic ports, and cleanup confined to the temporary root. Durable tests reject project-root staging/removal, preserve a project sentinel hash, and pass with an external listener occupying 127.0.0.1:5173.",
            "evidence": ["sentinel-probation-rerun1.json", "port-probation-rerun1.json", "source-diff-rerun1.json"],
        },
        {
            "charge": "README and release runbook incomplete",
            "finding": "ACCEPTED_AND_REMEDIATED",
            "facts": "README now enumerates the complete local verification contract. docs/investor-stage-nwg-release.md documents version-addressed staging, bounded health checks, one-shell fail-closed switch and rollback, and explicitly denies filesystem immutability.",
            "evidence": ["source-diff-rerun1.json", "source-gate-rerun2.json"],
        },
        {
            "charge": "Tracked gateway/NWG threat model absent",
            "finding": "ACCEPTED_AND_REMEDIATED",
            "facts": "docs/security/investor-preview-threat-model.md now records assets, trust boundaries, current controls, absent controls, fail-closed conditions, and accepted risks without inventing an exploit.",
            "evidence": ["source-diff-rerun1.json", "independent-source-spec-review.json"],
        },
        {
            "charge": "Exact R8 remote CI absent",
            "finding": "ACCEPTED_AND_REMEDIATED",
            "facts": "The workflow trigger includes only main and codex/uiadapt-investor-r8-remediation for push, retains main-targeted pull requests, and grants contents:read. GitHub run 32466937260 completed successfully for exact head 00c4c47a; verify and runtime-contract passed and the artifact was uploaded.",
            "evidence": ["github-actions-run-32466937260.json", "git-target-remote.json"],
        },
    ],
    "implementation_summary": [
        "Isolated deployment tests from project and live-serving paths.",
        "Replaced fixed test ports with OS-assigned ports and added external-5173 regression coverage.",
        "Added tests proving project www hash invariance, canonical staging ownership, rollback failure propagation and bounded smoke deadlines.",
        "Updated README, NWG release runbook and threat model.",
        "Added exact R8 branch CI trigger without deployment permissions or secrets.",
        "Narrowed ESLint exclusions to generated/historical evidence while retaining negative controls for ordinary review and src files.",
    ],
    "source_binding": {
        "application_source_sha": "00c4c47a63f859d33b4264f6e6ddb3c5ef71913b",
        "remote_branch_sha": "00c4c47a63f859d33b4264f6e6ddb3c5ef71913b",
        "comparison_base": "fba3d9d390c50cf4cdcfd9c51fd3aa616eeb2a91",
        "changed_paths": [
            ".github/workflows/verify.yml",
            "README.md",
            "docs/investor-stage-nwg-release.md",
            "docs/security/investor-preview-threat-model.md",
            "docs/superpowers/plans/2026-08-21-uiadapt-r8-remediation.md",
            "docs/superpowers/specs/2026-08-21-uiadapt-r8-remediation-design.md",
            "eslint.config.js",
            "scripts/nwg-deployment-contract.test.mjs",
        ],
        "diff_capture": "review/r8_20260821_174851/evidence/source-diff-rerun1.json",
        "diff_capture_sha256": sha256(EVIDENCE / "source-diff-rerun1.json"),
    },
    "verification_summary": {
        "initial_source_gate": "RC 1; expected evidence-helper lint boundary failure preserved",
        "final_source_gate": "RC 0; npm ci, lint, Vitest 19/19, gateway 16/16, two-base build verification, production build, Playwright 45/45, production audit 0 vulnerabilities and diff-check pass",
        "sentinel_probation": "RC 0; deployment 17/17; identical before/after SHA-256",
        "port_probation": "RC 0; dummy 5173 listener active; deployment 17/17",
        "r3_manifest": "initial RC 2 wrong syntax preserved; corrected RC 0 verifies 40 files GREEN",
        "remote_ci": "GitHub run 32466937260 exact head; verify success; runtime-contract success; artifact uploaded",
        "independent_spec_review": "GO; Critical 0, Important 0; two non-blocking minors",
        "independent_quality_review": "GO; Critical 0, Important 0; three non-blocking minors",
    },
    "independent_review_receipts": [
        {
            "path": "review/r8_20260821_174851/evidence/independent-source-spec-review.json",
            "sha256": sha256(EVIDENCE / "independent-source-spec-review.json"),
            "verdict": "GO",
        },
        {
            "path": "review/r8_20260821_174851/evidence/independent-source-quality-review.json",
            "sha256": sha256(EVIDENCE / "independent-source-quality-review.json"),
            "verdict": "GO",
        },
    ],
    "remote_ci_receipt": {
        "path": "review/r8_20260821_174851/evidence/github-actions-run-32466937260.json",
        "sha256": sha256(EVIDENCE / "github-actions-run-32466937260.json"),
        "run_id": 32466937260,
        "head_sha": "00c4c47a63f859d33b4264f6e6ddb3c5ef71913b",
        "verify": "success",
        "runtime_contract": "success",
        "artifact_digest": "sha256:885a333e71ce2546e0d720f026b50f5f0eb48ffdcb8f18ad8b3662d142a2fbda",
    },
    "evidence_quotes": [
        evidence_quote(
            "source-gate.json",
            "The first full source gate failed at lint because the newly created evidence helper was outside the prior generated-evidence exclusion. The failure is preserved and not relabeled as a product failure.",
            "repro",
        ),
        evidence_quote(
            "source-gate-rerun2.json",
            "Fresh final source verification returned RC 0 across install, lint, unit/component, gateway, two-base builds, production build, 45 Playwright cases, production audit and diff check.",
            "automated",
        ),
        evidence_quote(
            "sentinel-probation-rerun1.json",
            "The deployment suite passed 17 tests and preserved the exact project sentinel SHA-256 across the run.",
            "integration",
        ),
        evidence_quote(
            "port-probation-rerun1.json",
            "An external process held 127.0.0.1:5173 while all 17 deployment tests passed, proving the integration no longer requires the live static-service port.",
            "integration",
        ),
        evidence_quote(
            "r3-manifest-reverify.json",
            "Disclosed failed verification attempt: the unsupported --evidence-dir option produced RC 2. The failed receipt remains append-only.",
            "repro",
        ),
        evidence_quote(
            "r3-manifest-reverify-rerun1.json",
            "The corrected positional finalizer invocation verified all 40 historical R3 evidence files and reported GREEN.",
            "automated",
        ),
        evidence_quote(
            "git-target-remote.json",
            "Local HEAD and the remote R8 branch resolve to the exact review target; main remains at its prior SHA and untracked historical evidence is disclosed.",
            "automated",
        ),
        evidence_quote(
            "live-runtime-current-rerun1.json",
            "Fresh read-only runtime inspection confirms the live current release remains R3 fba3d9d, both services are active/enabled, and only credential metadata was captured.",
            "runtime",
        ),
    ],
    "evidence_package": {
        "directory": "review/r8_20260821_174851/evidence",
        "integrity_receipt": "review/r8_20260821_174851/evidence/integrity-receipt.json",
        "risk_register": "review/r8_20260821_174851/evidence/risk-register.md",
        "handoff": "review/r8_20260821_174851/evidence/HANDOFF.md",
        "manifest": "review/r8_20260821_174851/evidence/SHA256SUMS",
        "manifest_policy": "Self-excluding SHA-256 manifest; generated after all evidence payloads and review receipts are present.",
        "failed_captures_preserved": ["source-gate.json", "r3-manifest-reverify.json"],
        "uncaptured_failure_disclosure": "A first attempt to invoke the live read-only command failed in the orchestrator shell before a capture file was created due to shell parsing. No runtime mutation occurred; the corrected captured command is live-runtime-current-rerun1.json.",
    },
    "risks": [
        {
            "description": "R8 has not been deployed; live remains R3 fba3d9d.",
            "severity": "medium",
            "handling": "accepted_unresolved",
        },
        {
            "description": "PRODUCT_CLARITY=NOT_VERIFIED because no real three-person non-developer test was run.",
            "severity": "medium",
            "handling": "plan",
            "plan": "Run the prescribed 30-second test before claiming human clarity.",
        },
        {
            "description": "Application-layer rate limiting, dedicated service account, complete hop-by-hop filtering, explicit request/WebSocket timeout pinning, and deployment-preflight credential metadata assertion remain absent.",
            "severity": "medium",
            "handling": "accepted_unresolved",
        },
        {
            "description": "Test-only dynamic port reservation/rebind and sequential cleanup have bounded residue/flakiness windows.",
            "severity": "low",
            "handling": "accepted_unresolved",
        },
        {
            "description": "GitHub Action JavaScript internals reported Node 20 compatibility warnings while both exact-head jobs passed.",
            "severity": "low",
            "handling": "accepted_unresolved",
        },
    ],
    "companion_processes": {
        "evidence_quote_linter": "COMPLETE_RC0; review/r8_20260821_174851/evidence/r8-spec-lint.json",
        "self_excluding_manifest_seal": "PENDING_UNTIL_FINAL_PAYLOAD",
        "independent_source_spec_review": "COMPLETE_GO",
        "independent_source_quality_review": "COMPLETE_GO",
        "verification_before_completion": "COMPLETE_FOR_SOURCE_GATE_AND_PROBATION; final package verify pending at authoring time",
    },
    "final_position": {
        "source_remediation": "READY_FOR_COURT",
        "live_r8_acceptance": "NOT_CLAIMED",
        "main_integration": "NOT_PERFORMED",
        "product_clarity": "NOT_VERIFIED",
        "critical_findings": 0,
        "important_findings": 0,
        "minor_findings": 4,
        "required_next_action": "Seal and verify the evidence manifest, then give the spec and whole package to a different-session adjudicator. Deploy R8 only under a separate authorization and fresh public-smoke gate.",
    },
}

SPEC.write_text(json.dumps(document, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(SPEC)
