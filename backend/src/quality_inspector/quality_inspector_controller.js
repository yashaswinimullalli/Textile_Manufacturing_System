
import { store } from '../data/store.js';

export function getRollDetails(req, res) {
  const { rollCode } = req.params;
  const roll = store.getRollByCode(rollCode);

  if (!roll) {
    return res.status(404).json({
      error: "ROLL_NOT_FOUND",
      message: `We couldn't find roll '${rollCode}'. Check the label or enter the ID again.`
    });
  }

  const order = store.getOrderById(roll.order_id);
  const inspections = store.getInspectionsByRollId(roll.id);
  const latestInspection = store.getLatestInspection(roll.id);

  // Determine dispatch eligibility
  let isEligible = false;
  let dispatchReason = "";

  if (!latestInspection) {
    isEligible = false;
    dispatchReason = "This roll has not been inspected.";
  } else if (latestInspection.decision === "REWORK") {
    isEligible = false;
    dispatchReason = "Rework is required before another inspection.";
  } else if (latestInspection.decision === "REJECT") {
    isEligible = false;
    dispatchReason = "This roll is rejected and cannot be dispatched.";
  } else if (latestInspection.decision === "PASS") {
    const remainingQty = roll.produced_quantity - (roll.dispatched_quantity || 0);
    if (remainingQty <= 0) {
      isEligible = false;
      dispatchReason = "No eligible quantity remains (already dispatched).";
    } else {
      isEligible = true;
      dispatchReason = "Inspection passed; ready for dispatch allocation.";
    }
  }

  return res.json({
    roll: {
      ...roll,
      remaining_quantity: roll.produced_quantity - (roll.dispatched_quantity || 0)
    },
    order: order || null,
    latest_inspection: latestInspection,
    inspections_count: inspections.length,
    dispatch_eligibility: {
      eligible: isEligible,
      reason: dispatchReason
    }
  });
}

export function getRollInspections(req, res) {
  const { rollCode } = req.params;
  const roll = store.getRollByCode(rollCode);

  if (!roll) {
    return res.status(404).json({
      error: "ROLL_NOT_FOUND",
      message: `We couldn't find roll '${rollCode}'.`
    });
  }

  const inspections = store.getInspectionsByRollId(roll.id);
  return res.json({
    roll_code: roll.roll_code,
    roll_id: roll.id,
    inspections
  });
}

export function createInspection(req, res) {
  const { rollCode } = req.params;
  const roll = store.getRollByCode(rollCode);

  if (!roll) {
    return res.status(404).json({
      error: "ROLL_NOT_FOUND",
      message: `Roll '${rollCode}' does not exist.`
    });
  }

  const { decision, defect_type, affected_quantity, notes, location, severity, photo_url } = req.body;

  // Validation: decision
  const validDecisions = ["PASS", "REWORK", "REJECT"];
  if (!decision || !validDecisions.includes(decision.toUpperCase())) {
    return res.status(400).json({
      error: "INVALID_DECISION",
      message: "Decision must be one of: PASS, REWORK, REJECT."
    });
  }

  const normalizedDecision = decision.toUpperCase();
  const qty = Number(affected_quantity);

  // Validation: affected quantity
  if (isNaN(qty) || qty < 0) {
    return res.status(400).json({
      error: "INVALID_AFFECTED_QUANTITY",
      message: "Affected quantity must be a non-negative number."
    });
  }

  if (qty > roll.produced_quantity) {
    return res.status(400).json({
      error: "QUANTITY_EXCEEDS_ROLL_TOTAL",
      message: `Affected quantity (${qty} ${roll.unit}) cannot exceed roll produced quantity (${roll.produced_quantity} ${roll.unit}).`
    });
  }

  // Defect validation for REWORK and REJECT
  if ((normalizedDecision === "REWORK" || normalizedDecision === "REJECT") && qty <= 0) {
    return res.status(400).json({
      error: "AFFECTED_QUANTITY_REQUIRED",
      message: `For ${normalizedDecision} outcome, affected quantity must be greater than zero.`
    });
  }

  if ((normalizedDecision === "REWORK" || normalizedDecision === "REJECT") && (!defect_type || defect_type === "none")) {
    return res.status(400).json({
      error: "DEFECT_TYPE_REQUIRED",
      message: `For ${normalizedDecision} outcome, a specific defect type is required.`
    });
  }

  const priorInspection = store.getLatestInspection(roll.id);

  const actor = {
    id: req.actor?.id || "inspector_alex",
    name: req.actor?.name || "Alex Kumar",
    role: req.actor?.role || "QUALITY_INSPECTOR"
  };

  const newInspection = store.addInspection({
    roll_id: roll.id,
    decision: normalizedDecision,
    defect_type: defect_type || "none",
    affected_quantity: qty,
    unit: roll.unit,
    severity: severity || (normalizedDecision === "PASS" ? "none" : "medium"),
    location: location || "Inspection table",
    notes: notes || "",
    photo_url: photo_url || null,
    prior_inspection_id: priorInspection ? priorInspection.id : null
  }, actor);

  return res.status(201).json({
    message: "Inspection recorded successfully.",
    inspection: newInspection,
    roll: store.getRollByCode(rollCode),
    receipt: {
      inspection_id: newInspection.id,
      roll_code: roll.roll_code,
      decision: newInspection.decision,
      timestamp: newInspection.created_at,
      inspector: newInspection.inspector_name,
      next_action: normalizedDecision === "PASS" 
        ? "Eligible for dispatch verification." 
        : normalizedDecision === "REWORK" 
          ? "Sent to finishing floor for rework correction." 
          : "Blocked permanently from dispatch."
    }
  });
}

export function getQualitySummary(req, res) {
  const rolls = store.getRolls();
  const allInspections = store.data.inspections;

  const todayStr = new Date().toISOString().slice(0, 10);
  const inspectedToday = allInspections.filter(i => i.created_at.startsWith(todayStr)).length;

  const needsInspectionCount = rolls.filter(r => r.operational_status === "NEEDS_INSPECTION").length;
  const reworkDueCount = rolls.filter(r => r.operational_status === "REWORK_REQUIRED").length;
  const recentlyRejectedCount = rolls.filter(r => r.operational_status === "REJECTED").length;

  // Recent activity list
  const recentInspections = [...allInspections]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 10)
    .map(i => {
      const roll = rolls.find(r => r.id === i.roll_id);
      return {
        inspection_id: i.id,
        roll_code: roll ? roll.roll_code : "UNKNOWN",
        roll_id: i.roll_id,
        decision: i.decision,
        defect_type: i.defect_type,
        affected_quantity: i.affected_quantity,
        unit: i.unit,
        inspector: i.inspector_name,
        timestamp: i.created_at
      };
    });

  return res.json({
    counts: {
      needs_inspection: needsInspectionCount,
      rework_due: reworkDueCount,
      recently_rejected: recentlyRejectedCount,
      inspected_today: inspectedToday
    },
    recent_activity: recentInspections
  });
}

export function getReinspectionQueue(req, res) {
  const rolls = store.getRolls().filter(r => r.operational_status === "REWORK_REQUIRED");
  const enriched = rolls.map(r => {
    const latest = store.getLatestInspection(r.id);
    const order = store.getOrderById(r.order_id);
    return {
      roll: r,
      order,
      latest_inspection: latest
    };
  });
  return res.json({ queue: enriched });
}
