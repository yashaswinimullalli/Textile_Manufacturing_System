-- FabricTrace Core Relational Schema
-- Supports Module A (Storekeeper Yarn Inventory with Barcodes) & Module B (Supervisor Orders, Machines, Downtime)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Yarn Inventory Batches
CREATE TABLE IF NOT EXISTS yarn_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_code VARCHAR(100) UNIQUE NOT NULL,
    barcode VARCHAR(100) UNIQUE NOT NULL,
    yarn_type VARCHAR(50) NOT NULL CHECK (yarn_type IN ('Cotton', 'Polyester', 'Blend')),
    colour VARCHAR(100) NOT NULL,
    supplier VARCHAR(150) NOT NULL,
    quantity_received NUMERIC(12, 2) NOT NULL CHECK (quantity_received > 0),
    quantity_available NUMERIC(12, 2) NOT NULL CHECK (quantity_available >= 0),
    unit VARCHAR(20) NOT NULL DEFAULT 'kg',
    reorder_threshold NUMERIC(12, 2) NOT NULL DEFAULT 100 CHECK (reorder_threshold >= 0),
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_yarn_batches_barcode ON yarn_batches(barcode);
CREATE INDEX IF NOT EXISTS idx_yarn_batches_code ON yarn_batches(batch_code);

-- 2. Production Orders
CREATE TABLE IF NOT EXISTS production_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_no VARCHAR(100) UNIQUE NOT NULL,
    customer_reference VARCHAR(150) NOT NULL,
    fabric_type VARCHAR(150) NOT NULL,
    target_quantity NUMERIC(12, 2) NOT NULL CHECK (target_quantity > 0),
    produced_quantity NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (produced_quantity >= 0),
    required_yarn_quantity NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (required_yarn_quantity >= 0),
    due_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Planned' CHECK (status IN ('Planned', 'In Progress', 'On Hold', 'Completed')),
    is_flagged_for_review BOOLEAN NOT NULL DEFAULT FALSE,
    flag_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_production_orders_no ON production_orders(order_no);
CREATE INDEX IF NOT EXISTS idx_production_orders_status ON production_orders(status);

-- 3. Stock Movement Audit Trail
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES yarn_batches(id) ON DELETE CASCADE,
    movement_type VARCHAR(50) NOT NULL CHECK (movement_type IN ('RECEIPT', 'ISSUE', 'CONSUMPTION', 'ADJUSTMENT')),
    quantity NUMERIC(12, 2) NOT NULL CHECK (quantity > 0),
    reference VARCHAR(255),
    order_id UUID REFERENCES production_orders(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_batch ON stock_movements(batch_id);

-- 4. Equipment & Machines
CREATE TABLE IF NOT EXISTS machines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    machine_code VARCHAR(100) UNIQUE NOT NULL,
    process_type VARCHAR(100) NOT NULL DEFAULT 'Weaving',
    current_status VARCHAR(50) NOT NULL DEFAULT 'Idle' CHECK (current_status IN ('Idle', 'Running', 'Stopped', 'Breakdown Reported', 'Maintenance')),
    current_shift VARCHAR(100),
    assigned_operator VARCHAR(150),
    active_order_id UUID REFERENCES production_orders(id) ON DELETE SET NULL,
    last_output_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_machines_code ON machines(machine_code);

-- 5. Machine Assignments
CREATE TABLE IF NOT EXISTS machine_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES production_orders(id) ON DELETE CASCADE,
    shift VARCHAR(100) NOT NULL,
    operator_name VARCHAR(150),
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_time TIMESTAMPTZ
);

-- 6. Production Records (Incremental Output Meters)
CREATE TABLE IF NOT EXISTS production_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES production_orders(id) ON DELETE CASCADE,
    machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    quantity_produced NUMERIC(12, 2) NOT NULL CHECK (quantity_produced > 0),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Machine Events (Event stream with Simulator support)
CREATE TABLE IF NOT EXISTS machine_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    order_id UUID REFERENCES production_orders(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('Running', 'Idle', 'Stopped', 'Breakdown Reported', 'Maintenance', 'Resumed')),
    event_source VARCHAR(50) NOT NULL CHECK (event_source IN ('Operator Report', 'Simulator')),
    reason VARCHAR(255),
    event_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_machine_events_mach_time ON machine_events(machine_id, event_time DESC);
