-- FabricTrace Module: Incoming Raw Material Quality Inspection
-- Tracks visual inspection, specification verification, laboratory testing, and audit trails

ALTER TABLE yarn_batches 
ADD COLUMN IF NOT EXISTS inspection_status VARCHAR(50) NOT NULL DEFAULT 'PENDING_INSPECTION'
  CHECK (inspection_status IN ('PENDING_INSPECTION', 'ON_HOLD', 'PASSED', 'PARTIALLY_ACCEPTED', 'REJECTED')),
ADD COLUMN IF NOT EXISTS quantity_approved NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (quantity_approved >= 0),
ADD COLUMN IF NOT EXISTS quantity_held NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (quantity_held >= 0),
ADD COLUMN IF NOT EXISTS quantity_rejected NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (quantity_rejected >= 0),
ADD COLUMN IF NOT EXISTS yarn_count_spec VARCHAR(100),
ADD COLUMN IF NOT EXISTS po_reference VARCHAR(100),
ADD COLUMN IF NOT EXISTS certificate_reference VARCHAR(150);

CREATE TABLE IF NOT EXISTS quality_inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES yarn_batches(id) ON DELETE CASCADE,
    inspection_number INT NOT NULL DEFAULT 1,
    stage VARCHAR(50) NOT NULL DEFAULT 'INITIAL' CHECK (stage IN ('INITIAL', 'REINSPECTION', 'AUDIT')),
    inspector_name VARCHAR(150) NOT NULL,
    inspection_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Visual observations (manually recorded by human inspector)
    packaging_condition VARCHAR(50) NOT NULL CHECK (packaging_condition IN ('Acceptable', 'Damaged')),
    visible_contamination VARCHAR(50) NOT NULL CHECK (visible_contamination IN ('Not observed', 'Observed')),
    colour_consistency VARCHAR(50) NOT NULL CHECK (colour_consistency IN ('Acceptable', 'Issue found')),
    yarn_appearance VARCHAR(50) NOT NULL CHECK (yarn_appearance IN ('Acceptable', 'Issue found')),
    visual_remarks TEXT,
    defect_description TEXT,
    photo_url TEXT,

    -- Specification & laboratory checks (JSONB array of configured checks)
    spec_checks JSONB NOT NULL DEFAULT '[]',
    supplier_cert_ref VARCHAR(150),

    -- Disposition and quantities
    decision VARCHAR(50) NOT NULL CHECK (decision IN ('PENDING_INSPECTION', 'ON_HOLD', 'PASSED', 'PARTIALLY_ACCEPTED', 'REJECTED')),
    quantity_inspected NUMERIC(12, 2) NOT NULL,
    quantity_approved NUMERIC(12, 2) NOT NULL DEFAULT 0,
    quantity_held NUMERIC(12, 2) NOT NULL DEFAULT 0,
    quantity_rejected NUMERIC(12, 2) NOT NULL DEFAULT 0,
    decision_reason TEXT,
    reinspection_reason TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quality_inspections_batch ON quality_inspections(batch_id);
CREATE INDEX IF NOT EXISTS idx_quality_inspections_date ON quality_inspections(inspection_date);
CREATE INDEX IF NOT EXISTS idx_yarn_batches_qc_status ON yarn_batches(inspection_status);
