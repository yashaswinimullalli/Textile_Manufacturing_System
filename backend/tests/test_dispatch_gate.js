// Automated Acceptance Tests for FabricTrace
import assert from 'assert';
import { store } from '../src/data/store.js';
import { evaluateRollDispatchEligibility } from '../src/dispatch/dispatch_controller.js';

console.log('--- Running FabricTrace Dispatch Gate & Business Logic Tests ---');

// Test 1: Reset store and check seed rolls
store.reset();
const roll8 = store.getRollByCode('ROLL-008');
const roll9 = store.getRollByCode('ROLL-009');
const roll10 = store.getRollByCode('ROLL-010');

assert.strictEqual(roll8?.roll_code, 'ROLL-008', 'ROLL-008 must exist');
assert.strictEqual(roll9?.roll_code, 'ROLL-009', 'ROLL-009 must exist');
assert.strictEqual(roll10?.roll_code, 'ROLL-010', 'ROLL-010 must exist');
console.log('✓ Test 1 Passed: Seed rolls verified');

// Test 2: Uninspected roll dispatch block (ROLL-009)
const evalUninspected = evaluateRollDispatchEligibility('ROLL-009');
assert.strictEqual(evalUninspected.eligible, false, 'Uninspected roll must NOT be eligible');
assert.strictEqual(evalUninspected.reason, 'This roll has not been inspected.', 'Blocked reason must match spec');
console.log('✓ Test 2 Passed: Uninspected roll blocked');

// Test 3: Rework pending roll dispatch block (ROLL-008)
const evalRework = evaluateRollDispatchEligibility('ROLL-008');
assert.strictEqual(evalRework.eligible, false, 'Rework roll must NOT be eligible');
assert.strictEqual(evalRework.reason, 'Rework is required before another inspection.', 'Blocked reason must match spec');
console.log('✓ Test 3 Passed: Rework roll blocked');

// Test 4: Rejected roll dispatch block (ROLL-010)
const evalRejected = evaluateRollDispatchEligibility('ROLL-010');
assert.strictEqual(evalRejected.eligible, false, 'Rejected roll must NOT be eligible');
assert.strictEqual(evalRejected.reason, 'This roll is rejected and cannot be dispatched.', 'Blocked reason must match spec');
console.log('✓ Test 4 Passed: Rejected roll blocked');

// Test 5: Reinspection after rework preserves history & updates status (Page 4 & 16 Demo Step 4)
const prevInspectionsCount = store.getInspectionsByRollId(roll8.id).length;
assert.strictEqual(prevInspectionsCount, 1, 'ROLL-008 should initially have 1 inspection (REWORK)');

const newInspection = store.addInspection({
  roll_id: roll8.id,
  decision: 'PASS',
  defect_type: 'none',
  affected_quantity: 0,
  unit: roll8.unit,
  severity: 'none',
  location: 'Full length',
  notes: 'Post-scouring inspection: stains successfully cleared.',
  prior_inspection_id: 'INSP-008'
}, { id: 'inspector_alex', name: 'Alex Kumar', role: 'QUALITY_INSPECTOR' });

const updatedInspections = store.getInspectionsByRollId(roll8.id);
assert.strictEqual(updatedInspections.length, 2, 'History must be preserved: 2 inspections now');
assert.strictEqual(updatedInspections[0].decision, 'REWORK', 'Initial rework decision must be preserved');
assert.strictEqual(updatedInspections[1].decision, 'PASS', 'New pass decision must be appended');
assert.strictEqual(roll8.operational_status, 'PASSED', 'Operational status must now be PASSED');
console.log('✓ Test 5 Passed: Reinspection preserves history and updates status');

// Test 6: Reinspected roll is now eligible for dispatch
const evalPostReinspection = evaluateRollDispatchEligibility('ROLL-008');
assert.strictEqual(evalPostReinspection.eligible, true, 'Roll 008 must now be eligible');
console.log('✓ Test 6 Passed: Reinspected roll passes dispatch gate');

// Test 7: Atomic dispatch execution & subsequent double-dispatch prevention
const dispatchRecord = store.addDispatch({
  roll_id: roll8.id,
  order_id: roll8.order_id,
  quantity: 120,
  destination: 'Hamburg Port',
  tracking_ref: 'WAYBILL-TEST-88'
}, { id: 'dispatch_raj', name: 'Rajesh V', role: 'DISPATCH_OFFICER' });

assert.strictEqual(dispatchRecord.status, 'DISPATCHED', 'Dispatch record must be created');
assert.strictEqual(roll8.operational_status, 'DISPATCHED', 'Roll status must become DISPATCHED');

// Attempting to dispatch again must now fail
const evalAfterDispatch = evaluateRollDispatchEligibility('ROLL-008');
assert.strictEqual(evalAfterDispatch.eligible, false, 'Fully dispatched roll must not be eligible again');
assert.strictEqual(evalAfterDispatch.reason, 'No eligible quantity remains (already fully dispatched).');
console.log('✓ Test 7 Passed: Atomic dispatch & double-dispatch prevention');

// Test 8: Audit event generation
const auditEvents = store.getAuditEvents({ entityId: dispatchRecord.id });
assert(auditEvents.length > 0, 'Audit event must exist for dispatch');
assert.strictEqual(auditEvents[0].action, 'DISPATCH_COMPLETED', 'Audit action must be DISPATCH_COMPLETED');
console.log('✓ Test 8 Passed: Audit trail records dispatch');

console.log('\n--- ALL DISPATCH GATE & INSPECTOR ACCEPTANCE TESTS PASSED! ---\n');
