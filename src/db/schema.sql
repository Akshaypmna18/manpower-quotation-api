-- Manpower Quotation Management System — D1 schema

CREATE TABLE IF NOT EXISTS quotations (
  id TEXT PRIMARY KEY,
  quotation_number TEXT NOT NULL UNIQUE,
  quotation_date INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT', 'REJECTED')),
  customer_name TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  is_deleted INTEGER NOT NULL DEFAULT 0,
  deleted_at TEXT,
  deleted_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  created_by TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  status_changed_at TEXT
);

CREATE TABLE IF NOT EXISTS quotation_items (
  id TEXT PRIMARY KEY,
  quotation_id TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity TEXT NOT NULL,
  rate TEXT NOT NULL,
  ot_rate TEXT NOT NULL,
  FOREIGN KEY (quotation_id) REFERENCES quotations (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS approval_steps (
  id TEXT PRIMARY KEY,
  quotation_id TEXT NOT NULL,
  approver_name TEXT NOT NULL,
  approver_id TEXT NOT NULL,
  approver_email TEXT NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('PENDING', 'APPROVED', 'REJECTED')),
  comment TEXT,
  requested_at TEXT,
  approved_at TEXT,
  FOREIGN KEY (quotation_id) REFERENCES quotations (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations (status);
CREATE INDEX IF NOT EXISTS idx_quotations_is_deleted ON quotations (is_deleted);
CREATE INDEX IF NOT EXISTS idx_quotations_quotation_number ON quotations (quotation_number);
CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation_id ON quotation_items (quotation_id);
CREATE INDEX IF NOT EXISTS idx_approval_steps_quotation_id ON approval_steps (quotation_id);
