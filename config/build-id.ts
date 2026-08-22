export function resolveBuildId(
  environmentOverride: string | undefined,
  readGitBuildId: () => string,
) {
  const override = environmentOverride?.trim();
  if (override) return override;

  try {
    return readGitBuildId().trim();
  } catch {
    return "local";
  }
}
