import type { Request } from 'express';
import type { AuditContext } from './types';

/**
 * Extrai contexto de auditoria do request Express
 */
export function extractAuditContext(req: Request): AuditContext {
  const user = (req as any).user;
  
  return {
    userId: user?.id,
    ip: req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] as string,
    userAgent: req.headers['user-agent'],
    route: req.route?.path || req.path,
    method: req.method,
  };
}