// Explicit metric definitions, formulas, and denominators for the Owner dashboard

export const METRIC_DEFINITIONS = {
  urgentAlerts: {
    title: "Urgent Alerts",
    formula: "Count of open alerts where severity = HIGH",
    denominator: "All active unacknowledged incidents in factory system",
    whyItMatters: "Alerts highlight high-impact factory exceptions like rejected rolls in open orders or long-stalled rework."
  },
  ordersAtRisk: {
    title: "Orders At Risk",
    formula: "Count of open customer orders with schedule delays or insufficient passed volume",
    denominator: "All active production sales orders",
    whyItMatters: "Proactively alerts factory management before shipping deadlines are breached."
  },
  quarantineQuantity: {
    title: "Quarantined Fabric",
    formula: "SUM(produced_quantity) WHERE status IN ('REJECTED', 'REWORK_REQUIRED')",
    denominator: "Total physical inventory volume blocked by safety gate",
    whyItMatters: "Shows trapped working capital and scrap volume that cannot be invoiced."
  },
  passRate: {
    title: "First-Pass Quality Rate",
    formula: "Completed inspections decided PASS ÷ All completed inspection events × 100",
    denominator: "Total logged inspection events across all tested rolls",
    whyItMatters: "High pass rates directly correlate with lower rework labor and on-time shipment."
  },
  recordedCost: {
    title: "Recorded Production Costs",
    formula: "SUM(amount) from verified source vouchers (PO, Timesheet, Utility)",
    denominator: "Directly attributable cost line items",
    whyItMatters: "Real accounting figures with audit trail references, separated from estimates."
  },
  reworkRate: {
    title: "Rework Rate",
    formula: "Inspections decided REWORK ÷ All completed inspection events × 100",
    denominator: "Total logged inspection events",
    whyItMatters: "Quantifies the percentage of production cycles requiring secondary cleaning or re-tensioning."
  },
  rejectRate: {
    title: "Scrap / Reject Rate",
    formula: "Inspections decided REJECT ÷ All completed inspection events × 100",
    denominator: "Total logged inspection events",
    whyItMatters: "Identifies irreversible fabric defects resulting in total loss."
  }
};
