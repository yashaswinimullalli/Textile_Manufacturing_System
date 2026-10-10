import { store } from '../data/store.js';

export function getOwnerSummary(req, res) {
  const { from, to } = req.query;
  const rolls = store.getRolls();
  const alerts = store.getAlerts();
  const orders = store.getOrders();
  const costs = store.getCosts();
  const inspections = store.data.inspections;

  // Urgent alerts: OPEN with severity HIGH
  const urgentAlertsCount = alerts.filter(a => a.status === "OPEN" && a.severity === "HIGH").length;

  // Orders at risk: delayed or with rejected rolls
  const ordersAtRiskCount = orders.filter(o => {
    if (o.status === "DELAYED") return true;
    const hasRejectedRolls = rolls.some(r => r.order_id === o.id && r.operational_status === "REJECTED");
    return hasRejectedRolls;
  }).length;

  // Rejected and rework quantities across current inventory
  const rejectedQuantity = rolls
    .filter(r => r.operational_status === "REJECTED")
    .reduce((sum, r) => sum + r.produced_quantity, 0);

  const reworkQuantity = rolls
    .filter(r => r.operational_status === "REWORK_REQUIRED")
    .reduce((sum, r) => sum + r.produced_quantity, 0);

  // Total recorded vs estimated costs
  const recordedCostsTotal = costs
    .filter(c => !c.is_estimated)
    .reduce((sum, c) => sum + c.amount, 0);

  const estimatedExposureTotal = costs
    .filter(c => c.is_estimated)
    .reduce((sum, c) => sum + c.amount, 0);

  const passInspections = inspections.filter(i => i.decision === "PASS").length;
  const totalInspections = inspections.length;
  const passRate = totalInspections > 0 ? ((passInspections / totalInspections) * 100).toFixed(1) : "0.0";

  return res.json({
    date_range: { from: from || "start", to: to || "now" },
    metrics: {
      urgent_alerts: {
        value: urgentAlertsCount,
        label: "Urgent Alerts",
        definition: "Open alerts tagged with HIGH severity requiring immediate owner decision"
      },
      orders_at_risk: {
        value: ordersAtRiskCount,
        label: "Orders At Risk",
        definition: "Active customer orders facing deadline delays or unfulfilled volume from rejected rolls"
      },
      quarantine_quantity: {
        value: rejectedQuantity + reworkQuantity,
        rejected: rejectedQuantity,
        rework: reworkQuantity,
        unit: "metres",
        label: "Quarantined Fabric",
        definition: "Total meters blocked from dispatch due to reject (scrap) or pending rework"
      },
      financial_exposure: {
        recorded_total: recordedCostsTotal,
        estimated_total: estimatedExposureTotal,
        total_costs: recordedCostsTotal + estimatedExposureTotal,
        currency: "INR",
        label: "Recorded Production Costs",
        definition: "Actual recorded invoices, labour timesheets and overheads directly logged in system"
      },
      overall_pass_rate: {
        value: `${passRate}%`,
        label: "Inspection First-Pass Rate",
        definition: `Pass decisions (${passInspections}) divided by total completed inspection events (${totalInspections})`
      }
    }
  });
}

export function getAlerts(req, res) {
  const { status, severity } = req.query;
  const alerts = store.getAlerts({ status, severity });
  return res.json({ alerts });
}

export function updateAlert(req, res) {
  const { id } = req.params;
  const { status, resolution_notes } = req.body;

  const validStatuses = ["OPEN", "ACKNOWLEDGED", "RESOLVED"];
  if (!status || !validStatuses.includes(status.toUpperCase())) {
    return res.status(400).json({
      error: "INVALID_STATUS",
      message: `Status must be one of: ${validStatuses.join(", ")}`
    });
  }

  const actor = {
    id: req.actor?.id || "owner_sarah",
    name: req.actor?.name || "Sarah Chen",
    role: req.actor?.role || "OWNER"
  };

  const updated = store.updateAlertStatus(id, status.toUpperCase(), actor, resolution_notes);
  if (!updated) {
    return res.status(404).json({
      error: "ALERT_NOT_FOUND",
      message: `Alert with id '${id}' not found.`
    });
  }

  return res.json({
    message: "Alert updated successfully.",
    alert: updated
  });
}

export function getOwnerOrders(req, res) {
  const orders = store.getOrders();
  const rolls = store.getRolls();

  const progress = orders.map(order => {
    const orderRolls = rolls.filter(r => r.order_id === order.id);
    const producedQuantity = orderRolls.reduce((sum, r) => sum + r.produced_quantity, 0);
    const passedQuantity = orderRolls
      .filter(r => r.operational_status === "PASSED" || r.operational_status === "DISPATCHED")
      .reduce((sum, r) => sum + r.produced_quantity, 0);
    const dispatchedQuantity = orderRolls
      .reduce((sum, r) => sum + (r.dispatched_quantity || 0), 0);
    const reworkQuantity = orderRolls
      .filter(r => r.operational_status === "REWORK_REQUIRED")
      .reduce((sum, r) => sum + r.produced_quantity, 0);
    const rejectedQuantity = orderRolls
      .filter(r => r.operational_status === "REJECTED")
      .reduce((sum, r) => sum + r.produced_quantity, 0);
    const remainingTarget = Math.max(0, order.target_quantity - passedQuantity);

    return {
      order_id: order.id,
      order_code: order.order_code,
      customer_reference: order.customer_reference,
      target_quantity: order.target_quantity,
      unit: order.unit,
      due_date: order.due_date,
      status: order.status,
      produced_quantity: producedQuantity,
      passed_quantity: passedQuantity,
      dispatched_quantity: dispatchedQuantity,
      rework_quantity: reworkQuantity,
      rejected_quantity: rejectedQuantity,
      remaining_target: remainingTarget,
      completion_percentage: ((passedQuantity / order.target_quantity) * 100).toFixed(1),
      roll_count: orderRolls.length
    };
  });

  return res.json({ orders: progress });
}

export function getQualityTrends(req, res) {
  const inspections = store.data.inspections;
  const rolls = store.getRolls();

  const total = inspections.length;
  const passCount = inspections.filter(i => i.decision === "PASS").length;
  const reworkCount = inspections.filter(i => i.decision === "REWORK").length;
  const rejectCount = inspections.filter(i => i.decision === "REJECT").length;

  const passRate = total > 0 ? ((passCount / total) * 100).toFixed(1) : "0.0";
  const reworkRate = total > 0 ? ((reworkCount / total) * 100).toFixed(1) : "0.0";
  const rejectRate = total > 0 ? ((rejectCount / total) * 100).toFixed(1) : "0.0";

  // Total affected quantity
  const totalAffectedQuantity = inspections.reduce((sum, i) => sum + (Number(i.affected_quantity) || 0), 0);

  // Group by defect type
  const defectBreakdown = {};
  inspections.forEach(i => {
    if (i.defect_type && i.defect_type !== "none") {
      if (!defectBreakdown[i.defect_type]) {
        defectBreakdown[i.defect_type] = { count: 0, affected_quantity: 0, unit: i.unit };
      }
      defectBreakdown[i.defect_type].count += 1;
      defectBreakdown[i.defect_type].affected_quantity += Number(i.affected_quantity) || 0;
    }
  });

  return res.json({
    caveat_note: "Trends count all logged inspection events chronologically. A roll with multiple reinspections counts each event to show real factory effort and flaw frequency.",
    summary: {
      total_inspection_events: total,
      unique_rolls_tested: new Set(inspections.map(i => i.roll_id)).size,
      pass_rate: `${passRate}%`,
      rework_rate: `${reworkRate}%`,
      reject_rate: `${rejectRate}%`,
      total_affected_quantity: totalAffectedQuantity,
      unit: "metres"
    },
    defect_categories: Object.entries(defectBreakdown).map(([defect, data]) => ({
      defect_type: defect,
      incident_count: data.count,
      affected_quantity: data.affected_quantity,
      unit: data.unit
    })),
    recent_trend_data: inspections.slice(-10).map(i => ({
      id: i.id,
      roll_id: i.roll_id,
      decision: i.decision,
      defect_type: i.defect_type,
      affected_quantity: i.affected_quantity,
      timestamp: i.created_at
    }))
  });
}

export function getOwnerCosts(req, res) {
  const { orderId, category } = req.query;
  const costs = store.getCosts({ orderId, category });

  const totalRecorded = costs
    .filter(c => !c.is_estimated)
    .reduce((sum, c) => sum + c.amount, 0);

  const totalEstimated = costs
    .filter(c => c.is_estimated)
    .reduce((sum, c) => sum + c.amount, 0);

  const byCategory = {};
  costs.forEach(c => {
    byCategory[c.category] = (byCategory[c.category] || 0) + c.amount;
  });

  return res.json({
    costs,
    aggregated: {
      total_recorded: totalRecorded,
      total_estimated: totalEstimated,
      grand_total: totalRecorded + totalEstimated,
      currency: "INR",
      by_category: byCategory
    }
  });
}

export function addCostRecord(req, res) {
  const { order_id, category, amount, currency, source_reference, is_estimated, notes } = req.body;

  if (!order_id || !category || isNaN(Number(amount))) {
    return res.status(400).json({
      error: "INVALID_COST_PAYLOAD",
      message: "order_id, category, and a valid numeric amount are required."
    });
  }

  const validCategories = ["material", "labour", "machine/overhead", "rework", "transport"];
  if (!validCategories.includes(category)) {
    return res.status(400).json({
      error: "INVALID_CATEGORY",
      message: `Category must be one of: ${validCategories.join(", ")}`
    });
  }

  const actor = {
    id: req.actor?.id || "owner_sarah",
    name: req.actor?.name || "Sarah Chen",
    role: req.actor?.role || "OWNER"
  };

  const cost = store.addCost({
    order_id,
    category,
    amount: Number(amount),
    currency: currency || "INR",
    source_reference: source_reference || "MANUAL-VOUCHER",
    is_estimated: Boolean(is_estimated),
    notes: notes || ""
  }, actor);

  return res.status(201).json({
    message: "Cost line item recorded successfully.",
    cost
  });
}

export function getDailyFinancialReceipt(req, res) {
  const { date } = req.query;
  const dayData = store.getDailyFinancials(date);
  const allDays = store.getAllDailyFinancials();

  return res.json({
    day: dayData,
    available_dates: allDays.map(d => ({
      date: d.date,
      buyer_payments: d.buyer_payments,
      raw_materials: d.raw_materials,
      worker_wages: d.worker_wages,
      net_profit: d.net_profit,
      currency: d.currency
    }))
  });
}
