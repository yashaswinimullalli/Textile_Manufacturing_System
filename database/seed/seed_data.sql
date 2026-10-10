-- FabricTrace Realistic Textile Demo Seed Data

-- Clear existing records for clean development seed
TRUNCATE TABLE machine_events, production_records, machine_assignments, machines, stock_movements, production_orders, yarn_batches CASCADE;

-- 1. Insert Yarn Batches with Barcodes
INSERT INTO yarn_batches (id, batch_code, barcode, yarn_type, colour, supplier, quantity_received, quantity_available, unit, reorder_threshold, received_at)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'YB-COT-2026-001', 'FTB-202610-001', 'Cotton', 'Bleached White', 'Vardhman Textiles Ltd', 2500, 2150, 'kg', 500, NOW() - INTERVAL '10 days'),
  ('22222222-2222-2222-2222-222222222222', 'YB-POLY-2026-014', 'FTB-202610-014', 'Polyester', 'Navy Blue #19', 'Reliance Industries Yarn Div', 1800, 350, 'kg', 400, NOW() - INTERVAL '8 days'),
  ('33333333-3333-3333-3333-333333333333', 'YB-BLD-2026-008', 'FTB-202610-008', 'Blend', 'Charcoal Grey', 'Arvind Mills Yarn Hub', 1200, 1100, 'kg', 300, NOW() - INTERVAL '5 days'),
  ('44444444-4444-4444-4444-444444444444', 'YB-COT-2026-004', 'FTB-202610-004', 'Cotton', 'Teal Green #04', 'Nahars Spinning Mills', 1500, 180, 'kg', 350, NOW() - INTERVAL '3 days');

-- 2. Insert Stock Movements
INSERT INTO stock_movements (batch_id, movement_type, quantity, reference, created_at)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'RECEIPT', 2500, 'Initial delivery GRN-2026-0988', NOW() - INTERVAL '10 days'),
  ('11111111-1111-1111-1111-111111111111', 'ISSUE', 350, 'Issued to Weaving Line 1', NOW() - INTERVAL '9 days'),
  ('22222222-2222-2222-2222-222222222222', 'RECEIPT', 1800, 'Initial delivery GRN-2026-1012', NOW() - INTERVAL '8 days'),
  ('22222222-2222-2222-2222-222222222222', 'ISSUE', 1450, 'Issued to Weaving Line 2', NOW() - INTERVAL '7 days'),
  ('33333333-3333-3333-3333-333333333333', 'RECEIPT', 1200, 'Initial delivery GRN-2026-1045', NOW() - INTERVAL '5 days'),
  ('44444444-4444-4444-4444-444444444444', 'RECEIPT', 1500, 'Initial delivery GRN-2026-1070', NOW() - INTERVAL '3 days');

-- 3. Insert Production Orders
INSERT INTO production_orders (id, order_no, customer_reference, fabric_type, target_quantity, produced_quantity, required_yarn_quantity, due_date, status, created_at)
VALUES 
  ('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'PO-2026-101', 'Zara Global Retail (Summer Twill)', '100% Combed Cotton Twill 180 GSM', 5000, 3600, 2200, CURRENT_DATE + INTERVAL '8 days', 'In Progress', NOW() - INTERVAL '7 days'),
  ('aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'PO-2026-102', 'H&M Knitwear Division', 'Poly-Cotton Single Jersey 160 GSM', 3000, 1200, 1400, CURRENT_DATE + INTERVAL '3 days', 'In Progress', NOW() - INTERVAL '6 days'),
  ('aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'PO-2026-103', 'Marks & Spencer Workwear', 'Poly Oxford Heavy Duty 240 GSM', 4000, 0, 1900, CURRENT_DATE + INTERVAL '15 days', 'Planned', NOW() - INTERVAL '2 days'),
  ('aaaaaaa4-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'PO-2026-098', 'Decathlon Sportswear', 'Micro Polyester Interlock', 2500, 2500, 1100, CURRENT_DATE - INTERVAL '1 day', 'Completed', NOW() - INTERVAL '12 days');

-- 4. Insert Machines
INSERT INTO machines (id, machine_code, process_type, current_status, current_shift, assigned_operator, active_order_id, last_output_time)
VALUES 
  ('bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'M-01 (Picanol Airjet Loom)', 'Weaving', 'Running', 'Morning (06:00 - 14:00)', 'Rajesh Kumar', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW() - INTERVAL '15 minutes'),
  ('bbbbbbb2-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'M-02 (Toyota JAT810 Loom)', 'Weaving', 'Running', 'Morning (06:00 - 14:00)', 'Sunil Verma', 'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW() - INTERVAL '85 minutes'),
  ('bbbbbbb3-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'M-03 (Dornier Rapier Loom)', 'Weaving', 'Stopped', 'Morning (06:00 - 14:00)', 'Amit Singh', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW() - INTERVAL '120 minutes'),
  ('bbbbbbb4-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'M-04 (Mayer & Cie Circular Knit)', 'Knitting', 'Idle', 'General', NULL, NULL, NULL),
  ('bbbbbbb5-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'M-05 (Santoni Seamless Knit)', 'Knitting', 'Maintenance', 'Night', NULL, NULL, NULL);

-- 5. Insert Machine Assignments
INSERT INTO machine_assignments (machine_id, order_id, shift, operator_name, start_time)
VALUES 
  ('bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Morning (06:00 - 14:00)', 'Rajesh Kumar', NOW() - INTERVAL '2 days'),
  ('bbbbbbb2-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Morning (06:00 - 14:00)', 'Sunil Verma', NOW() - INTERVAL '1 day');

-- 6. Insert Production Records
INSERT INTO production_records (order_id, machine_id, quantity_produced, recorded_at)
VALUES 
  ('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 450, NOW() - INTERVAL '15 minutes'),
  ('aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbb2-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 300, NOW() - INTERVAL '85 minutes');

-- 7. Insert Machine Events
INSERT INTO machine_events (machine_id, order_id, event_type, event_source, reason, event_time)
VALUES 
  ('bbbbbbb3-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Stopped', 'Operator Report', 'Warp yarn breakage detected on beam 2', NOW() - INTERVAL '45 minutes'),
  ('bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Running', 'Operator Report', 'Shift handover started smoothly', NOW() - INTERVAL '6 hours');
