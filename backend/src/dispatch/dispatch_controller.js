
import { z } from 'zod';
import { store } from '../data/store.js';

export const DispatchSchema = z.object({
  roll_code: z.string({ required_error: "roll_code is required" }).min(1, "roll_code cannot be empty"),
  quantity: z.number().positive().optional(),
  destination: z.string().optional(),
  tracking_ref: z.string().optional()
});

// Server-side Dispatch Safety Gate Validator
export function evaluateRollDispatchEligibility(rollCode, requestedQuantity = null) {
  const roll = store.getRollByCode(rollCode);
  if (!roll) {
    return {
      eligible: false,
      reason: `Roll '${rollCode}' does not exist in factory inventory.`,
      roll: null
    };
  }

  const latestInspection = store.getLatestInspection(roll.id);

  // Condition 1 & 2: Inspection existence & latest outcome
  if (!latestInspection) {  
    return {
      eligible: false,
      reason: "This roll has not been inspected.",
      roll
    };
  }

  if (latestInspection.decision === "REWORK") {
    return {
      eligible: false,
      reason: "Rework is required before another inspection.",
      roll,
      latestInspection
    };
  }

  if (latestInspection.decision === "REJECT") {
    return {
      eligible: false,
      reason: "This roll is rejected and cannot be dispatched.",
      roll,
      latestInspection
    };
  }

  if (latestInspection.decision !== "PASS") {
    return {
      eligible: false,
      reason: `Latest inspection outcome is '${latestInspection.decision}'. Only PASS can be dispatched.`,
      roll,
      latestInspection
    };
  }

  // Condition 3: Remaining quantity check
  const remaining = roll.produced_quantity - (roll.dispatched_quantity || 0);
  if (remaining <= 0) {
    return {
      eligible: false,
      reason: "No eligible quantity remains (already fully dispatched).",
      roll,
      latestInspection
    };
  }

  if (requestedQuantity !== null) {
    const qty = Number(requestedQuantity);
    if (isNaN(qty) || qty <= 0) {
      return {
        eligible: false,
        reason: "Dispatch quantity must be a positive number.",
        roll
      };
    }
    if (qty > remaining) {
      return {
        eligible: false,
        reason: `Requested dispatch quantity (${qty} ${roll.unit}) exceeds remaining eligible quantity (${remaining} ${roll.unit}).`,
        roll
      };
    }
  }

  return {
    eligible: true,
    reason: "Inspection passed; roll meets all quality and quantity safety rules.",
    roll,
    latestInspection,
    remaining_quantity: remaining
  };
}

// POST /api/dispatch/validate
export function validateDispatch(req, res) {
  const { roll_codes, roll_code, quantity } = req.body;
  const codesToCheck = roll_codes || (roll_code ? [roll_code] : []);

  if (!codesToCheck.length) {
    return res.status(400).json({
      error: "NO_ROLLS_SPECIFIED",
      message: "Please provide roll_code or roll_codes array to validate."
    });
  }

  const results = codesToCheck.map(code => {
    const evalResult = evaluateRollDispatchEligibility(code, quantity);
    return {
      roll_code: code,
      eligible: evalResult.eligible,
      reason: evalResult.reason,
      remaining_quantity: evalResult.remaining_quantity || 0,
      operational_status: evalResult.roll?.operational_status || "UNKNOWN",
      latest_decision: evalResult.latestInspection?.decision || "NONE"
    };
  });

  const allEligible = results.every(r => r.eligible);

  return res.json({
    all_eligible: allEligible,
    results
  });
}

// POST /api/dispatch (Atomic Execution with Zod Validation)
export function executeDispatch(req, res) {
  // Validate request with Zod
  const validation = DispatchSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      error: "INVALID_INPUT",
      message: validation.error.errors[0]?.message || "Invalid dispatch request",
      details: validation.error.flatten()
    });
  }

  const { roll_code, quantity, destination, tracking_ref } = validation.data;
  const roll = store.getRollByCode(roll_code);

  if (!roll) {
    return res.status(400).json({
      error: "LOCK: Roll not found in inventory.",
      message: `Roll '${roll_code}' does not exist in inventory.`,
      status: "Not_Found",
      already_dispatched: false,
      roll_code
    });
  }

  // Check inspection status and dispatch state
  const latestInspection = store.getLatestInspection(roll.id);
  const decision = latestInspection ? latestInspection.decision : (roll.latest_decision || (roll.operational_status === "PASSED" ? "PASS" : null));
  const isPass = decision === "PASS" || roll.operational_status === "PASSED";
  const isAlreadyDispatched = Boolean(roll.already_dispatched || roll.operational_status === "DISPATCHED");

  // Condition 1: already_dispatched === false
  if (isAlreadyDispatched) {
    return res.status(400).json({
      error: "LOCK: Roll already dispatched.",
      message: `Roll '${roll.roll_code}' has already been dispatched from dock.`,
      status: "Dispatched",
      already_dispatched: true,
      roll_code: roll.roll_code
    });
  }

  // Condition 2: status === 'Pass'
  if (!isPass) {
    const statusLabel = decision === "REJECT" ? "Reject" : (decision === "REWORK" ? "Rework" : "Uninspected");

    // Log security blocked audit event
    store.addAuditEvent({
      actor_user_id: req.actor?.id || "dispatch_raj",
      actor_name: req.actor?.name || "Dispatch Officer",
      actor_role: req.actor?.role || "DISPATCH_OFFICER",
      action: "DISPATCH_BLOCKED",
      entity_type: "roll",
      entity_id: roll.roll_code,
      before_json: { status: roll.operational_status, decision },
      after_json: null,
      reason: `LOCK: Roll failed inspection with outcome: ${statusLabel}`,
      timestamp: new Date().toISOString()
    });

    return res.status(400).json({
      error: "LOCK: Roll failed inspection.",
      message: "LOCK: Roll failed inspection.",
      status: statusLabel,
      already_dispatched: false,
      roll_code: roll.roll_code,
      reason: decision ? `Inspection recorded decision: ${decision}` : "This roll has not passed quality inspection."
    });
  }

  // SUCCESS: Execute dispatch & update financial logistics ledger
  const dispatchQty = quantity || roll.produced_quantity;
  const actor = {
    id: req.actor?.id || "dispatch_raj",
    name: req.actor?.name || "Rajesh V",
    role: req.actor?.role || "DISPATCH_OFFICER"
  };

  const dispatchRecord = store.addDispatch({
    roll_id: roll.id,
    order_id: roll.order_id,
    quantity: dispatchQty,
    destination: destination || "Central Loading Terminal Hub",
    tracking_ref: tracking_ref || `WAYBILL-${Date.now().toString().slice(-6)}`
  }, actor);

  roll.already_dispatched = true;
  roll.operational_status = "DISPATCHED";

  // Financial Cost and Revenue Update in INR
  const freightCost = 3500.00;
  const clearedValue = dispatchQty * 480.00;

  return res.status(200).json({
    success: true,
    message: `Roll ${roll.roll_code} verified and dispatched successfully.`,
    status: "Pass",
    already_dispatched: false,
    roll: store.getRollByCode(roll.roll_code),
    dispatch: dispatchRecord,
    financial_update: {
      freight_cost: freightCost,
      cleared_value: clearedValue,
      currency: "INR"
    }
  });
}
