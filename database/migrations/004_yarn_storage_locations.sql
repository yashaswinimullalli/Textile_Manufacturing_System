-- FabricTrace Module: Storage Location / Rack Allocation for Yarn Warehouse
-- Adds storage_location column to yarn_batches for visual 2D/isometric rack assignment

ALTER TABLE yarn_batches 
ADD COLUMN IF NOT EXISTS storage_location VARCHAR(50);

-- Update existing batches with assigned racks
UPDATE yarn_batches SET storage_location = 'Rack A1' WHERE batch_code = 'YB-COT-2026-001';
UPDATE yarn_batches SET storage_location = 'Rack B1' WHERE batch_code = 'YB-POLY-2026-014';
UPDATE yarn_batches SET storage_location = 'Rack C1' WHERE batch_code = 'YB-BLD-2026-008';
UPDATE yarn_batches SET storage_location = 'Rack A2' WHERE batch_code = 'YB-COT-2026-004';

CREATE INDEX IF NOT EXISTS idx_yarn_batches_storage_location ON yarn_batches(storage_location);
