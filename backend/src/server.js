import express from 'express';
import cors from 'cors';
import { authMiddleware, requireRole } from './middleware/auth.js';
import { store } from './data/store.js';

// Quality Inspector Controllers
import {
  getRollDetails,
  getRollInspections,
  createInspection,
  getQualitySummary,
  getReinspectionQueue
} from './quality_inspector/quality_inspector_controller.js';

// Owner Controllers
import {
  getOwnerSummary,
  getAlerts,
  updateAlert,
  getOwnerOrders,
  getQualityTrends,
  getOwnerCosts,
  addCostRecord,
  getDailyFinancialReceipt
} from './owner/owner_controller.js';

// Dispatch Gate Controllers
import {
  validateDispatch,
  executeDispatch
} from './dispatch/dispatch_controller.js';

// Audit Controllers
import {
  getAuditTrail,
  recordCorrection
} from './audit/audit_controller.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(authMiddleware);

// --- Health Check ---
app.get('/api/health', (req, res) => {
  res.json({ status: "OK", service: "FabricTrace API", timestamp: new Date().toISOString() });
});

// --- Quality Inspector Routes ---
app.get('/api/quality/summary', getQualitySummary);
app.get('/api/quality/reinspection-queue', getReinspectionQueue);
app.get('/api/rolls', (req, res) => {
  const { search, status } = req.query;
  let rolls = store.getRolls();
  if (status) {
    rolls = rolls.filter(r => r.operational_status === status);
  }
  if (search) {
    const q = search.toLowerCase();
    rolls = rolls.filter(r => r.roll_code.toLowerCase().includes(q) || r.fabric_type.toLowerCase().includes(q));
  }
  res.json({ rolls });
});
app.get('/api/rolls/:rollCode', getRollDetails);
app.get('/api/rolls/:rollCode/inspections', getRollInspections);
// Role check: Quality Inspector or Owner or Admin
app.post('/api/rolls/:rollCode/inspections', requireRole(['QUALITY_INSPECTOR', 'ADMIN']), createInspection);

// --- Owner Routes ---
app.get('/api/owner/summary', getOwnerSummary);
app.get('/api/owner/alerts', getAlerts);
app.post('/api/owner/alerts/:id/status', requireRole(['OWNER', 'ADMIN']), updateAlert);
app.get('/api/owner/orders', getOwnerOrders);
app.get('/api/owner/quality-trends', getQualityTrends);
app.get('/api/owner/costs', getOwnerCosts);
app.post('/api/owner/costs', requireRole(['OWNER', 'ADMIN']), addCostRecord);
app.get('/api/owner/financial-daily', getDailyFinancialReceipt);

// --- Dispatch Gate Routes ---
app.post('/api/dispatch/validate', validateDispatch);
app.post('/api/dispatch', requireRole(['DISPATCH_OFFICER', 'ADMIN', 'QUALITY_INSPECTOR']), executeDispatch);

// --- Audit Routes ---
app.get('/api/audit', getAuditTrail);
app.post('/api/audit/correction', requireRole(['OWNER', 'ADMIN']), recordCorrection);

// --- Demo State Management ---
app.post('/api/demo/reset', (req, res) => {
  store.reset();
  res.json({
    message: "Demo dataset reset to canonical state.",
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`[FabricTrace Server] Running on http://localhost:${PORT}`);
});

export default app;
