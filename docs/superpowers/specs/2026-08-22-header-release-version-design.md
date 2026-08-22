# Header Release Version Design

## Goal

Display the UIAdapt product release generation beside the existing header lockup. The current value is `R9`, and future builds can change it without editing the React component.

## Design

- Use the Vite client environment variable `VITE_UIADAPT_RELEASE` as the single release-label input.
- Set the repository default to `R9` for the current source candidate.
- Render a compact release badge after `Adaptive UI Infrastructure` in the existing brand lockup.
- Preserve the existing `UIAdapt 홈` accessible link name and brand subtitle.
- If the build variable is absent or blank, omit the badge instead of displaying a guessed or malformed version.

## Test Coverage Perimeter

- Component regression: the header renders `R9` while retaining the existing brand text.
- Accessibility regression: the existing home-link accessible name remains unchanged.
- Build regression: TypeScript and Vite accept the custom `VITE_` variable.

The test must fail for the missing badge before production code is changed.

## Scope

In scope:

- Header release-label rendering.
- Build-time release value configuration.
- Minimal styling and component regression coverage.

Out of scope:

- Runtime release discovery.
- Git SHA display.
- Distribution Engine, telemetry, API, database, deployment, or rollback behavior.
- Reinterpreting the package semantic version (`4.1.0`) as the product release generation.

## Acceptance Criteria

1. The header visibly identifies the current product release as `R9`.
2. The value comes from `VITE_UIADAPT_RELEASE`, not a literal inside `App.tsx`.
3. The existing brand subtitle and accessible home-link name remain unchanged.
4. A missing or blank release value does not render an empty badge.
5. Focused component tests, lint, and build pass in the independent verification session.
