// functions/api/lib/audit.js
// Audit Log Writer

import { nowISO } from './db.js';
import { generateId } from './auth.js';

/**
 * Write an audit log entry to D1.
 * @param {D1Database} db
 * @param {object} opts
 */
export async function writeAudit(db, {
  userId    = null,
  username  = null,
  action,           // 'login'|'logout'|'create'|'update'|'delete'|'restore'|'backup'|'import'
  resource,         // 'transaction'|'account'|'category'|'user'|'system'
  resourceId = null,
  ip         = null,
  ua         = null,
  oldData    = null,
  newData    = null,
}) {
  try {
    const id  = generateId();
    const now = nowISO();
    await db.prepare(
      `INSERT INTO audit_logs (id, user_id, username, action, resource, resource_id, ip_address, user_agent, old_data, new_data, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      userId,
      username,
      action,
      resource,
      resourceId,
      ip,
      ua,
      oldData ? JSON.stringify(oldData) : null,
      newData ? JSON.stringify(newData) : null,
      now
    ).run();
  } catch (e) {
    // Audit log should never crash the main request
    console.error('[Audit] Failed to write log:', e.message);
  }
}

/**
 * Extract request info for audit logging.
 */
export function requestInfo(request) {
  return {
    ip: request.headers.get('CF-Connecting-IP') || request.headers.get('X-Real-IP') || '',
    ua: request.headers.get('User-Agent') || '',
  };
}
