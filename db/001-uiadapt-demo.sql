CREATE DATABASE IF NOT EXISTS uiadapt_demo
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE uiadapt_demo;

CREATE TABLE IF NOT EXISTS uiadapt_sessions (
  session_id CHAR(36) NOT NULL,
  started_at_ms BIGINT UNSIGNED NOT NULL,
  ended_at_ms BIGINT UNSIGNED NULL,
  event_source ENUM('USER', 'REPLAY') NOT NULL,
  adaptive_enabled BOOLEAN NOT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS uiadapt_events (
  session_id CHAR(36) NOT NULL,
  sequence_no BIGINT UNSIGNED NOT NULL,
  event_id VARCHAR(128) NOT NULL,
  at_ms BIGINT UNSIGNED NOT NULL,
  raw_event_type ENUM(
    'VIEW_PRODUCT', 'OPEN_DETAILS', 'CHECK_PRICE', 'CHECK_REVIEWS',
    'SELECT_COLOR', 'CHECK_SHIPPING', 'ADD_COMPARE', 'REMOVE_COMPARE', 'ADD_TO_CART'
  ) NOT NULL,
  product_id ENUM('aurora-one', 'nova-pro', 'halo-air') NOT NULL,
  event_source ENUM('USER', 'REPLAY') NOT NULL,
  behavior_dimension ENUM('BROWSE', 'DETAIL', 'COMPARE', 'DECISION', 'CART_INTENT') NOT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (session_id, sequence_no),
  UNIQUE KEY uq_uiadapt_event_identity (session_id, event_id),
  CONSTRAINT fk_uiadapt_events_session
    FOREIGN KEY (session_id) REFERENCES uiadapt_sessions (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS uiadapt_distribution_snapshots (
  session_id CHAR(36) NOT NULL,
  sequence_no BIGINT UNSIGNED NOT NULL,
  event_count BIGINT UNSIGNED NOT NULL,
  window_size TINYINT UNSIGNED NOT NULL,
  browse_count TINYINT UNSIGNED NOT NULL,
  detail_count TINYINT UNSIGNED NOT NULL,
  compare_count TINYINT UNSIGNED NOT NULL,
  decision_count TINYINT UNSIGNED NOT NULL,
  cart_intent_count TINYINT UNSIGNED NOT NULL,
  current_browse DECIMAL(12, 10) NOT NULL,
  current_detail DECIMAL(12, 10) NOT NULL,
  current_compare DECIMAL(12, 10) NOT NULL,
  current_decision DECIMAL(12, 10) NOT NULL,
  current_cart_intent DECIMAL(12, 10) NOT NULL,
  reference_browse DECIMAL(12, 10) NOT NULL,
  reference_detail DECIMAL(12, 10) NOT NULL,
  reference_compare DECIMAL(12, 10) NOT NULL,
  reference_decision DECIMAL(12, 10) NOT NULL,
  reference_cart_intent DECIMAL(12, 10) NOT NULL,
  change_score DECIMAL(12, 10) NOT NULL,
  candidate_state ENUM('EXPLORE', 'COMPARE', 'PURCHASE_INTENT') NOT NULL,
  candidate_persistence TINYINT UNSIGNED NOT NULL,
  detected_state ENUM('EXPLORE', 'COMPARE', 'PURCHASE_INTENT') NOT NULL,
  applied_state ENUM('EXPLORE', 'COMPARE', 'PURCHASE_INTENT') NOT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (session_id, sequence_no),
  CONSTRAINT fk_uiadapt_snapshots_session
    FOREIGN KEY (session_id) REFERENCES uiadapt_sessions (session_id),
  CONSTRAINT chk_uiadapt_snapshot_window CHECK (window_size <= 20),
  CONSTRAINT chk_uiadapt_snapshot_score CHECK (change_score >= 0 AND change_score <= 1),
  CONSTRAINT chk_uiadapt_snapshot_persistence CHECK (candidate_persistence <= 3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS uiadapt_transitions (
  session_id CHAR(36) NOT NULL,
  trigger_sequence_no BIGINT UNSIGNED NOT NULL,
  from_state ENUM('EXPLORE', 'COMPARE', 'PURCHASE_INTENT') NOT NULL,
  to_state ENUM('EXPLORE', 'COMPARE', 'PURCHASE_INTENT') NOT NULL,
  change_score DECIMAL(12, 10) NOT NULL,
  persistence_count TINYINT UNSIGNED NOT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (session_id, trigger_sequence_no),
  CONSTRAINT fk_uiadapt_transitions_snapshot
    FOREIGN KEY (session_id, trigger_sequence_no)
    REFERENCES uiadapt_distribution_snapshots (session_id, sequence_no),
  CONSTRAINT chk_uiadapt_transition_score CHECK (change_score >= 0 AND change_score <= 1),
  CONSTRAINT chk_uiadapt_transition_persistence CHECK (persistence_count BETWEEN 1 AND 3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
