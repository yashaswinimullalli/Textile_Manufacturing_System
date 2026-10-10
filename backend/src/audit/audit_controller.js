import { store } from '../data/store.js';

export function getAuditTrail(req, res) {
  const { entityType, entityId, action } = req.query;
  const events = store.getAuditEvents({ entityType, entityId, action });
  return res.json({ events });
}

export function recordCorrection(req, res) {
  const { entity_type, entity_id, field, old_value, new_value, reason } = req.body;

  if (!entity_type || !entity_id || !field || !reason) {
    return res.status(400).json({
      error: "MISSING_CORRECTION_DATA",
      message: "entity_type, entity_id, field, and a required human explanation 'reason' must be provided."
    });
  }

  const actor = {
    id: req.actor?.id || "authorized_manager",
    name: req.actor?.name || "Authorized Manager",
    role: req.actor?.role || "ADMIN"
  };

  const auditEvent = store.addAuditEvent({
    actor_user_id: actor.id,
    actor_name: actor.name,
    actor_role: actor.role,
    action: "SOURCE_RECORD_CORRECTED",
    entity_type,
    entity_id,
    before_json: { [field]: old_value },
    after_json: { [field]: new_value },
    reason,
    timestamp: new Date().toISOString()
  });

  return res.status(201).json({
    message: "Source record correction audited successfully.",
    audit_event: auditEvent
  });
}
