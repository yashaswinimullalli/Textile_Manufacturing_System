-- ==============================================================================
-- FabricTrace PostgreSQL Schema (Hackathon Production-Grade ERP)
-- Textile Quality Inspection, Traceability, Financial Records & Dispatch Gate
-- ==============================================================================

-- Drop existing tables if re-initializing
DROP TABLE IF EXISTS audit_events CASCADE;
DROP TABLE IF EXISTS dispatch_logs CASCADE;
DROP TABLE IF EXISTS defect_pins CASCADE;
DROP TABLE IF EXISTS inspections CASCADE;
DROP TABLE IF EXISTS daily_financial_records CASCADE;
DROP TABLE IF EXISTS fabric_rolls CASCADE;
DROP TABLE IF EXISTS production_orders CASCADE;

-- 1. Production Orders (Buyer Purchase Orders)
CREATE TABLE production_orders (
    id VARCHAR(50) PRIMARY KEY,
    order_code VARCHAR(100) NOT NULL UNIQUE,
    customer_name VARCHAR(150) NOT NULL,
    target_meters NUMERIC(10, 2) NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'DELAYED', 'COMPLETED', 'CANCELLED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Fabric Rolls (Inventory & Production Batches - 50 generated rolls)
CREATE TABLE fabric_rolls (
    id VARCHAR(50) PRIMARY KEY,
    roll_code VARCHAR(100) NOT NULL UNIQUE,
    order_id VARCHAR(50) REFERENCES production_orders(id) ON DELETE SET NULL,
    fabric_type VARCHAR(100) NOT NULL,
    produced_quantity NUMERIC(10, 2) NOT NULL DEFAULT 200.00,
    dispatched_quantity NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    unit VARCHAR(20) NOT NULL DEFAULT 'metres',
    operational_status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (operational_status IN ('PENDING', 'PASSED', 'REWORK', 'REJECTED', 'DISPATCHED')),
    machine_id VARCHAR(50),
    shift VARCHAR(50),
    yarn_batch VARCHAR(100),
    operator_name VARCHAR(100),
    is_inspected BOOLEAN DEFAULT FALSE,
    already_dispatched BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Quality Inspections (Digital Stamp Records)
CREATE TABLE inspections (
    id VARCHAR(50) PRIMARY KEY,
    roll_id VARCHAR(50) NOT NULL REFERENCES fabric_rolls(id) ON DELETE CASCADE,
    roll_code VARCHAR(100) NOT NULL,
    decision VARCHAR(20) NOT NULL CHECK (decision IN ('PASS', 'REWORK', 'REJECT')),
    inspector_id VARCHAR(50) NOT NULL,
    inspector_name VARCHAR(100) NOT NULL,
    affected_quantity NUMERIC(10, 2) DEFAULT 0.00,
    notes TEXT,
    inspected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Defect Pins (Interactive Fabric Map Coordinates)
CREATE TABLE defect_pins (
    id VARCHAR(50) PRIMARY KEY,
    inspection_id VARCHAR(50) REFERENCES inspections(id) ON DELETE CASCADE,
    roll_id VARCHAR(50) NOT NULL REFERENCES fabric_rolls(id) ON DELETE CASCADE,
    x_coord NUMERIC(5, 2) NOT NULL, -- percentage coordinate (0.00 to 100.00)
    y_coord NUMERIC(5, 2) NOT NULL, -- percentage coordinate (0.00 to 100.00)
    defect_type VARCHAR(50) NOT NULL CHECK (defect_type IN ('Hole', 'Color Mismatch', 'Uneven Weave', 'Oil Stain', 'Tear')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Daily Financial Records (All in Indian Rupee - INR)
CREATE TABLE daily_financial_records (
    id VARCHAR(50) PRIMARY KEY,
    date DATE NOT NULL,
    type VARCHAR(30) NOT NULL CHECK (type IN ('BUYER_PAYMENT', 'RAW_MATERIAL', 'WORKER_WAGE', 'DISPATCH_FREIGHT', 'REWORK_COST')),
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL, -- Positive values
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    source_reference VARCHAR(100),
    related_roll_id VARCHAR(50) REFERENCES fabric_rolls(id) ON DELETE SET NULL,
    related_order_id VARCHAR(50) REFERENCES production_orders(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Dispatch Logs (Dock Scanning & Gate Security)
CREATE TABLE dispatch_logs (
    id VARCHAR(50) PRIMARY KEY,
    roll_id VARCHAR(50) NOT NULL REFERENCES fabric_rolls(id) ON DELETE CASCADE,
    roll_code VARCHAR(100) NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL,
    destination VARCHAR(150) NOT NULL,
    tracking_ref VARCHAR(100) NOT NULL UNIQUE,
    actor_name VARCHAR(100) NOT NULL,
    dispatched_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Audit Events (Immutable Ledger)
CREATE TABLE audit_events (
    id VARCHAR(50) PRIMARY KEY,
    actor_name VARCHAR(100) NOT NULL,
    actor_role VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_rolls_roll_code ON fabric_rolls(roll_code);
CREATE INDEX idx_rolls_operational_status ON fabric_rolls(operational_status);
CREATE INDEX idx_financial_date ON daily_financial_records(date);
CREATE INDEX idx_inspections_roll_id ON inspections(roll_id);
