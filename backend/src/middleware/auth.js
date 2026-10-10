// Demo Authentication & Role Enforcement Middleware for FabricTrace
// Strictly adheres to Role Permissions defined in Specification Page 3:
// - Quality Inspector: Create inspections, lookup rolls, view history. MUST NOT dispatch, modify costs or delete history.
// - Owner / Accounts Manager: View alerts, orders, trends, costs, audits, manage alerts and costs. MUST NOT alter inspection outcomes.
// - Dispatch Officer: Validate and execute dispatch.

export function authMiddleware(req, res, next) {
  // Extract role from header or query param for easy demo switching
  const roleHeader = req.headers['x-actor-role'] || req.query.demo_role || 'QUALITY_INSPECTOR';
  const idHeader = req.headers['x-actor-id'] || 'inspector_alex';
  const nameHeader = req.headers['x-actor-name'] || 'Alex Kumar';

  req.actor = {
    id: idHeader,
    role: roleHeader.toUpperCase(),
    name: nameHeader
  };

  next();
}

export function requireRole(allowedRoles) {
  return (req, res, next) => {
    const role = req.actor?.role;
    if (!role || !allowedRoles.includes(role)) {
      return res.status(403).json({
        error: "FORBIDDEN",
        message: `Action not permitted for role '${role}'. Required role: ${allowedRoles.join(' or ')}.`
      });
    }
    next();
  };
}
