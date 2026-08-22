USE uiadapt_demo;

ALTER TABLE uiadapt_distribution_snapshots
  ADD COLUMN adaptive_enabled BOOLEAN NULL AFTER applied_state;

UPDATE uiadapt_distribution_snapshots AS snapshots
INNER JOIN uiadapt_sessions AS sessions
  ON sessions.session_id = snapshots.session_id
SET snapshots.adaptive_enabled = sessions.adaptive_enabled
WHERE snapshots.adaptive_enabled IS NULL;

ALTER TABLE uiadapt_distribution_snapshots
  MODIFY COLUMN adaptive_enabled BOOLEAN NOT NULL;
