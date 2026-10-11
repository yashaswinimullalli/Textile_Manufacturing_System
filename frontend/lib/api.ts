import {
  YarnBatch,
  StockMovement,
  ProductionOrder,
  Machine,
  MachineEvent,
  ProductionRecord,
  MaterialAvailability,
  SupervisorDashboardMetrics,
  MachineStatus,
  MachineEventType,
  MachineTelemetry,
  SimulationScenario,
  MachineSimulationConfig,
  QualityInspection,
  InspectionDisposition,
  SpecCheckItem,
} from './types';
import { apiClient } from './axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Initial realistic fallback data for initial prototyping and offline resilience
let localBatches: YarnBatch[] = [
  {
    id: 'batch-1',
    batch_code: 'YB-COT-2026-001',
    barcode: 'FTB-202610-001',
    yarn_type: 'Cotton',
    colour: 'Bleached White',
    supplier: 'Vardhman Textiles Ltd',
    quantity_received: 2500,
    quantity_available: 2150,
    quantity_approved: 2500,
    quantity_held: 0,
    quantity_rejected: 0,
    inspection_status: 'PASSED',
    yarn_count_spec: '30s Ne Combed Cotton',
    po_reference: 'PO-YARN-2026-081',
    certificate_reference: 'COA-VARDH-8812',
    unit: 'kg',
    reorder_threshold: 500,
    storage_location: 'Rack A1',
    received_at: '2026-10-01T08:30:00Z',
    created_at: '2026-10-01T08:30:00Z',
  },
  {
    id: 'batch-2',
    batch_code: 'YB-POLY-2026-014',
    barcode: 'FTB-202610-014',
    yarn_type: 'Polyester',
    colour: 'Navy Blue #19',
    supplier: 'Reliance Industries Yarn Div',
    quantity_received: 1800,
    quantity_available: 350,
    quantity_approved: 1800,
    quantity_held: 0,
    quantity_rejected: 0,
    inspection_status: 'PASSED',
    yarn_count_spec: '150D / 48F Polyester Filament',
    po_reference: 'PO-YARN-2026-088',
    certificate_reference: 'RIL-COA-NY-0912',
    unit: 'kg',
    reorder_threshold: 400,
    storage_location: 'Rack B1',
    received_at: '2026-10-03T10:15:00Z',
    created_at: '2026-10-03T10:15:00Z',
  },
  {
    id: 'batch-3',
    batch_code: 'YB-BLD-2026-008',
    barcode: 'FTB-202610-008',
    yarn_type: 'Blend',
    colour: 'Charcoal Grey',
    supplier: 'Arvind Mills Yarn Hub',
    quantity_received: 1200,
    quantity_available: 210, // Low stock on hold
    quantity_approved: 210,
    quantity_held: 990,
    quantity_rejected: 0,
    inspection_status: 'ON_HOLD',
    yarn_count_spec: '24s Ne 65/35 Poly-Cotton',
    po_reference: 'PO-YARN-2026-092',
    certificate_reference: 'ARV-BLD-2026-44',
    unit: 'kg',
    reorder_threshold: 300,
    storage_location: 'Rack C1',
    received_at: '2026-10-05T14:00:00Z',
    created_at: '2026-10-05T14:00:00Z',
  },
  {
    id: 'batch-4',
    batch_code: 'YB-COT-2026-004',
    barcode: 'FTB-202610-004',
    yarn_type: 'Cotton',
    colour: 'Teal Green #04',
    supplier: 'Nahars Spinning Mills',
    quantity_received: 1500,
    quantity_available: 180, // Low stock & pending final audit
    quantity_approved: 180,
    quantity_held: 0,
    quantity_rejected: 0,
    inspection_status: 'PENDING_INSPECTION',
    yarn_count_spec: '40s Ne Carded Cotton',
    po_reference: 'PO-YARN-2026-099',
    unit: 'kg',
    reorder_threshold: 350,
    storage_location: 'Rack A2',
    received_at: '2026-10-06T11:45:00Z',
    created_at: '2026-10-06T11:45:00Z',
  },
  {
    id: 'batch-5',
    batch_code: 'YB-POLY-2026-022',
    barcode: 'FTB-202610-022',
    yarn_type: 'Polyester',
    colour: 'Bright White',
    supplier: 'Reliance Industries Yarn Div',
    quantity_received: 2000,
    quantity_available: 1650,
    quantity_approved: 2000,
    quantity_held: 0,
    quantity_rejected: 0,
    inspection_status: 'PASSED',
    yarn_count_spec: '75D / 36F Low Torque Poly',
    po_reference: 'PO-YARN-2026-105',
    unit: 'kg',
    reorder_threshold: 400,
    storage_location: 'Rack B2',
    received_at: '2026-10-07T09:00:00Z',
    created_at: '2026-10-07T09:00:00Z',
  },
  {
    id: 'batch-6',
    batch_code: 'YB-BLD-2026-015',
    barcode: 'FTB-202610-015',
    yarn_type: 'Blend',
    colour: 'Oatmeal Heather',
    supplier: 'Arvind Mills Yarn Hub',
    quantity_received: 1000,
    quantity_available: 850,
    quantity_approved: 1000,
    quantity_held: 0,
    quantity_rejected: 0,
    inspection_status: 'PASSED',
    yarn_count_spec: '30s Ne 50/50 Cotton-Poly',
    po_reference: 'PO-YARN-2026-112',
    unit: 'kg',
    reorder_threshold: 250,
    storage_location: 'Rack C2',
    received_at: '2026-10-08T13:30:00Z',
    created_at: '2026-10-08T13:30:00Z',
  },
  {
    id: 'batch-7',
    batch_code: 'YB-SPEC-2026-031',
    barcode: 'FTB-202610-031',
    yarn_type: 'Blend',
    colour: 'Natural Flax Melange',
    supplier: 'Grasim Industries Ltd',
    quantity_received: 1500,
    quantity_available: 1350,
    quantity_approved: 1500,
    quantity_held: 0,
    quantity_rejected: 0,
    inspection_status: 'PASSED',
    yarn_count_spec: '20s Ne Linen-Cotton Blend',
    po_reference: 'PO-YARN-2026-120',
    unit: 'kg',
    reorder_threshold: 300,
    storage_location: 'Rack D1',
    received_at: '2026-10-09T08:00:00Z',
    created_at: '2026-10-09T08:00:00Z',
  },
  {
    id: 'batch-8',
    batch_code: 'YB-RAW-2026-045',
    barcode: 'FTB-202610-045',
    yarn_type: 'Cotton',
    colour: 'Raw Greige Cotton',
    supplier: 'Nahar Industrial Hub',
    quantity_received: 1200,
    quantity_available: 160, // Low stock & pending audit (below 400 kg threshold)
    quantity_approved: 160,
    quantity_held: 0,
    quantity_rejected: 0,
    inspection_status: 'PENDING_INSPECTION',
    yarn_count_spec: '16s Ne Open End Cotton',
    po_reference: 'PO-YARN-2026-135',
    unit: 'kg',
    reorder_threshold: 400,
    storage_location: 'Rack D2',
    received_at: '2026-10-09T14:20:00Z',
    created_at: '2026-10-09T14:20:00Z',
  },
];

let localInspections: QualityInspection[] = [
  {
    id: 'insp-1',
    batch_id: 'batch-1',
    batch_code: 'YB-COT-2026-001',
    barcode: 'FTB-202610-001',
    supplier: 'Vardhman Textiles Ltd',
    yarn_type: 'Cotton',
    colour: 'Bleached White',
    inspection_number: 1,
    stage: 'INITIAL',
    inspector_name: 'Priya Sharma (Lead QC)',
    inspection_date: '2026-10-01T09:30:00Z',
    packaging_condition: 'Acceptable',
    visible_contamination: 'Not observed',
    colour_consistency: 'Acceptable',
    yarn_appearance: 'Acceptable',
    visual_remarks: 'Clean carton packaging, poly-wrapped cones, zero moisture ingress.',
    defect_description: '',
    spec_checks: [
      { id: 'sc-1', test_name: 'Yarn Count / Linear Density', expected_spec: '30s Ne ± 1.5%', actual_value: '30.2s Ne', unit: 'Ne', result: 'Pass', is_mandatory: true },
      { id: 'sc-2', test_name: 'Single Yarn Tensile Strength', expected_spec: '> 280 cN', actual_value: '298 cN', unit: 'cN', result: 'Pass', is_mandatory: true },
      { id: 'sc-3', test_name: 'Yarn Evenness (CVm %)', expected_spec: '< 13.5%', actual_value: '11.8%', unit: 'CVm %', result: 'Pass', is_mandatory: true },
      { id: 'sc-4', test_name: 'Twist per Inch (TPI)', expected_spec: '21.5 ± 1.0', actual_value: '21.8', unit: 'TPI', result: 'Pass', is_mandatory: false },
    ],
    supplier_cert_ref: 'COA-VARDH-2026-8812',
    decision: 'PASSED',
    quantity_inspected: 2500,
    quantity_approved: 2500,
    quantity_held: 0,
    quantity_rejected: 0,
    decision_reason: 'All visual and physical laboratory parameters within acceptable ASTM D2256 / ISO 2060 tolerances.',
    created_at: '2026-10-01T09:30:00Z',
  },
  {
    id: 'insp-2',
    batch_id: 'batch-2',
    batch_code: 'YB-POLY-2026-014',
    barcode: 'FTB-202610-014',
    supplier: 'Reliance Industries Yarn Div',
    yarn_type: 'Polyester',
    colour: 'Navy Blue #19',
    inspection_number: 1,
    stage: 'INITIAL',
    inspector_name: 'Anand Patel (QC Inspector)',
    inspection_date: '2026-10-03T11:00:00Z',
    packaging_condition: 'Acceptable',
    visible_contamination: 'Not observed',
    colour_consistency: 'Acceptable',
    yarn_appearance: 'Acceptable',
    visual_remarks: 'Doff packaging intact, lot stickers match invoice.',
    defect_description: '',
    spec_checks: [
      { id: 'sc-1', test_name: 'Denier / Filament Count', expected_spec: '150D / 48F', actual_value: '149.6D / 48F', unit: 'Denier', result: 'Pass', is_mandatory: true },
      { id: 'sc-2', test_name: 'Tenacity (g/den)', expected_spec: '> 4.2 g/d', actual_value: '4.6 g/d', unit: 'g/d', result: 'Pass', is_mandatory: true },
      { id: 'sc-3', test_name: 'Elongation at Break %', expected_spec: '18 - 24%', actual_value: '21.2%', unit: '%', result: 'Pass', is_mandatory: true },
    ],
    supplier_cert_ref: 'RIL-COA-NY-0912',
    decision: 'PASSED',
    quantity_inspected: 1800,
    quantity_approved: 1800,
    quantity_held: 0,
    quantity_rejected: 0,
    decision_reason: 'Full conformance to polyester filament specification.',
    created_at: '2026-10-03T11:00:00Z',
  },
  {
    id: 'insp-3',
    batch_id: 'batch-3',
    batch_code: 'YB-BLD-2026-008',
    barcode: 'FTB-202610-008',
    supplier: 'Arvind Mills Yarn Hub',
    yarn_type: 'Blend',
    colour: 'Charcoal Grey',
    inspection_number: 1,
    stage: 'INITIAL',
    inspector_name: 'Priya Sharma (Lead QC)',
    inspection_date: '2026-10-05T15:00:00Z',
    packaging_condition: 'Acceptable',
    visible_contamination: 'Not observed',
    colour_consistency: 'Issue found',
    yarn_appearance: 'Acceptable',
    visual_remarks: 'Slight shade variation observed across cone layers in pallet 3.',
    defect_description: 'Delta-E shade variance of 1.4 between top and bottom cones of pallet 3.',
    spec_checks: [
      { id: 'sc-1', test_name: 'Yarn Count', expected_spec: '24s Ne Blend', actual_value: '23.8s Ne', unit: 'Ne', result: 'Pass', is_mandatory: true },
      { id: 'sc-2', test_name: 'Blend Composition Ratio', expected_spec: '65/35 Poly-Cotton ± 2%', actual_value: '64.8/35.2', unit: '%', result: 'Pass', is_mandatory: true },
      { id: 'sc-3', test_name: 'Spectrophotometer Delta-E', expected_spec: 'Delta-E < 0.8', actual_value: '1.4', unit: 'dE', result: 'Fail', is_mandatory: true, remarks: 'Shade deviation requires dye house review' },
    ],
    supplier_cert_ref: 'ARV-BLD-2026-44',
    decision: 'ON_HOLD',
    quantity_inspected: 1200,
    quantity_approved: 0,
    quantity_held: 1200,
    quantity_rejected: 0,
    decision_reason: 'Placed on hold for shade lab confirmation and customer approval before dye lot issue.',
    created_at: '2026-10-05T15:00:00Z',
  },
];

let localMovements: StockMovement[] = [
  {
    id: 'mov-1',
    batch_id: 'batch-1',
    batch_code: 'YB-COT-2026-001',
    movement_type: 'RECEIPT',
    quantity: 2500,
    reference: 'GRN-2026-0988 (Supplier Invoice #8841)',
    created_at: '2026-10-01T08:30:00Z',
  },
  {
    id: 'mov-2',
    batch_id: 'batch-1',
    batch_code: 'YB-COT-2026-001',
    movement_type: 'CONSUMPTION',
    quantity: 350,
    reference: 'Issued to Weaving Line L-01 for Order PO-2026-101',
    created_at: '2026-10-02T09:15:00Z',
  },
  {
    id: 'mov-3',
    batch_id: 'batch-2',
    batch_code: 'YB-POLY-2026-014',
    movement_type: 'RECEIPT',
    quantity: 1800,
    reference: 'GRN-2026-1012 (Supplier Delivery #902)',
    created_at: '2026-10-03T10:15:00Z',
  },
  {
    id: 'mov-4',
    batch_id: 'batch-2',
    batch_code: 'YB-POLY-2026-014',
    movement_type: 'CONSUMPTION',
    quantity: 1450,
    reference: 'Issued to Loom L-03 for Order PO-2026-102',
    created_at: '2026-10-04T12:00:00Z',
  },
];

let localOrders: ProductionOrder[] = [];

let localMachines: Machine[] = [
  {
    id: 'mach-1',
    machine_code: 'M-01 (Picanol Airjet Loom)',
    process_type: 'Weaving',
    current_status: 'Running',
    current_shift: 'Morning (06:00 - 14:00)',
    assigned_operator: 'Rajesh Kumar',
    active_order_id: 'ord-1',
    active_order_no: 'PO-2026-101',
    last_output_time: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    created_at: '2026-01-15T00:00:00Z',
  },
  {
    id: 'mach-2',
    machine_code: 'M-02 (Toyota JAT810 Loom)',
    process_type: 'Weaving',
    current_status: 'Running',
    current_shift: 'Morning (06:00 - 14:00)',
    assigned_operator: 'Sunil Verma',
    active_order_id: 'ord-2',
    active_order_no: 'PO-2026-102',
    last_output_time: new Date(Date.now() - 85 * 60 * 1000).toISOString(), // > 60m ago -> Possible stoppage warning
    created_at: '2026-01-15T00:00:00Z',
  },
  {
    id: 'mach-3',
    machine_code: 'M-03 (Dornier Rapier Loom)',
    process_type: 'Weaving',
    current_status: 'Stopped',
    current_shift: 'Morning (06:00 - 14:00)',
    assigned_operator: 'Amit Singh',
    active_order_id: 'ord-1',
    active_order_no: 'PO-2026-101',
    last_output_time: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    created_at: '2026-01-15T00:00:00Z',
  },
  {
    id: 'mach-4',
    machine_code: 'M-04 (Mayer & Cie Circular Knit)',
    process_type: 'Knitting',
    current_status: 'Idle',
    current_shift: 'General',
    created_at: '2026-01-15T00:00:00Z',
  },
  {
    id: 'mach-5',
    machine_code: 'M-05 (Santoni Seamless Knit)',
    process_type: 'Knitting',
    current_status: 'Maintenance',
    current_shift: 'Night',
    created_at: '2026-01-15T00:00:00Z',
  },
];

let localEvents: MachineEvent[] = [
  {
    id: 'evt-1',
    machine_id: 'mach-3',
    machine_code: 'M-03 (Dornier Rapier Loom)',
    order_id: 'ord-1',
    order_no: 'PO-2026-101',
    event_type: 'Stopped',
    event_source: 'Operator Report',
    reason: 'Warp yarn breakage detected on beam 2',
    event_time: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
  {
    id: 'evt-2',
    machine_id: 'mach-1',
    machine_code: 'M-01 (Picanol Airjet Loom)',
    order_id: 'ord-1',
    order_no: 'PO-2026-101',
    event_type: 'Running',
    event_source: 'Operator Report',
    reason: 'Shift handover started smoothly',
    event_time: new Date(Date.now() - 360 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 360 * 60 * 1000).toISOString(),
  },
];

let localRecords: ProductionRecord[] = [];


// Helper to fetch from backend via Axios or fall back gracefully
async function fetchWithFallback<T>(endpoint: string, options?: RequestInit, fallbackData?: () => T): Promise<T> {
  try {
    const method = (options?.method || 'GET').toUpperCase();
    let res;
    if (method === 'POST') {
      const data = options?.body ? JSON.parse(options.body as string) : undefined;
      res = await apiClient.post(endpoint, data);
    } else if (method === 'PATCH') {
      const data = options?.body ? JSON.parse(options.body as string) : undefined;
      res = await apiClient.patch(endpoint, data);
    } else if (method === 'DELETE') {
      res = await apiClient.delete(endpoint);
    } else {
      res = await apiClient.get(endpoint);
    }

    if (res && res.data) {
      return res.data.data !== undefined ? res.data.data : res.data;
    }
  } catch (err: any) {
    console.warn(`[Axios API Client] Request to ${endpoint} returned error, falling back:`, err?.message);
  }

  if (fallbackData) {
    return fallbackData();
  }
  throw new Error(`Failed to fetch ${endpoint} via Axios and no fallback available.`);
}


export const api = {
  // STOREKEEPER: YARN INVENTORY
  async getYarnBatches(filters?: { yarn_type?: string; colour?: string; low_stock?: boolean; search?: string; intake_scanned?: boolean }): Promise<YarnBatch[]> {
    const query = new URLSearchParams();
    if (filters?.yarn_type) query.set('yarn_type', filters.yarn_type);
    if (filters?.colour) query.set('colour', filters.colour);
    if (filters?.low_stock) query.set('low_stock', 'true');
    if (filters?.search) query.set('search', filters.search);
    if (filters?.intake_scanned !== undefined) query.set('intake_scanned', String(filters.intake_scanned));
    const endpoint = `/yarn-batches${query.toString() ? `?${query.toString()}` : ''}`;

    return fetchWithFallback(endpoint, undefined, () => {
      let filtered = [...localBatches];
      if (filters?.intake_scanned !== undefined) {
        filtered = filtered.filter(b => Boolean(b.intake_scanned) === filters.intake_scanned);
      }
      if (filters?.yarn_type && filters.yarn_type !== 'ALL') {
        filtered = filtered.filter(b => b.yarn_type.toLowerCase() === filters.yarn_type?.toLowerCase());
      }
      if (filters?.low_stock) {
        filtered = filtered.filter(b => b.quantity_available <= b.reorder_threshold);
      }
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        filtered = filtered.filter(b => 
          b.batch_code.toLowerCase().includes(q) ||
          b.supplier.toLowerCase().includes(q) ||
          b.colour.toLowerCase().includes(q)
        );
      }
      return filtered;
    });
  },

  async markBatchScanned(idOrBarcode: string): Promise<YarnBatch> {
    return fetchWithFallback(`/yarn-batches/${encodeURIComponent(idOrBarcode.trim())}/intake-scan`, {
      method: 'POST',
    }, () => {
      const b = localBatches.find(x => x.id === idOrBarcode || x.barcode === idOrBarcode || x.batch_code === idOrBarcode);
      if (b) {
        b.intake_scanned = true;
        return b;
      }
      throw new Error(`Batch ${idOrBarcode} not found`);
    });
  },

  async unmarkBatchScanned(idOrBarcode: string): Promise<YarnBatch> {
    return fetchWithFallback(`/yarn-batches/${encodeURIComponent(idOrBarcode.trim())}/intake-scan`, {
      method: 'DELETE',
    }, () => {
      const b = localBatches.find(x => x.id === idOrBarcode || x.barcode === idOrBarcode || x.batch_code === idOrBarcode);
      if (b) {
        b.intake_scanned = false;
        return b;
      }
      throw new Error(`Batch ${idOrBarcode} not found`);
    });
  },

  async quickAddYarnBatch(): Promise<YarnBatch> {
    return fetchWithFallback('/yarn-batches/quick-add', {
      method: 'POST',
    }, () => {
      const uniqueSuffix = Math.floor(10 + Math.random() * 90);
      const newBatch: YarnBatch = {
        id: `batch-${Date.now()}`,
        batch_code: `VAS-DEMO-Y${uniqueSuffix}`,
        barcode: `VAS-QR-Y${uniqueSuffix}`,
        yarn_type: 'Cotton',
        colour: 'Egyptian White',
        supplier: 'Al-Amal Cotton Mills',
        quantity_received: 500,
        quantity_available: 500,
        unit: 'kg',
        reorder_threshold: 100,
        inspection_status: 'PENDING_INSPECTION',
        intake_scanned: false,
        received_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
      localBatches.push(newBatch);
      return newBatch;
    });
  },

  async receiveYarnBatch(payload: {
    batch_code: string;
    barcode?: string;
    yarn_type: 'Cotton' | 'Polyester' | 'Blend';
    colour: string;
    supplier: string;
    quantity_received: number;
    unit: string;
    reorder_threshold: number;
    received_at?: string;
    yarn_count_spec?: string;
    po_reference?: string;
    certificate_reference?: string;
    storage_location?: string;
  }): Promise<{ batch: YarnBatch; movement: StockMovement }> {
    return fetchWithFallback(
      '/yarn-batches',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      () => {
        // Enforce uniqueness
        const existing = localBatches.find(b => b.batch_code.toLowerCase() === payload.batch_code.toLowerCase());
        if (existing) {
          throw new Error(`Batch ID "${payload.batch_code}" already exists in the system.`);
        }
        if (payload.quantity_received <= 0) {
          throw new Error('Quantity received must be a positive number.');
        }

        const newBatch: YarnBatch = {
          id: `batch-${Date.now()}`,
          batch_code: payload.batch_code.trim(),
          yarn_type: payload.yarn_type,
          colour: payload.colour.trim(),
          supplier: payload.supplier.trim(),
          quantity_received: payload.quantity_received,
          quantity_available: 0, // Uninspected yarn cannot be issued until passed!
          quantity_approved: 0,
          quantity_held: 0,
          quantity_rejected: 0,
          inspection_status: 'PENDING_INSPECTION',
          yarn_count_spec: payload.yarn_count_spec,
          po_reference: payload.po_reference,
          certificate_reference: payload.certificate_reference,
          unit: payload.unit || 'kg',
          barcode: payload.barcode || `FTB-${Date.now().toString().slice(-6)}`,
          reorder_threshold: payload.reorder_threshold || 100,
          storage_location: payload.storage_location || 'Rack A1',
          received_at: payload.received_at || new Date().toISOString(),
          created_at: new Date().toISOString(),
        };

        const newMovement: StockMovement = {
          id: `mov-${Date.now()}`,
          batch_id: newBatch.id,
          batch_code: newBatch.batch_code,
          movement_type: 'RECEIPT',
          quantity: newBatch.quantity_received,
          reference: `Initial batch delivery from ${newBatch.supplier} (Pending Quality Inspection)`,
          created_at: newBatch.created_at,
        };

        localBatches.unshift(newBatch);
        localMovements.unshift(newMovement);
        return { batch: newBatch, movement: newMovement };
      }
    );
  },

  // BARCODE LOOKUP
  async getBatchByBarcode(barcode: string): Promise<YarnBatch> {
    const clean = barcode.trim();
    return fetchWithFallback(`/yarn-batches/barcode/${encodeURIComponent(clean)}`, undefined, () => {
      const match = localBatches.find(
        (b) => b.barcode.toLowerCase() === clean.toLowerCase() || b.batch_code.toLowerCase() === clean.toLowerCase()
      );
      if (!match) {
        throw new Error(`No yarn batch found for barcode "${clean}". Please verify the label or register a new batch.`);
      }
      return { ...match };
    });
  },

  // RECORD STOCK TRANSACTION (RECEIPT OR ISSUE WITH CONCURRENCY & QUALITY VALIDATION)
  async recordStockTransaction(payload: {
    batch_id: string;
    movement_type: 'RECEIPT' | 'ISSUE';
    quantity: number;
    reference?: string;
    order_id?: string;
  }): Promise<{ batch: YarnBatch; movement: StockMovement }> {
    return fetchWithFallback(
      '/stock-movements',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      () => {
        if (!payload.quantity || payload.quantity <= 0) {
          throw new Error('Transaction quantity must be a positive number greater than 0.');
        }

        const batch = localBatches.find((b) => b.id === payload.batch_id);
        if (!batch) {
          throw new Error(`Batch ID ${payload.batch_id} not found.`);
        }

        const order = payload.order_id ? localOrders.find((o) => o.id === payload.order_id) : undefined;

        if (payload.movement_type === 'ISSUE') {
          // Quality Inspection Clearance Check
          const qc = batch.inspection_status || 'PENDING_INSPECTION';
          if (qc === 'PENDING_INSPECTION') {
            throw new Error(`Quality Restriction: Batch ${batch.batch_code} is PENDING_INSPECTION. Yarn must be inspected and approved before it can be issued to production.`);
          }
          if (qc === 'ON_HOLD') {
            throw new Error(`Quality Quarantine: Batch ${batch.batch_code} is currently ON_HOLD pending quality review or laboratory confirmation.`);
          }
          if (qc === 'REJECTED') {
            throw new Error(`Quality Rejection: Batch ${batch.batch_code} was REJECTED during incoming inspection and cannot be issued to production.`);
          }

          // Concurrency / balance check: prevent negative inventory
          if (payload.quantity > batch.quantity_available) {
            throw new Error(
              `Insufficient approved stock: Cannot issue ${payload.quantity} kg. Only ${batch.quantity_available} kg approved and available for batch ${batch.batch_code}.`
            );
          }
          batch.quantity_available -= payload.quantity;
        } else if (payload.movement_type === 'RECEIPT') {
          batch.quantity_available += payload.quantity;
        } else {
          throw new Error(`Invalid movement type "${payload.movement_type}". Must be RECEIPT or ISSUE.`);
        }

        const movement: StockMovement = {
          id: `mov-${Date.now()}`,
          batch_id: batch.id,
          batch_code: batch.batch_code,
          movement_type: payload.movement_type,
          quantity: payload.quantity,
          reference: payload.reference || (payload.movement_type === 'ISSUE'
            ? `Issued to Order ${order?.order_no || 'Production Line'}`
            : `Additional receipt for batch ${batch.batch_code}`),
          order_id: payload.order_id,
          order_no: order?.order_no,
          created_at: new Date().toISOString(),
        };

        localMovements.unshift(movement);
        return { batch: { ...batch }, movement };
      }
    );
  },

  // REGISTER NEW BATCH WITH GENERATED CODE 128 BARCODE
  async registerBatchWithBarcode(payload: {
    yarn_type: 'Cotton' | 'Polyester' | 'Blend';
    colour: string;
    supplier: string;
    supplier_lot?: string;
    quantity_received: number;
    unit: string;
    reorder_threshold: number;
  }): Promise<{ batch: YarnBatch; movement: StockMovement }> {
    const uniqueSuffix = Math.floor(1000 + Math.random() * 9000);
    const dateCode = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const generatedBarcode = `FTB-${dateCode}-${uniqueSuffix}`;
    const generatedBatchCode = payload.supplier_lot?.trim() || `YB-${payload.yarn_type.slice(0, 3).toUpperCase()}-${dateCode}-${uniqueSuffix}`;

    return this.receiveYarnBatch({
      batch_code: generatedBatchCode,
      barcode: generatedBarcode,
      yarn_type: payload.yarn_type,
      colour: payload.colour,
      supplier: payload.supplier,
      quantity_received: payload.quantity_received,
      unit: payload.unit || 'kg',
      reorder_threshold: payload.reorder_threshold || 100,
    });
  },

  async getStockMovements(batchId?: string): Promise<StockMovement[]> {
    return fetchWithFallback(
      batchId ? `/stock-movements?batch_id=${batchId}` : '/stock-movements',
      undefined,
      () => {
        if (batchId) {
          return localMovements.filter(m => m.batch_id === batchId);
        }
        return [...localMovements];
      }
    );
  },

  async getLowStockBatches(): Promise<YarnBatch[]> {
    return fetchWithFallback('/inventory/low-stock', undefined, () => {
      return localBatches.filter(b => b.quantity_available <= b.reorder_threshold);
    });
  },

  async checkMaterialAvailability(orderId: string): Promise<MaterialAvailability> {
    return fetchWithFallback(`/orders/${orderId}/material-availability`, undefined, () => {
      const order = localOrders.find(o => o.id === orderId);
      if (!order) {
        throw new Error(`Order ${orderId} not found`);
      }

      // Check total available yarn across all batches or matching type
      const isCotton = order.fabric_type.toLowerCase().includes('cotton');
      const isPoly = order.fabric_type.toLowerCase().includes('poly');

      const matchingBatches = localBatches.filter(b => {
        if (isCotton && b.yarn_type === 'Cotton') return true;
        if (isPoly && b.yarn_type === 'Polyester') return true;
        return true; // Blend or fallback
      });

      const totalAvailable = matchingBatches.reduce((acc, b) => acc + b.quantity_available, 0);
      const shortage = Math.max(0, order.required_yarn_quantity - totalAvailable);

      return {
        order_id: order.id,
        order_no: order.order_no,
        fabric_type: order.fabric_type,
        required_quantity: order.required_yarn_quantity,
        available_quantity: totalAvailable,
        shortage_quantity: shortage,
        is_sufficient: shortage === 0,
        unit: 'kg',
        recommended_batches: matchingBatches.map(b => ({
          batch_code: b.batch_code,
          yarn_type: b.yarn_type,
          colour: b.colour,
          quantity_available: b.quantity_available,
        })),
      };
    });
  },

  // PRODUCTION SUPERVISOR: ORDERS
  async getOrders(): Promise<ProductionOrder[]> {
    return fetchWithFallback('/orders', undefined, () => [...localOrders]);
  },

  async createOrder(payload: {
    order_no: string;
    customer_reference: string;
    fabric_type: string;
    target_quantity: number;
    required_yarn_quantity: number;
    due_date: string;
    status?: 'Planned' | 'In Progress' | 'On Hold' | 'Completed';
  }): Promise<ProductionOrder> {
    return fetchWithFallback(
      '/orders',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      () => {
        const existing = localOrders.find(o => o.order_no.toLowerCase() === payload.order_no.toLowerCase());
        if (existing) {
          throw new Error(`Order number "${payload.order_no}" already exists.`);
        }
        if (payload.target_quantity <= 0) {
          throw new Error('Target quantity must be greater than zero.');
        }

        const newOrder: ProductionOrder = {
          id: `ord-${Date.now()}`,
          order_no: payload.order_no.trim(),
          customer_reference: payload.customer_reference.trim(),
          fabric_type: payload.fabric_type.trim(),
          target_quantity: payload.target_quantity,
          produced_quantity: 0,
          required_yarn_quantity: payload.required_yarn_quantity || 0,
          due_date: payload.due_date,
          status: payload.status || 'Planned',
          created_at: new Date().toISOString(),
        };

        localOrders.unshift(newOrder);
        return newOrder;
      }
    );
  },

  async bulkCreateOrders(payload: {
    orders: Array<{
      order_no: string;
      customer_reference: string;
      fabric_type: string;
      target_quantity: number;
      required_yarn_quantity?: number;
      due_date: string;
      status?: string;
    }>;
    replaceDemo?: boolean;
  }): Promise<{ success: boolean; count: number; message: string }> {
    return fetchWithFallback(
      '/orders/bulk',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      () => {
        if (payload.replaceDemo) {
          localOrders = localOrders.filter(
            (o) => !o.order_no.toLowerCase().startsWith('vas-demo-po0')
          );
        }
        for (const o of payload.orders) {
          const newOrder: ProductionOrder = {
            id: `ord-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            order_no: o.order_no,
            customer_reference: o.customer_reference,
            fabric_type: o.fabric_type,
            target_quantity: o.target_quantity,
            produced_quantity: 0,
            required_yarn_quantity: o.required_yarn_quantity || Math.round(o.target_quantity * 0.6),
            due_date: o.due_date,
            status: 'Planned',
            created_at: new Date().toISOString(),
          };
          localOrders.unshift(newOrder);
        }
        return {
          success: true,
          count: payload.orders.length,
          message: `Successfully imported ${payload.orders.length} orders.`,
        };
      }
    );
  },

  async deleteDemoOrders(): Promise<{ success: boolean; count: number }> {
    return fetchWithFallback(
      '/orders/demo',
      {
        method: 'DELETE',
      },
      () => {
        const initialCount = localOrders.length;
        localOrders = localOrders.filter(
          (o) => !o.order_no.toLowerCase().startsWith('vas-demo-po0')
        );
        return {
          success: true,
          count: initialCount - localOrders.length,
        };
      }
    );
  },

  async deleteAllOrders(): Promise<{ success: boolean; count: number; message: string }> {
    return fetchWithFallback(
      '/orders/all',
      {
        method: 'DELETE',
      },
      () => {
        const initialCount = localOrders.length;
        localOrders = [];
        return {
          success: true,
          count: initialCount,
          message: `Cleaned up ${initialCount} orders.`,
        };
      }
    );
  },

  async updateOrderStatus(orderId: string, status: 'Planned' | 'In Progress' | 'On Hold' | 'Completed'): Promise<ProductionOrder> {
    return fetchWithFallback(
      `/orders/${orderId}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      },
      () => {
        const ord = localOrders.find(o => o.id === orderId);
        if (!ord) throw new Error('Order not found');
        ord.status = status;
        ord.updated_at = new Date().toISOString();
        return { ...ord };
      }
    );
  },

  async clearOrderFlag(orderId: string): Promise<ProductionOrder> {
    return fetchWithFallback(
      `/orders/${orderId}/clear-flag`,
      {
        method: 'PATCH',
      },
      () => {
        const ord = localOrders.find(o => o.id === orderId);
        if (!ord) throw new Error('Order not found');
        ord.is_flagged_for_review = false;
        ord.flag_reason = undefined;
        ord.updated_at = new Date().toISOString();
        return { ...ord };
      }
    );
  },

  // PRODUCTION SUPERVISOR: MACHINES & PRODUCTION OUTPUT
  async getMachines(): Promise<Machine[]> {
    return fetchWithFallback('/machines', undefined, () => [...localMachines]);
  },

  async createMachine(payload: { machine_code: string; process_type: string }): Promise<Machine> {
    return fetchWithFallback(
      '/machines',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      () => {
        const existing = localMachines.find(m => m.machine_code.toLowerCase() === payload.machine_code.toLowerCase());
        if (existing) throw new Error(`Machine code ${payload.machine_code} already exists.`);
        const newM: Machine = {
          id: `mach-${Date.now()}`,
          machine_code: payload.machine_code,
          process_type: payload.process_type,
          current_status: 'Idle',
          created_at: new Date().toISOString(),
        };
        localMachines.push(newM);
        return newM;
      }
    );
  },

  async assignMachine(machineId: string, payload: { order_id: string; shift: string; operator_name?: string }): Promise<Machine> {
    return fetchWithFallback(
      `/machines/${machineId}/assignments`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      () => {
        const mach = localMachines.find(m => m.id === machineId);
        if (!mach) throw new Error('Machine not found');
        const ord = localOrders.find(o => o.id === payload.order_id);

        mach.active_order_id = payload.order_id;
        mach.active_order_no = ord?.order_no;
        mach.current_shift = payload.shift;
        mach.assigned_operator = payload.operator_name || 'Floor Operator';
        mach.current_status = 'Running';
        mach.updated_at = new Date().toISOString();
        return { ...mach };
      }
    );
  },

  async assignBatchMachines(payload: { machine_ids: string[]; order_ids?: string[] }): Promise<{ success: boolean; count: number; message: string }> {
    return fetchWithFallback(
      '/machines/assign-batch',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      () => {
        let count = 0;
        for (const mId of payload.machine_ids) {
          const mach = localMachines.find(m => m.id === mId || m.machine_code.toLowerCase().includes(mId.toLowerCase()));
          if (!mach) continue;
          const unassignedOrder = localOrders.find(o => !localMachines.some(m => m.active_order_id === o.id));
          if (unassignedOrder) {
            mach.active_order_id = unassignedOrder.id;
            mach.active_order_no = unassignedOrder.order_no;
            mach.current_status = 'Running';
            unassignedOrder.status = 'In Progress';
            count++;
          }
        }
        return { success: true, count, message: `Assigned ${count} machines.` };
      }
    );
  },

  async recordProductionOutput(orderId: string, payload: { machine_id: string; quantity_produced: number }): Promise<ProductionRecord> {
    return fetchWithFallback(
      `/orders/${orderId}/production-records`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      () => {
        if (payload.quantity_produced <= 0) {
          throw new Error('Produced quantity must be positive.');
        }
        const ord = localOrders.find(o => o.id === orderId);
        if (!ord) throw new Error('Order not found');
        const mach = localMachines.find(m => m.id === payload.machine_id);

        ord.produced_quantity += payload.quantity_produced;
        if (ord.produced_quantity >= ord.target_quantity && ord.status === 'In Progress') {
          ord.status = 'Completed';
        }

        const now = new Date().toISOString();
        if (mach) {
          mach.last_output_time = now;
          // Logging output proves the machine is actively producing fabric
          mach.current_status = 'Running';
        }

        const rec: ProductionRecord = {
          id: `rec-${Date.now()}`,
          order_id: orderId,
          order_no: ord?.order_no,
          machine_id: payload.machine_id,
          machine_code: mach?.machine_code || 'Loom',
          operator_name: mach?.assigned_operator || 'Floor Operator',
          quantity_produced: payload.quantity_produced,
          recorded_at: now,
        };


        localRecords.unshift(rec);
        return rec;
      }
    );
  },

  async getProductionRecords(machineId?: string): Promise<ProductionRecord[]> {
    return fetchWithFallback(
      machineId ? `/orders/production-records?machine_id=${machineId}` : '/orders/production-records',
      undefined,
      () => {
        if (machineId) {
          return localRecords.filter(r => r.machine_id === machineId);
        }
        return [...localRecords];
      }
    );
  },

  // MACHINE EVENTS & SIMULATOR
  async getMachineEvents(machineId?: string): Promise<MachineEvent[]> {
    return fetchWithFallback(
      machineId ? `/machine-events?machine_id=${machineId}` : '/machine-events',
      undefined,
      () => {
        if (machineId) return localEvents.filter(e => e.machine_id === machineId);
        return [...localEvents];
      }
    );
  },

  async recordMachineEvent(machineId: string, payload: {
    event_type: MachineEventType;
    order_id?: string;
    reason?: string;
    is_simulated?: boolean;
  }): Promise<{ event: MachineEvent; machine: Machine }> {
    const endpoint = payload.is_simulated ? `/machines/${machineId}/simulate-event` : `/machines/${machineId}/events`;
    return fetchWithFallback(
      endpoint,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      () => {
        const mach = localMachines.find(m => m.id === machineId);
        if (!mach) throw new Error('Machine not found');
        const ord = payload.order_id ? localOrders.find(o => o.id === payload.order_id) : undefined;

        // Map event_type to machine status
        if (payload.event_type === 'Resumed') {
          mach.current_status = 'Running';
        } else {
          mach.current_status = payload.event_type as MachineStatus;
        }

        const evt: MachineEvent = {
          id: `evt-${Date.now()}`,
          machine_id: machineId,
          machine_code: mach.machine_code,
          order_id: payload.order_id || mach.active_order_id,
          order_no: ord?.order_no || mach.active_order_no,
          event_type: payload.event_type,
          event_source: payload.is_simulated ? 'Simulator' : 'Operator Report',
          reason: payload.reason || (payload.is_simulated ? 'Hackathon Demo Simulator Event' : 'Floor operator update'),
          event_time: new Date().toISOString(),
          created_at: new Date().toISOString(),
        };

        // Flag affected order for review if downtime / stoppage event occurred
        const targetOrderId = payload.order_id || mach.active_order_id;
        if (targetOrderId && ['Stopped', 'Breakdown Reported', 'Maintenance'].includes(payload.event_type)) {
          const targetOrd = localOrders.find(o => o.id === targetOrderId);
          if (targetOrd) {
            targetOrd.is_flagged_for_review = true;
            targetOrd.flag_reason = `Machine ${mach.machine_code} reported ${payload.event_type}: "${payload.reason || 'Downtime logged'}". Review schedule.`;
            targetOrd.updated_at = new Date().toISOString();
          }
        }

        localEvents.unshift(evt);
        return { event: evt, machine: { ...mach } };
      }
    );
  },

  async calculateDowntime(machineId: string): Promise<{ total_minutes: number; incidents: number }> {
    return fetchWithFallback(`/machines/${machineId}/downtime`, undefined, () => {
      // Find paired Stopped / Resumed events
      const events = localEvents
        .filter(e => e.machine_id === machineId)
        .sort((a, b) => new Date(a.event_time).getTime() - new Date(b.event_time).getTime());

      let totalMinutes = 0;
      let incidents = 0;
      let lastStoppedTime: number | null = null;

      for (const e of events) {
        if (['Stopped', 'Breakdown Reported', 'Maintenance'].includes(e.event_type)) {
          lastStoppedTime = new Date(e.event_time).getTime();
          incidents++;
        } else if (['Resumed', 'Running'].includes(e.event_type) && lastStoppedTime) {
          const diffMinutes = Math.round((new Date(e.event_time).getTime() - lastStoppedTime) / (1000 * 60));
          totalMinutes += Math.max(1, diffMinutes);
          lastStoppedTime = null;
        }
      }

      if (lastStoppedTime) {
        // Still stopped
        const diffMinutes = Math.round((Date.now() - lastStoppedTime) / (1000 * 60));
        totalMinutes += Math.max(1, diffMinutes);
      }

      return { total_minutes: totalMinutes, incidents };
    });
  },

  // SUPERVISOR DASHBOARD AGGREGATE
  async getDashboardMetrics(inactivityThresholdMinutes: number = 30): Promise<SupervisorDashboardMetrics> {
    return fetchWithFallback(`/supervisor/dashboard?threshold=${inactivityThresholdMinutes}`, undefined, () => {
      const activeOrders = localOrders.filter(o => o.status === 'In Progress' || o.status === 'Planned');
      const runningCount = localMachines.filter(m => m.current_status === 'Running').length;
      const idleCount = localMachines.filter(m => m.current_status === 'Idle').length;
      const stoppedCount = localMachines.filter(m => ['Stopped', 'Breakdown Reported', 'Maintenance'].includes(m.current_status)).length;

      const totalTarget = localOrders.reduce((sum, o) => sum + o.target_quantity, 0);
      const totalProduced = localOrders.reduce((sum, o) => sum + o.produced_quantity, 0);
      const progress = totalTarget > 0 ? Math.round((totalProduced / totalTarget) * 100) : 0;

      const lowStockBatches = localBatches.filter(b => b.quantity_available <= b.reorder_threshold);
      const flaggedOrdersCount = localOrders.filter(o => o.is_flagged_for_review).length;

      // Inactivity stoppage warning rule:
      // If a machine is Running, but last output was >= configured interval ago
      const possibleStoppages: SupervisorDashboardMetrics['possible_stoppages'] = [];
      const nowMs = Date.now();

      localMachines.forEach(m => {
        if (m.current_status === 'Running' && m.last_output_time) {
          const elapsedMinutes = Math.round((nowMs - new Date(m.last_output_time).getTime()) / (1000 * 60));
          if (elapsedMinutes >= inactivityThresholdMinutes) {
            possibleStoppages.push({
              machine_id: m.id,
              machine_code: m.machine_code,
              order_no: m.active_order_no,
              last_output_time: m.last_output_time,
              minutes_inactive: elapsedMinutes,
              status: m.current_status,
              message: `Possible stoppage — confirmation required (No output for ${elapsedMinutes}m)`,
            });
          }
        }
      });

      // Orders approaching due date within 5 days
      const delayedOrders = localOrders.filter(o => {
        if (o.status === 'Completed') return false;
        const due = new Date(o.due_date).getTime();
        const diffDays = (due - nowMs) / (1000 * 60 * 60 * 24);
        return diffDays <= 5;
      });

      return {
        active_orders_count: activeOrders.length,
        running_machines_count: runningCount,
        idle_machines_count: idleCount,
        stopped_machines_count: stoppedCount,
        total_target_quantity: totalTarget,
        total_produced_quantity: totalProduced,
        overall_progress_percentage: progress,
        total_downtime_minutes: 85,
        low_stock_batch_count: lowStockBatches.length,
        flagged_orders_count: flaggedOrdersCount,
        orders_approaching_deadline: delayedOrders,
        possible_stoppages: possibleStoppages,
        recent_events: localEvents.slice(0, 5),
      };
    });
  },

  // HARDWARE-INSPIRED WEAVING MACHINE SIMULATOR
  async getSimulationStatus(): Promise<{ simulation_speed: number; is_paused: boolean; source: string; timestamp: string; disclaimer: string }> {
    return fetchWithFallback('/simulation/status', undefined, () => ({
      simulation_speed: 1,
      is_paused: false,
      source: 'SIMULATED',
      timestamp: new Date().toISOString(),
      disclaimer: 'Software simulation of industrial weaving machine telemetry.',
    }));
  },

  async setSimulationControl(payload: { speed?: 1 | 5 | 10; paused?: boolean }): Promise<{ simulation_speed: number; is_paused: boolean }> {
    return fetchWithFallback(
      '/simulation/control',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      () => ({
        simulation_speed: payload.speed || 1,
        is_paused: payload.paused !== undefined ? payload.paused : false,
      })
    );
  },

  async getAllSimulationMachines(): Promise<MachineTelemetry[]> {
    return fetchWithFallback('/simulation/machines', undefined, () => {
      return localMachines.map((m) => {
        const ord = m.active_order_id ? localOrders.find((o) => o.id === m.active_order_id) : undefined;
        const isRunning = m.current_status === 'Running';
        const isStopped = m.current_status === 'Stopped';
        return {
          machine_id: m.id,
          machine_code: m.machine_code,
          process_type: m.process_type,
          active_order_id: m.active_order_id || null,
          active_order_no: m.active_order_no || null,
          target_quantity: ord?.target_quantity || 5000,
          produced_quantity: (m as any).produced_quantity || ord?.produced_quantity || 3200,
          operating_state: isRunning
            ? 'RUNNING'
            : isStopped
            ? 'STOPPED'
            : m.current_status === 'Maintenance'
            ? 'MAINTENANCE'
            : 'IDLE',
          motor_state: isRunning ? 'ON' : 'OFF',
          rpm: isRunning ? 650 : 0,
          vibration_rms: 2.4,
          motor_temp_c: 68.0,
          power_kw: isRunning ? 1.2 : 0,
          current_amps: isRunning ? 3.2 : 0,
          e_stop_active: false,
          sensor_comm_status: 'CONNECTED',
          cumulative_counter_meters: (m as any).produced_quantity || ord?.produced_quantity || 3200,
          fractional_meters_buffer: 0,
          last_processed_counter_meters: 3200,
          active_scenario: isRunning ? 'NORMAL_PRODUCTION' : 'UNEXPECTED_STOP',
          simulation_speed: 1,
          simulation_paused: false,
          downtime_started_at: isStopped ? new Date().toISOString() : null,
          total_downtime_seconds: 0,
          last_output_persisted_at: m.last_output_time || new Date().toISOString(),
          active_warnings: [],
          recent_signals: [
            { machine_id: m.id, signal_type: 'MAIN_DRIVE_RPM', signal_name: 'Main Shaft RPM', value: isRunning ? 650 : 0, unit: 'RPM', simulated_timestamp: new Date().toISOString(), signal_source: 'SIMULATED', quality: 'GOOD' },
            { machine_id: m.id, signal_type: 'BEARING_VIBRATION', signal_name: 'Loom Vibration RMS', value: 2.4, unit: 'mm/s', simulated_timestamp: new Date().toISOString(), signal_source: 'SIMULATED', quality: 'GOOD' },
            { machine_id: m.id, signal_type: 'MOTOR_TEMPERATURE', signal_name: 'Motor Temp', value: 68.5, unit: '°C', simulated_timestamp: new Date().toISOString(), signal_source: 'SIMULATED', quality: 'GOOD' },
            { machine_id: m.id, signal_type: 'PRODUCTION_COUNTER', signal_name: 'Cloth Counter', value: (m as any).produced_quantity || 3200, unit: 'meters', simulated_timestamp: new Date().toISOString(), signal_source: 'SIMULATED', quality: 'GOOD' },
          ],
          config: {
            machine_id: m.id,
            rated_rpm: 650,
            min_rpm_running: 500,
            max_rpm: 850,
            picks_per_cm: 25,
            meters_per_hour: 15.6,
            vibration_warning_threshold: 5.5,
            vibration_critical_threshold: 8,
            temp_warning_threshold: 75,
            temp_critical_threshold: 90,
            no_output_threshold_seconds: 1800,
            counter_precision: 1,
          },
        } as MachineTelemetry;
      });
    });
  },

  async getMachineTelemetry(machineId: string): Promise<MachineTelemetry> {
    const list = await this.getAllSimulationMachines();
    const found = list.find((m) => m.machine_id === machineId);
    if (found) return found;
    return list[0];
  },

  async triggerSimulationScenario(
    machineId: string,
    scenario: SimulationScenario,
    reason?: string
  ): Promise<MachineTelemetry> {
    const fallbackFn = (): MachineTelemetry => {
      const mach = localMachines.find((m) => m.id === machineId) || localMachines[0];
      const ord = mach.active_order_id ? localOrders.find((o) => o.id === mach.active_order_id) : undefined;
      const isRunning = ['START_MACHINE', 'NORMAL_PRODUCTION', 'RESUME_PRODUCTION', 'VIBRATION_ANOMALY', 'OVERHEATING'].includes(scenario);
      const isStopped = ['UNEXPECTED_STOP', 'EMERGENCY_STOP'].includes(scenario);

      return {
        machine_id: machineId,
        machine_code: mach.machine_code,
        process_type: mach.process_type,
        active_order_id: mach.active_order_id || null,
        active_order_no: mach.active_order_no || null,
        target_quantity: ord?.target_quantity || 5000,
        produced_quantity: (mach as any).produced_quantity || ord?.produced_quantity || 3200,
        operating_state: isRunning
          ? 'RUNNING'
          : isStopped
          ? 'STOPPED'
          : scenario === 'PLANNED_MAINTENANCE'
          ? 'MAINTENANCE'
          : 'IDLE',
        motor_state: isRunning ? 'ON' : 'OFF',
        rpm: isRunning ? 650 : 0,
        vibration_rms: scenario === 'VIBRATION_ANOMALY' ? 6.8 : 2.4,
        motor_temp_c: scenario === 'OVERHEATING' ? 78.5 : 68.0,
        power_kw: isRunning ? 1.2 : 0,
        current_amps: isRunning ? 3.2 : 0,
        e_stop_active: scenario === 'EMERGENCY_STOP',
        sensor_comm_status: scenario === 'SENSOR_DISCONNECT' ? 'DISCONNECTED' : 'CONNECTED',
        cumulative_counter_meters: (mach as any).produced_quantity || ord?.produced_quantity || 3200,
        fractional_meters_buffer: 0,
        last_processed_counter_meters: 3200,
        active_scenario: scenario,
        simulation_speed: 1,
        simulation_paused: false,
        downtime_started_at: isStopped ? new Date().toISOString() : null,
        total_downtime_seconds: 0,
        last_output_persisted_at: new Date().toISOString(),
        active_warnings: [],
        recent_signals: [],
        config: {
          machine_id: machineId,
          rated_rpm: 650,
          min_rpm_running: 500,
          max_rpm: 850,
          picks_per_cm: 25,
          meters_per_hour: 15.6,
          vibration_warning_threshold: 5.5,
          vibration_critical_threshold: 8,
          temp_warning_threshold: 75,
          temp_critical_threshold: 90,
          no_output_threshold_seconds: 1800,
          counter_precision: 1,
        },
      } as MachineTelemetry;
    };

    let res: MachineTelemetry;
    try {
      res = await fetchWithFallback<MachineTelemetry>(
        `/simulation/machines/${machineId}/scenario`,
        {
          method: 'POST',
          body: JSON.stringify({ scenario, reason }),
        },
        fallbackFn
      );
    } catch {
      res = fallbackFn();
    }

    // Synchronize directly with factory floor machines and orders
    const mach = localMachines.find((m) => m.id === machineId);
    if (mach) {
      if (['START_MACHINE', 'NORMAL_PRODUCTION', 'RESUME_PRODUCTION', 'VIBRATION_ANOMALY', 'OVERHEATING'].includes(scenario)) {
        mach.current_status = 'Running';
        mach.last_output_time = new Date().toISOString();
      } else if (['UNEXPECTED_STOP', 'EMERGENCY_STOP'].includes(scenario)) {
        mach.current_status = 'Stopped';
        if (mach.active_order_id) {
          const ord = localOrders.find((o) => o.id === mach.active_order_id);
          if (ord) {
            ord.is_flagged_for_review = true;
            ord.flag_reason = `Loom ${mach.machine_code} reported stoppage: "${reason || 'Warp yarn breakage detected.'}"`;
            ord.updated_at = new Date().toISOString();
          }
        }
      } else if (scenario === 'PLANNED_MAINTENANCE') {
        mach.current_status = 'Maintenance';
      }
    }

    return res;
  },

  async updateSimulationConfig(
    machineId: string,
    config: Partial<MachineSimulationConfig>
  ): Promise<MachineSimulationConfig> {
    return fetchWithFallback(`/simulation/machines/${machineId}/config`, {
      method: 'PATCH',
      body: JSON.stringify(config),
    }, () => config as MachineSimulationConfig);
  },

  // QUALITY INSPECTIONS MODULE
  async getQualityInspections(filters?: { decision?: string; stage?: string; search?: string }): Promise<QualityInspection[]> {
    const params = new URLSearchParams();
    if (filters?.decision && filters.decision !== 'ALL') params.append('decision', filters.decision);
    if (filters?.stage && filters.stage !== 'ALL') params.append('stage', filters.stage);
    if (filters?.search) params.append('search', filters.search);
    const qs = params.toString();
    const endpoint = `/quality-inspections${qs ? `?${qs}` : ''}`;

    return fetchWithFallback(endpoint, undefined, () => {
      let list = [...localInspections];
      if (filters?.decision && filters.decision !== 'ALL') {
        list = list.filter((i) => i.decision === filters.decision);
      }
      if (filters?.stage && filters.stage !== 'ALL') {
        list = list.filter((i) => i.stage === filters.stage);
      }
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        list = list.filter(
          (i) =>
            i.batch_code?.toLowerCase().includes(q) ||
            i.barcode?.toLowerCase().includes(q) ||
            i.inspector_name.toLowerCase().includes(q) ||
            i.supplier?.toLowerCase().includes(q)
        );
      }
      return list;
    });
  },

  async getPendingInspectionBatches(): Promise<YarnBatch[]> {
    return fetchWithFallback('/quality-inspections/batches/pending', undefined, () => {
      return localBatches.filter((b) => b.inspection_status === 'PENDING_INSPECTION' || b.inspection_status === 'ON_HOLD');
    });
  },

  async getBatchInspectionHistory(batchId: string): Promise<QualityInspection[]> {
    return fetchWithFallback(`/quality-inspections/batches/${batchId}/inspections`, undefined, () => {
      return localInspections
        .filter((i) => i.batch_id === batchId)
        .sort((a, b) => a.inspection_number - b.inspection_number);
    });
  },

  async recordQualityInspection(
    batchId: string,
    payload: {
      inspector_name: string;
      packaging_condition: 'Acceptable' | 'Damaged';
      visible_contamination: 'Not observed' | 'Observed';
      colour_consistency: 'Acceptable' | 'Issue found';
      yarn_appearance: 'Acceptable' | 'Issue found';
      visual_remarks?: string;
      defect_description?: string;
      photo_url?: string;
      spec_checks: SpecCheckItem[];
      supplier_cert_ref?: string;
      decision: InspectionDisposition;
      quantity_approved: number;
      quantity_held: number;
      quantity_rejected: number;
      decision_reason?: string;
      reinspection_reason?: string;
      stage?: 'INITIAL' | 'REINSPECTION' | 'AUDIT';
    }
  ): Promise<{ inspection: QualityInspection; batch: YarnBatch }> {
    return fetchWithFallback(
      `/quality-inspections/batches/${batchId}/inspections`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      () => {
        const batch = localBatches.find((b) => b.id === batchId);
        if (!batch) throw new Error('Yarn batch not found');

        // Validation: Mandatory specs for PASSED
        if (payload.decision === 'PASSED') {
          const failedMandatory = payload.spec_checks.find(
            (c) => c.is_mandatory && (c.result === 'Fail' || c.result === 'Not Tested')
          );
          if (failedMandatory) {
            throw new Error(`Cannot approve batch as PASSED: Mandatory test "${failedMandatory.test_name}" has result "${failedMandatory.result}". Batches with failed or untested mandatory criteria must be placed ON_HOLD or REJECTED.`);
          }
          if (payload.visible_contamination === 'Observed' || payload.packaging_condition === 'Damaged') {
            throw new Error(`Cannot approve batch as PASSED while visible contamination or damaged packaging is recorded.`);
          }
        }

        const existingHist = localInspections.filter((i) => i.batch_id === batchId);
        const inspectionNumber = existingHist.length + 1;
        const stage = inspectionNumber > 1 ? 'REINSPECTION' : payload.stage || 'INITIAL';

        const newInsp: QualityInspection = {
          id: `insp-${Date.now()}`,
          batch_id: batchId,
          batch_code: batch.batch_code,
          barcode: batch.barcode,
          supplier: batch.supplier,
          yarn_type: batch.yarn_type,
          colour: batch.colour,
          inspection_number: inspectionNumber,
          stage: stage as any,
          inspector_name: payload.inspector_name,
          inspection_date: new Date().toISOString(),
          packaging_condition: payload.packaging_condition,
          visible_contamination: payload.visible_contamination,
          colour_consistency: payload.colour_consistency,
          yarn_appearance: payload.yarn_appearance,
          visual_remarks: payload.visual_remarks,
          defect_description: payload.defect_description,
          photo_url: payload.photo_url,
          spec_checks: payload.spec_checks,
          supplier_cert_ref: payload.supplier_cert_ref,
          decision: payload.decision,
          quantity_inspected: batch.quantity_received,
          quantity_approved: payload.quantity_approved,
          quantity_held: payload.quantity_held,
          quantity_rejected: payload.quantity_rejected,
          decision_reason: payload.decision_reason,
          reinspection_reason: payload.reinspection_reason,
          created_at: new Date().toISOString(),
        };

        // Update local batch
        batch.inspection_status = payload.decision;
        batch.quantity_approved = payload.quantity_approved;
        batch.quantity_held = payload.quantity_held;
        batch.quantity_rejected = payload.quantity_rejected;
        batch.quantity_available = payload.quantity_approved;

        // Record stock movement audit
        const move: StockMovement = {
          id: `mov-${Date.now()}`,
          batch_id: batch.id,
          batch_code: batch.batch_code,
          movement_type: 'ADJUSTMENT',
          quantity: payload.quantity_approved,
          reference: `QC ${stage} #${inspectionNumber} [${payload.decision}] by ${payload.inspector_name}. Approved: ${payload.quantity_approved}kg, Held: ${payload.quantity_held}kg, Rejected: ${payload.quantity_rejected}kg`,
          created_at: new Date().toISOString(),
        };

        localInspections.unshift(newInsp);
        localMovements.unshift(move);

        return { inspection: newInsp, batch: { ...batch } };
      }
    );
  },

  // FABRIC ROLLS & FINISHED QC
  async getFabricRolls(filters?: { qc_status?: string; search?: string; dispatch_ready?: boolean }): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters?.qc_status && filters.qc_status !== 'ALL') params.append('qc_status', filters.qc_status);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.dispatch_ready) params.append('dispatch_ready', 'true');
    const qs = params.toString();
    return fetchWithFallback(`/fabric-rolls${qs ? `?${qs}` : ''}`, undefined, () => []);
  },

  async getFabricRoll(id: string): Promise<any> {
    return fetchWithFallback(`/fabric-rolls/${id}`);
  },

  async recordFabricInspection(rollId: string, payload: {
    inspector_id?: number | string;
    defect_type?: string;
    defect_count: number;
    remarks?: string;
    disposition: 'APPROVED' | 'REJECTED' | 'REINSPECTION';
  }): Promise<any> {
    return fetchWithFallback(`/fabric-rolls/${rollId}/inspections`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // DISPATCH HUB
  async getDispatches(): Promise<any[]> {
    return fetchWithFallback('/dispatches', undefined, () => []);
  },

  async validateDispatch(payload: { roll_id?: string; roll_code?: string; quantity?: number }): Promise<any> {
    return fetchWithFallback('/dispatch/validate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async createDispatch(payload: {
    roll_id?: string;
    roll_code?: string;
    fabric_roll_id?: number | string;
    vehicle_number: string;
    destination: string;
    quantity?: number;
    unit_price?: number;
    dispatch_reference?: string;
  }): Promise<any> {
    return fetchWithFallback('/dispatches', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // HR & ACCOUNTS & PROFITABILITY
  async getDepartments(): Promise<any[]> {
    return fetchWithFallback('/accounts/departments', undefined, () => []);
  },

  async getEmployees(filters?: { department_id?: number | string; search?: string }): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters?.department_id) params.append('department_id', String(filters.department_id));
    if (filters?.search) params.append('search', filters.search);
    const qs = params.toString();
    return fetchWithFallback(`/accounts/employees${qs ? `?${qs}` : ''}`, undefined, () => []);
  },

  async getAttendance(date?: string): Promise<any[]> {
    const qs = date ? `?date=${date}` : '';
    return fetchWithFallback(`/accounts/attendance${qs}`, undefined, () => []);
  },

  async recordAttendance(payload: {
    employee_id: number | string;
    attendance_date?: string;
    status?: 'PRESENT' | 'ABSENT' | 'HALF_DAY';
    hours_worked?: number;
    remarks?: string;
  }): Promise<any> {
    return fetchWithFallback('/accounts/attendance', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getExpenses(filters?: { category?: string; start_date?: string; end_date?: string }): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    const qs = params.toString();
    return fetchWithFallback(`/accounts/expenses${qs ? `?${qs}` : ''}`, undefined, () => []);
  },

  async recordExpense(payload: {
    category: string;
    description?: string;
    amount: number;
    expense_date?: string;
    expense_reference?: string;
  }): Promise<any> {
    return fetchWithFallback('/accounts/expenses', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getProfitReport(): Promise<any> {
    return fetchWithFallback('/accounts/profit-report', undefined, () => ({
      total_revenue: 0,
      total_operating_expenses: 0,
      total_wage_expenses: 0,
      net_profit: 0,
      profit_margin: 0,
      daily_breakdown: { dispatches: [], expenses: [], wages: [] },
    }));
  },

  async getStorageLocations(): Promise<any[]> {
    return fetchWithFallback('/storage-locations', undefined, () => []);
  },
};

