// In-memory data store for FabricTrace with canonical demo data and reset capability
import crypto from 'crypto';
import { generate50Rolls, generateDailyFinancials } from '../../database/seed.js';

const INITIAL_DATA = {
  orders: [
    {
      id: "ORD-101",
      order_code: "ORD-2026-001",
      customer_reference: "Acme Apparel Ltd",
      target_quantity: 650,
      unit: "metres",
      due_date: "2026-10-25",
      status: "IN_PROGRESS",
      created_at: "2026-10-01T08:00:00Z"
    },
    {
      id: "ORD-102",
      order_code: "ORD-2026-002",
      customer_reference: "Global Denim Brand",
      target_quantity: 400,
      unit: "metres",
      due_date: "2026-10-18",
      status: "DELAYED",
      created_at: "2026-10-03T09:30:00Z"
    },
    {
      id: "ORD-103",
      order_code: "ORD-2026-003",
      customer_reference: "Nordic Uniforms Co",
      target_quantity: 500,
      unit: "metres",
      due_date: "2026-11-05",
      status: "IN_PROGRESS",
      created_at: "2026-10-05T11:00:00Z"
    }
  ],

  rolls: [
    {
      id: "roll-001",
      roll_code: "ROLL-001",
      order_id: "ORD-101",
      fabric_type: "Cotton Twill 240 GSM",
      produced_quantity: 200,
      dispatched_quantity: 0,
      unit: "metres",
      operational_status: "PASSED",
      machine_id: "LOOM-01",
      shift: "Morning Shift A",
      yarn_batch: "YB-2026-891",
      operator_name: "Ramesh P",
      created_at: "2026-10-07T07:15:00Z"
    },
    {
      id: "roll-002",
      roll_code: "ROLL-002",
      order_id: "ORD-101",
      fabric_type: "Cotton Twill 240 GSM",
      produced_quantity: 180,
      dispatched_quantity: 180,
      unit: "metres",
      operational_status: "DISPATCHED",
      machine_id: "LOOM-02",
      shift: "Morning Shift A",
      yarn_batch: "YB-2026-891",
      operator_name: "Suresh K",
      created_at: "2026-10-07T08:30:00Z"
    },
    {
      id: "roll-008",
      roll_code: "ROLL-008",
      order_id: "ORD-101",
      fabric_type: "Cotton Twill 240 GSM",
      produced_quantity: 120,
      dispatched_quantity: 0,
      unit: "metres",
      operational_status: "REWORK_REQUIRED",
      machine_id: "LOOM-04",
      shift: "Evening Shift B",
      yarn_batch: "YB-2026-904",
      operator_name: "Mahesh B",
      created_at: "2026-10-09T14:20:00Z"
    },
    {
      id: "roll-009",
      roll_code: "ROLL-009",
      order_id: "ORD-101",
      fabric_type: "Cotton Twill 240 GSM",
      produced_quantity: 150,
      dispatched_quantity: 0,
      unit: "metres",
      operational_status: "NEEDS_INSPECTION",
      machine_id: "LOOM-03",
      shift: "Morning Shift A",
      yarn_batch: "YB-2026-904",
      operator_name: "Kiran R",
      created_at: "2026-10-10T06:00:00Z"
    },
    {
      id: "roll-010",
      roll_code: "ROLL-010",
      order_id: "ORD-102",
      fabric_type: "Denim 12oz Heavy",
      produced_quantity: 95,
      dispatched_quantity: 0,
      unit: "metres",
      operational_status: "REJECTED",
      machine_id: "LOOM-07",
      shift: "Night Shift C",
      yarn_batch: "YB-2026-915",
      operator_name: "Devendra S",
      created_at: "2026-10-09T23:10:00Z"
    },
    {
      id: "roll-011",
      roll_code: "ROLL-011",
      order_id: "ORD-102",
      fabric_type: "Denim 12oz Heavy",
      produced_quantity: 110,
      dispatched_quantity: 0,
      unit: "metres",
      operational_status: "PASSED",
      machine_id: "LOOM-07",
      shift: "Morning Shift A",
      yarn_batch: "YB-2026-915",
      operator_name: "Vikram N",
      created_at: "2026-10-08T11:00:00Z"
    }
  ],

  inspections: [
    {
      id: "INSP-001",
      roll_id: "roll-001",
      inspector_user_id: "inspector_alex",
      inspector_name: "Alex Kumar (Senior Inspector)",
      decision: "PASS",
      defect_type: "none",
      affected_quantity: 0,
      unit: "metres",
      severity: "none",
      location: "Full length",
      notes: "Clean roll, uniform tension and shade.",
      photo_url: null,
      prior_inspection_id: null,
      created_at: "2026-10-07T10:00:00Z"
    },
    {
      id: "INSP-002",
      roll_id: "roll-002",
      inspector_user_id: "inspector_alex",
      inspector_name: "Alex Kumar (Senior Inspector)",
      decision: "PASS",
      defect_type: "none",
      affected_quantity: 0,
      unit: "metres",
      severity: "none",
      location: "Full length",
      notes: "Inspected and passed standard export tolerances.",
      photo_url: null,
      prior_inspection_id: null,
      created_at: "2026-10-07T12:00:00Z"
    },
    {
      id: "INSP-008",
      roll_id: "roll-008",
      inspector_user_id: "inspector_alex",
      inspector_name: "Alex Kumar (Senior Inspector)",
      decision: "REWORK",
      defect_type: "stain/oil",
      affected_quantity: 15,
      unit: "metres",
      severity: "medium",
      location: "Meters 35 - 50",
      notes: "Machine oil drip spots along selvedge. Requires chemical wash and spot scouring.",
      photo_url: null,
      prior_inspection_id: null,
      created_at: "2026-10-09T16:45:00Z"
    },
    {
      id: "INSP-010",
      roll_id: "roll-010",
      inspector_user_id: "inspector_alex",
      inspector_name: "Alex Kumar (Senior Inspector)",
      decision: "REJECT",
      defect_type: "hole/tear",
      affected_quantity: 40,
      unit: "metres",
      severity: "critical",
      location: "Meters 10 - 50",
      notes: "Severe needle breakdown tear across weft. Structural failure beyond salvage.",
      photo_url: null,
      prior_inspection_id: null,
      created_at: "2026-10-10T01:15:00Z"
    },
    {
      id: "INSP-011",
      roll_id: "roll-011",
      inspector_user_id: "inspector_alex",
      inspector_name: "Alex Kumar (Senior Inspector)",
      decision: "PASS",
      defect_type: "none",
      affected_quantity: 0,
      unit: "metres",
      severity: "none",
      location: "Full length",
      notes: "First quality finish. Meets all tensile requirements.",
      photo_url: null,
      prior_inspection_id: null,
      created_at: "2026-10-08T15:30:00Z"
    }
  ],

  dispatches: [
    {
      id: "DISP-001",
      roll_id: "roll-002",
      order_id: "ORD-101",
      quantity: 180,
      actor_user_id: "dispatch_raj",
      actor_name: "Rajesh V (Dispatch Lead)",
      dispatched_at: "2026-10-08T09:00:00Z",
      destination: "Acme Distribution Hub, Frankfurt",
      tracking_ref: "SHP-2026-0041",
      status: "DISPATCHED"
    }
  ],

  alerts: [
    {
      id: "ALT-001",
      type: "REJECTED_ROLL_IN_OPEN_ORDER",
      severity: "HIGH",
      title: "Rejected Roll in Active Order",
      reason: "ROLL-010 was rejected for severe hole/tear (40m affected). Open order ORD-102 target is at risk.",
      source_record_type: "roll",
      source_record_id: "ROLL-010",
      order_id: "ORD-102",
      created_at: "2026-10-10T01:16:00Z",
      status: "OPEN",
      assigned_to: "Sarah Chen (Owner)",
      suggested_action: "Review disposition in Roll Passport and schedule replacement batch."
    },
    {
      id: "ALT-002",
      type: "REWORK_WAITING_TOO_LONG",
      severity: "HIGH",
      title: "Rework Waiting Over 18 Hours",
      reason: "ROLL-008 flagged REWORK for stain/oil over 18h ago. Order ORD-101 deadline is approaching.",
      source_record_type: "roll",
      source_record_id: "ROLL-008",
      order_id: "ORD-101",
      created_at: "2026-10-10T02:00:00Z",
      status: "OPEN",
      assigned_to: "Anand M (Finishing Floor)",
      suggested_action: "Expedite wash treatment and notify Quality Inspector for reinspection."
    },
    {
      id: "ALT-003",
      type: "REPEATED_DEFECT_TYPE",
      severity: "MEDIUM",
      title: "Elevated Stain/Oil Defects",
      reason: "Machine LOOM-04 recorded multiple stain/oil issues this week. Possible lubricant seal failure.",
      source_record_type: "machine",
      source_record_id: "LOOM-04",
      order_id: "ORD-101",
      created_at: "2026-10-09T18:00:00Z",
      status: "ACKNOWLEDGED",
      assigned_to: "Maintenance Team",
      suggested_action: "Inspect lubricant manifolds on Loom-04 during shift turnover."
    },
    {
      id: "ALT-004",
      type: "MISSING_COST_RECORDS",
      severity: "INFO",
      title: "Rework Cost Pending Input",
      reason: "Rework chemical cost line for ROLL-008 has not been finalized by accounts.",
      source_record_type: "cost",
      source_record_id: "ORD-101",
      order_id: "ORD-101",
      created_at: "2026-10-10T04:00:00Z",
      status: "OPEN",
      assigned_to: "Accounts Department",
      suggested_action: "Enter confirmed chemical and labour rework expenditure."
    }
  ],

  costs: [
    {
      id: "COST-001",
      order_id: "ORD-101",
      category: "material",
      amount: 4200.00,
      currency: "INR",
      recorded_at: "2026-10-02T10:00:00Z",
      source_reference: "PO-RAW-8821",
      is_estimated: false,
      status: "RECORDED",
      notes: "Certified combed organic cotton yarn batch YB-2026-891"
    },
    {
      id: "COST-002",
      order_id: "ORD-101",
      category: "labour",
      amount: 1450.00,
      currency: "INR",
      recorded_at: "2026-10-07T18:00:00Z",
      source_reference: "TS-WEAVE-W40",
      is_estimated: false,
      status: "RECORDED",
      notes: "Weaving and beaming shift labour"
    },
    {
      id: "COST-003",
      order_id: "ORD-101",
      category: "machine/overhead",
      amount: 680.00,
      currency: "INR",
      recorded_at: "2026-10-08T09:00:00Z",
      source_reference: "PWR-OCT-01",
      is_estimated: false,
      status: "RECORDED",
      notes: "Power consumption and allocated loom machine hours"
    },
    {
      id: "COST-004",
      order_id: "ORD-101",
      category: "rework",
      amount: 180.00,
      currency: "INR",
      recorded_at: "2026-10-09T18:30:00Z",
      source_reference: "RWK-STAIN-008",
      is_estimated: true,
      status: "RECORDED",
      notes: "Estimated chemical scouring bath and re-tensioning for ROLL-008"
    },
    {
      id: "COST-005",
      order_id: "ORD-102",
      category: "material",
      amount: 3800.00,
      currency: "INR",
      recorded_at: "2026-10-04T11:00:00Z",
      source_reference: "PO-RAW-8845",
      is_estimated: false,
      status: "RECORDED",
      notes: "Indigo dyed warp and ring-spun weft denim yarn"
    },
    {
      id: "COST-006",
      order_id: "ORD-102",
      category: "labour",
      amount: 980.00,
      currency: "INR",
      recorded_at: "2026-10-09T20:00:00Z",
      source_reference: "TS-WEAVE-W41",
      is_estimated: false,
      status: "RECORDED",
      notes: "Heavy loom weaving operators"
    }
  ],

  auditEvents: [
    {
      id: "AUD-001",
      actor_user_id: "system_genesis",
      actor_name: "System Provisioner",
      actor_role: "SYSTEM",
      action: "INITIAL_SEED",
      entity_type: "system",
      entity_id: "SYS-INIT",
      before_json: null,
      after_json: { seed_version: "1.0", rolls_seeded: 6 },
      reason: "System initial workspace data provisioned",
      timestamp: "2026-10-07T07:00:00Z",
      request_id: "REQ-INIT-001"
    },
    {
      id: "AUD-002",
      actor_user_id: "inspector_alex",
      actor_name: "Alex Kumar",
      actor_role: "QUALITY_INSPECTOR",
      action: "INSPECTION_CREATED",
      entity_type: "inspection",
      entity_id: "INSP-001",
      before_json: { roll_status: "NEEDS_INSPECTION" },
      after_json: { inspection_id: "INSP-001", decision: "PASS", affected_quantity: 0 },
      reason: "Quality gate inspection passed",
      timestamp: "2026-10-07T10:00:00Z",
      request_id: "REQ-INS-001"
    },
    {
      id: "AUD-003",
      actor_user_id: "dispatch_raj",
      actor_name: "Rajesh V",
      actor_role: "DISPATCH_OFFICER",
      action: "DISPATCH_COMPLETED",
      entity_type: "dispatch",
      entity_id: "DISP-001",
      before_json: { roll_code: "ROLL-002", status: "PASSED", remaining_qty: 180 },
      after_json: { roll_code: "ROLL-002", status: "DISPATCHED", dispatched_qty: 180 },
      reason: "Shipment SHP-2026-0041 released for Frankfurt",
      timestamp: "2026-10-08T09:00:00Z",
      request_id: "REQ-DSP-001"
    },
    {
      id: "AUD-004",
      actor_user_id: "inspector_alex",
      actor_name: "Alex Kumar",
      actor_role: "QUALITY_INSPECTOR",
      action: "INSPECTION_CREATED",
      entity_type: "inspection",
      entity_id: "INSP-008",
      before_json: { roll_code: "ROLL-008", status: "NEEDS_INSPECTION" },
      after_json: { inspection_id: "INSP-008", decision: "REWORK", defect_type: "stain/oil", affected_qty: 15 },
      reason: "Selvedge stain detected, flagged for rework scouring",
      timestamp: "2026-10-09T16:45:00Z",
      request_id: "REQ-INS-008"
    },
    {
      id: "AUD-005",
      actor_user_id: "inspector_alex",
      actor_name: "Alex Kumar",
      actor_role: "QUALITY_INSPECTOR",
      action: "INSPECTION_CREATED",
      entity_type: "inspection",
      entity_id: "INSP-010",
      before_json: { roll_code: "ROLL-010", status: "NEEDS_INSPECTION" },
      after_json: { inspection_id: "INSP-010", decision: "REJECT", defect_type: "hole/tear", affected_qty: 40 },
      reason: "Structural weft tear beyond acceptable repair limits",
      timestamp: "2026-10-10T01:15:00Z",
      request_id: "REQ-INS-010"
    }
  ]
};

// Working in-memory mutable copy
class DataStore {
  constructor() {
    this.reset();
  }

  reset() {
    this.data = JSON.parse(JSON.stringify(INITIAL_DATA));
    const generatedRolls = generate50Rolls();
    generatedRolls.forEach(gr => {
      if (!this.data.rolls.some(r => r.roll_code === gr.roll_code)) {
        this.data.rolls.push(gr);
      }
    });
    this.data.dailyFinancials = generateDailyFinancials();
  }

  getOrders() {
    return this.data.orders;
  }

  getOrderById(id) {
    return this.data.orders.find(o => o.id === id || o.order_code === id);
  }

  getRolls() {
    return this.data.rolls;
  }

  getRollByCode(rollCode) {
    if (!rollCode) return null;
    const clean = rollCode.trim().toUpperCase().replace(/^#/, '');
    return this.data.rolls.find(r => 
      r.roll_code.toUpperCase() === clean || 
      r.roll_code.toUpperCase() === `ROLL-${clean}` ||
      r.id.toUpperCase() === clean ||
      r.id.toUpperCase() === `ROLL-${clean}` ||
      r.id.toUpperCase() === `ROLL-${clean.toLowerCase()}`
    );
  }

  getDailyFinancials(date) {
    if (!this.data.dailyFinancials) {
      this.data.dailyFinancials = generateDailyFinancials();
    }
    if (date) {
      const found = this.data.dailyFinancials.find(d => d.date === date);
      if (found) return found;
    }
    return this.data.dailyFinancials[this.data.dailyFinancials.length - 1];
  }

  getAllDailyFinancials() {
    if (!this.data.dailyFinancials) {
      this.data.dailyFinancials = generateDailyFinancials();
    }
    return this.data.dailyFinancials;
  }

  getInspectionsByRollId(rollId) {
    return this.data.inspections
      .filter(i => i.roll_id === rollId)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  }

  getLatestInspection(rollId) {
    const list = this.getInspectionsByRollId(rollId);
    return list.length > 0 ? list[list.length - 1] : null;
  }

  addInspection(inspectionData, actor) {
    const newId = `INSP-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 90 + 10)}`;
    const now = new Date().toISOString();

    const inspection = {
      id: newId,
      roll_id: inspectionData.roll_id,
      inspector_user_id: actor.id || "inspector_alex",
      inspector_name: actor.name || "Alex Kumar",
      decision: inspectionData.decision,
      defect_type: inspectionData.decision === "PASS" && !inspectionData.defect_type ? "none" : inspectionData.defect_type,
      affected_quantity: Number(inspectionData.affected_quantity) || 0,
      unit: inspectionData.unit || "metres",
      severity: inspectionData.severity || "none",
      location: inspectionData.location || "General",
      notes: inspectionData.notes || "",
      photo_url: inspectionData.photo_url || null,
      prior_inspection_id: inspectionData.prior_inspection_id || null,
      created_at: now
    };

    this.data.inspections.push(inspection);

    // Update operational status of the roll
    const roll = this.data.rolls.find(r => r.id === inspectionData.roll_id);
    let previousStatus = "UNKNOWN";
    if (roll) {
      previousStatus = roll.operational_status;
      if (inspection.decision === "PASS") {
        roll.operational_status = "PASSED";
      } else if (inspection.decision === "REWORK") {
        roll.operational_status = "REWORK_REQUIRED";
      } else if (inspection.decision === "REJECT") {
        roll.operational_status = "REJECTED";
      }
    }

    // Auto-create audit event
    this.addAuditEvent({
      actor_user_id: actor.id || "inspector_alex",
      actor_name: actor.name || "Alex Kumar",
      actor_role: actor.role || "QUALITY_INSPECTOR",
      action: "INSPECTION_CREATED",
      entity_type: "inspection",
      entity_id: inspection.id,
      before_json: { roll_code: roll?.roll_code, operational_status: previousStatus },
      after_json: {
        roll_code: roll?.roll_code,
        operational_status: roll?.operational_status,
        decision: inspection.decision,
        defect_type: inspection.defect_type,
        affected_quantity: inspection.affected_quantity
      },
      reason: `Inspection completed with decision ${inspection.decision}${inspection.defect_type !== 'none' ? ` (${inspection.defect_type})` : ''}`,
      timestamp: now,
      request_id: `REQ-${crypto.randomUUID().slice(0, 8)}`
    });

    // Auto-update or create alert if rework/reject
    if (inspection.decision === "REJECT") {
      this.data.alerts.push({
        id: `ALT-${Date.now().toString().slice(-4)}`,
        type: "REJECTED_ROLL_IN_OPEN_ORDER",
        severity: "HIGH",
        title: `Roll ${roll?.roll_code} Rejected`,
        reason: `${roll?.roll_code} rejected by ${actor.name || 'Inspector'}: ${inspection.defect_type} (${inspection.affected_quantity} ${inspection.unit}).`,
        source_record_type: "roll",
        source_record_id: roll?.roll_code,
        order_id: roll?.order_id,
        created_at: now,
        status: "OPEN",
        assigned_to: "Sarah Chen (Owner)",
        suggested_action: "Open roll passport, review disposition and order progress."
      });
    } else if (inspection.decision === "REWORK") {
      this.data.alerts.push({
        id: `ALT-${Date.now().toString().slice(-4)}`,
        type: "REWORK_WAITING_TOO_LONG",
        severity: "HIGH",
        title: `Roll ${roll?.roll_code} Sent to Rework`,
        reason: `${roll?.roll_code} requires rework due to ${inspection.defect_type} (${inspection.affected_quantity} ${inspection.unit}).`,
        source_record_type: "roll",
        source_record_id: roll?.roll_code,
        order_id: roll?.order_id,
        created_at: now,
        status: "OPEN",
        assigned_to: "Finishing Supervisor",
        suggested_action: "Assign rework operator and schedule reinspection."
      });
    }

    return inspection;
  }

  getAlerts(filters = {}) {
    let list = [...this.data.alerts];
    if (filters.status) {
      list = list.filter(a => a.status.toUpperCase() === filters.status.toUpperCase());
    }
    if (filters.severity) {
      list = list.filter(a => a.severity.toUpperCase() === filters.severity.toUpperCase());
    }
    return list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  updateAlertStatus(alertId, newStatus, actor, resolutionNote = "") {
    const alert = this.data.alerts.find(a => a.id === alertId);
    if (!alert) return null;

    const beforeStatus = alert.status;
    alert.status = newStatus;
    if (resolutionNote) {
      alert.resolution_notes = resolutionNote;
    }

    this.addAuditEvent({
      actor_user_id: actor.id || "owner_sarah",
      actor_name: actor.name || "Sarah Chen",
      actor_role: actor.role || "OWNER",
      action: "ALERT_STATUS_CHANGED",
      entity_type: "alert",
      entity_id: alert.id,
      before_json: { status: beforeStatus },
      after_json: { status: newStatus, resolution_notes: resolutionNote },
      reason: `Alert status updated from ${beforeStatus} to ${newStatus}`,
      timestamp: new Date().toISOString(),
      request_id: `REQ-${crypto.randomUUID().slice(0, 8)}`
    });

    return alert;
  }

  getCosts(filters = {}) {
    let list = [...this.data.costs];
    if (filters.orderId) {
      list = list.filter(c => c.order_id === filters.orderId);
    }
    if (filters.category) {
      list = list.filter(c => c.category === filters.category);
    }
    return list;
  }

  addCost(costData, actor) {
    const newCost = {
      id: `COST-${Date.now().toString().slice(-4)}`,
      order_id: costData.order_id,
      category: costData.category,
      amount: Number(costData.amount),
      currency: costData.currency || "INR",
      recorded_at: new Date().toISOString(),
      source_reference: costData.source_reference || "MANUAL-ENTRY",
      is_estimated: Boolean(costData.is_estimated),
      status: "RECORDED",
      notes: costData.notes || ""
    };
    this.data.costs.push(newCost);

    this.addAuditEvent({
      actor_user_id: actor.id || "owner_sarah",
      actor_name: actor.name || "Sarah Chen",
      actor_role: actor.role || "OWNER",
      action: "COST_RECORDED",
      entity_type: "cost",
      entity_id: newCost.id,
      before_json: null,
      after_json: newCost,
      reason: `New cost record filed under ${newCost.category} for ${newCost.order_id}`,
      timestamp: newCost.recorded_at,
      request_id: `REQ-${crypto.randomUUID().slice(0, 8)}`
    });

    return newCost;
  }

  getAuditEvents(filters = {}) {
    let list = [...this.data.auditEvents];
    if (filters.entityType) {
      list = list.filter(e => e.entity_type.toLowerCase() === filters.entityType.toLowerCase());
    }
    if (filters.entityId) {
      list = list.filter(e => e.entity_id === filters.entityId);
    }
    if (filters.action) {
      list = list.filter(e => e.action === filters.action);
    }
    return list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  addAuditEvent(event) {
    const fullEvent = {
      id: event.id || `AUD-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 90 + 10)}`,
      actor_user_id: event.actor_user_id || "anonymous",
      actor_name: event.actor_name || "Unknown User",
      actor_role: event.actor_role || "SYSTEM",
      action: event.action,
      entity_type: event.entity_type,
      entity_id: event.entity_id,
      before_json: event.before_json || null,
      after_json: event.after_json || null,
      reason: event.reason || "Operational action logged",
      timestamp: event.timestamp || new Date().toISOString(),
      request_id: event.request_id || `REQ-${crypto.randomUUID().slice(0, 8)}`
    };
    this.data.auditEvents.push(fullEvent);
    return fullEvent;
  }

  getDispatches() {
    return this.data.dispatches;
  }

  addDispatch(dispatchData, actor) {
    const id = `DISP-${Date.now().toString().slice(-4)}`;
    const now = new Date().toISOString();
    const dispatchRecord = {
      id,
      roll_id: dispatchData.roll_id,
      order_id: dispatchData.order_id,
      quantity: dispatchData.quantity,
      actor_user_id: actor.id || "dispatch_raj",
      actor_name: actor.name || "Rajesh V",
      dispatched_at: now,
      destination: dispatchData.destination || "Standard Delivery Hub",
      tracking_ref: dispatchData.tracking_ref || `SHP-${Date.now().toString().slice(-5)}`,
      status: "DISPATCHED"
    };

    this.data.dispatches.push(dispatchRecord);

    // Update roll status and dispatched quantity
    const roll = this.data.rolls.find(r => r.id === dispatchData.roll_id);
    if (roll) {
      const prevQty = roll.dispatched_quantity;
      const prevStatus = roll.operational_status;
      roll.dispatched_quantity += dispatchData.quantity;
      roll.operational_status = "DISPATCHED";

      this.addAuditEvent({
        actor_user_id: actor.id || "dispatch_raj",
        actor_name: actor.name || "Rajesh V",
        actor_role: actor.role || "DISPATCH_OFFICER",
        action: "DISPATCH_COMPLETED",
        entity_type: "dispatch",
        entity_id: id,
        before_json: { roll_code: roll.roll_code, status: prevStatus, dispatched_qty: prevQty },
        after_json: { roll_code: roll.roll_code, status: roll.operational_status, dispatched_qty: roll.dispatched_quantity },
        reason: `Dispatched ${dispatchData.quantity} ${roll.unit} of ${roll.roll_code} under ${dispatchRecord.tracking_ref}`,
        timestamp: now,
        request_id: `REQ-${crypto.randomUUID().slice(0, 8)}`
      });
    }

    return dispatchRecord;
  }
}

export const store = new DataStore();
