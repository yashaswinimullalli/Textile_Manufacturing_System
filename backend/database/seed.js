// ==============================================================================
// FabricTrace Database Seed Script
// Generates 50 realistic fabric rolls and daily financial records in INR
// ==============================================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const FABRIC_TYPES = [
  "100% Combed Cotton",
  "Raw Indigo Denim",
  "Mulberry Silk Chiffon",
  "Pure Organic Linen",
  "Poly-Cotton Poplin",
  "Viscose Bamboo Rayon",
  "Merino Wool Blend",
  "Heavy Cotton Twill",
  "Jacquard Brocade",
  "Sheer Silk Organza",
  "Modal Satin Blend",
  "Oxford Weave Cotton",
  "Spandex Stretch Twill",
  "Tussar Silk",
  "Herringbone Wool"
];

export const BUYERS = [
  "Arvind Lifestyle Brands",
  "Raymond Luxury Fabrics",
  "Vardhman Textiles Ltd",
  "Bombay Dyeing Corp",
  "Fabindia Overseas",
  "Madura Fashion & Apparel",
  "Alok Industries Global"
];

export const SUPPLIERS = [
  "Gujarat Cotton Federation",
  "Mysore Silk Cocoon Co-op",
  "Coimbatore Spinning Mills",
  "Surat Synthetic Yarn Hub",
  "Ludhiana Wool Combers"
];

export function generate50Rolls() {
  const rolls = [];
  const operators = ["Ramesh Patel", "Sunita Sharma", "Kavita Rao", "Vikram Singh", "Deepak Joshi", "Ananya Sen"];
  const shifts = ["Morning Shift A", "Day Shift B", "Night Shift C"];

  for (let i = 1; i <= 50; i++) {
    const rollNum = 1000 + i;
    const rollCode = `ROLL-${rollNum}`;
    const fabricType = FABRIC_TYPES[(i - 1) % FABRIC_TYPES.length];
    const orderId = `ORD-${101 + ((i - 1) % 5)}`;
    const producedQty = 120 + ((i * 17) % 180); // 120 - 300 meters
    
    // Distribute realistic inspection states:
    // e.g. First few passed, some rework, some rejected, some pending
    let status = "PASSED";
    let isInspected = true;
    let decision = "PASS";
    let affectedQty = 0;
    let defectNotes = "Clean weave, uniform tensile strength, passed four-point check.";

    if (i % 7 === 0) {
      status = "REJECTED";
      decision = "REJECT";
      affectedQty = Math.round(producedQty * 0.4);
      defectNotes = "Severe warp breakage and continuous oil contamination across 40% of roll.";
    } else if (i % 5 === 0) {
      status = "REWORK";
      decision = "REWORK";
      affectedQty = Math.round(producedQty * 0.15);
      defectNotes = "Minor selvedge curl and surface shade inconsistency requiring scouring bath.";
    } else if (i > 42) {
      status = "PENDING";
      isInspected = false;
      decision = null;
      affectedQty = 0;
      defectNotes = "";
    }

    // Some already dispatched
    const alreadyDispatched = status === "PASSED" && i <= 8;
    const dispatchedQty = alreadyDispatched ? producedQty : 0;
    if (alreadyDispatched) {
      status = "DISPATCHED";
    }

    rolls.push({
      id: `roll-${rollNum}`,
      roll_code: rollCode,
      order_id: orderId,
      fabric_type: fabricType,
      produced_quantity: producedQty,
      dispatched_quantity: dispatchedQty,
      unit: "metres",
      operational_status: status,
      machine_id: `LOOM-${String((i % 8) + 1).padStart(2, '0')}`,
      shift: shifts[i % shifts.length],
      yarn_batch: `YB-2026-${800 + (i % 12)}`,
      operator_name: operators[i % operators.length],
      is_inspected: isInspected,
      already_dispatched: alreadyDispatched,
      latest_decision: decision,
      affected_quantity: affectedQty,
      notes: defectNotes,
      created_at: new Date(Date.now() - (50 - i) * 6 * 3600 * 1000).toISOString()
    });
  }

  return rolls;
}

export function generateDailyFinancials() {
  const days = [];
  // Spanning dates: 2026-10-01 to 2026-10-15
  for (let d = 1; d <= 15; d++) {
    const dayStr = `2026-10-${String(d).padStart(2, '0')}`;
    
    // Vary amounts realistically in INR
    const buyerPaymentTotal = 65000 + (d * 8500) + ((d % 3) * 12000);
    const rawMaterialTotal = 28000 + (d * 4200) + ((d % 2) * 8000);
    const workerWageTotal = 16000 + ((d % 4) * 2500);
    const netProfit = buyerPaymentTotal - rawMaterialTotal - workerWageTotal;

    const buyer = BUYERS[d % BUYERS.length];
    const supplier = SUPPLIERS[d % SUPPLIERS.length];

    const records = [
      {
        id: `FIN-BP-${dayStr}-1`,
        date: dayStr,
        type: "BUYER_PAYMENT",
        category: "Client Remittance",
        description: `Shipment settlement invoice payment from ${buyer}`,
        amount: Math.round(buyerPaymentTotal * 0.65),
        currency: "INR",
        source_reference: `INV-REC-${9000 + d}`
      },
      {
        id: `FIN-BP-${dayStr}-2`,
        date: dayStr,
        type: "BUYER_PAYMENT",
        category: "Production Advance",
        description: `Order milestone advance payment from ${BUYERS[(d + 2) % BUYERS.length]}`,
        amount: Math.round(buyerPaymentTotal * 0.35),
        currency: "INR",
        source_reference: `ADV-BUY-${3000 + d}`
      },
      {
        id: `FIN-RM-${dayStr}-1`,
        date: dayStr,
        type: "RAW_MATERIAL",
        category: "Yarn & Raw Cotton",
        description: `Raw yarn consignment purchase from ${supplier}`,
        amount: Math.round(rawMaterialTotal * 0.75),
        currency: "INR",
        source_reference: `PO-SUP-${5000 + d}`
      },
      {
        id: `FIN-RM-${dayStr}-2`,
        date: dayStr,
        type: "RAW_MATERIAL",
        category: "Dyes & Processing Chemicals",
        description: `Eco-certified indigo reactive dyes & scouring salts`,
        amount: Math.round(rawMaterialTotal * 0.25),
        currency: "INR",
        source_reference: `PO-CHEM-${1200 + d}`
      },
      {
        id: `FIN-WW-${dayStr}-1`,
        date: dayStr,
        type: "WORKER_WAGE",
        category: "Loom Floor Operators",
        description: `Weaving floor line A & B shift operator attendance pay`,
        amount: Math.round(workerWageTotal * 0.70),
        currency: "INR",
        source_reference: `TS-PAY-${400 + d}`
      },
      {
        id: `FIN-WW-${dayStr}-2`,
        date: dayStr,
        type: "WORKER_WAGE",
        category: "Quality Inspectors & Mechanics",
        description: `Inspection specialists and maintenance technicians stipend`,
        amount: Math.round(workerWageTotal * 0.30),
        currency: "INR",
        source_reference: `TS-TECH-${200 + d}`
      }
    ];

    days.push({
      date: dayStr,
      buyer_payments: buyerPaymentTotal,
      raw_materials: rawMaterialTotal,
      worker_wages: workerWageTotal,
      net_profit: netProfit,
      currency: "INR",
      records
    });
  }

  return days;
}

export function generateSeedSQL() {
  const rolls = generate50Rolls();
  const financials = generateDailyFinancials();

  let sql = `-- =====================================================\n`;
  sql += `-- FabricTrace Seed Data (50 Fabric Rolls + Financials in INR)\n`;
  sql += `-- =====================================================\n\n`;

  sql += `-- 1. Insert Production Orders\n`;
  sql += `INSERT INTO production_orders (id, order_code, customer_name, target_meters, due_date, status) VALUES\n`;
  const orderValues = BUYERS.slice(0, 5).map((buyer, idx) => {
    return `('ORD-${101 + idx}', 'ORD-2026-00${idx + 1}', '${buyer}', 1500.00, '2026-10-${20 + idx}', 'IN_PROGRESS')`;
  }).join(',\n');
  sql += orderValues + ';\n\n';

  sql += `-- 2. Insert 50 Fabric Rolls\n`;
  sql += `INSERT INTO fabric_rolls (id, roll_code, order_id, fabric_type, produced_quantity, dispatched_quantity, unit, operational_status, machine_id, shift, yarn_batch, operator_name, is_inspected, already_dispatched, created_at) VALUES\n`;
  const rollValues = rolls.map(r => {
    return `('${r.id}', '${r.roll_code}', '${r.order_id}', '${r.fabric_type}', ${r.produced_quantity}, ${r.dispatched_quantity}, 'metres', '${r.operational_status}', '${r.machine_id}', '${r.shift}', '${r.yarn_batch}', '${r.operator_name}', ${r.is_inspected}, ${r.already_dispatched}, '${r.created_at}')`;
  }).join(',\n');
  sql += rollValues + ';\n\n';

  sql += `-- 3. Insert Inspections for inspected rolls\n`;
  const inspectedRolls = rolls.filter(r => r.is_inspected && r.latest_decision);
  if (inspectedRolls.length > 0) {
    sql += `INSERT INTO inspections (id, roll_id, roll_code, decision, inspector_id, inspector_name, affected_quantity, notes, inspected_at) VALUES\n`;
    const inspValues = inspectedRolls.map((r, idx) => {
      return `('INSP-${1000 + idx}', '${r.id}', '${r.roll_code}', '${r.latest_decision}', 'INSP-USER-1', '${r.operator_name}', ${r.affected_quantity}, '${r.notes.replace(/'/g, "''")}', '${r.created_at}')`;
    }).join(',\n');
    sql += inspValues + ';\n\n';
  }

  sql += `-- 4. Insert Daily Financial Records (INR)\n`;
  sql += `INSERT INTO daily_financial_records (id, date, type, category, description, amount, currency, source_reference, created_at) VALUES\n`;
  const allFinRecords = [];
  financials.forEach(day => {
    day.records.forEach(rec => {
      allFinRecords.push(`('${rec.id}', '${rec.date}', '${rec.type}', '${rec.category}', '${rec.description.replace(/'/g, "''")}', ${rec.amount}, 'INR', '${rec.source_reference}', '${rec.date}T10:00:00Z')`);
    });
  });
  sql += allFinRecords.join(',\n') + ';\n\n';

  return sql;
}

// Generate the seed.sql file
const sqlOutput = generateSeedSQL();
const outPath = path.join(__dirname, 'seed.sql');
fs.writeFileSync(outPath, sqlOutput, 'utf8');
console.log(`[Seed Generator] Generated 50 rolls and daily financials at ${outPath}`);
