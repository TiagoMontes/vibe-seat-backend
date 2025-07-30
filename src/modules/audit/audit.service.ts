import { prisma } from '@/lib/prisma';
import { timezoneUtils } from '@/config/timezone';
import type { AuditAction } from '@prisma/client';
import type {
  AuditLogData,
  AuditMetadata,
  CreateAuditLogParams,
  AuditContext,
} from './types';

export const auditService = {
  /**
   * Cria um log de auditoria
   */
  log: async (params: CreateAuditLogParams): Promise<void> => {
    try {
      const changes = params.oldValues && params.newValues 
        ? auditService.extractChanges(params.oldValues, params.newValues)
        : undefined;

      console.log(`🔍 [AUDIT] Creating log: ${params.action} on ${params.tableName}:${params.recordId} by user ${params.userId}`);

      await prisma.auditLog.create({
        data: {
          tableName: params.tableName,
          recordId: String(params.recordId),
          action: params.action,
          userId: params.userId,
          oldValues: params.oldValues,
          newValues: params.newValues,
          changes,
          metadata: params.metadata,
        },
      });

      console.log(`✅ [AUDIT] Log created successfully for ${params.action} on ${params.tableName}:${params.recordId}`);
    } catch (error) {
      console.error(`❌ [AUDIT] Error creating log for ${params.action} on ${params.tableName}:${params.recordId}:`, error);
      // Não falhar a operação principal se a auditoria falhar
    }
  },

  /**
   * Log para CREATE operations
   */
  logCreate: async (
    tableName: string,
    recordId: string | number,
    newValues: Record<string, any>,
    context?: AuditContext
  ): Promise<void> => {
    await auditService.log({
      tableName,
      recordId,
      action: 'CREATE',
      userId: context?.userId,
      newValues: auditService.sanitizeValues(newValues),
      metadata: auditService.buildMetadata(context),
    });
  },

  /**
   * Log para UPDATE operations
   */
  logUpdate: async (
    tableName: string,
    recordId: string | number,
    oldValues: Record<string, any>,
    newValues: Record<string, any>,
    context?: AuditContext
  ): Promise<void> => {
    await auditService.log({
      tableName,
      recordId,
      action: 'UPDATE',
      userId: context?.userId,
      oldValues: auditService.sanitizeValues(oldValues),
      newValues: auditService.sanitizeValues(newValues),
      metadata: auditService.buildMetadata(context),
    });
  },

  /**
   * Log para DELETE operations
   */
  logDelete: async (
    tableName: string,
    recordId: string | number,
    oldValues: Record<string, any>,
    context?: AuditContext
  ): Promise<void> => {
    await auditService.log({
      tableName,
      recordId,
      action: 'DELETE',
      userId: context?.userId,
      oldValues: auditService.sanitizeValues(oldValues),
      metadata: auditService.buildMetadata(context),
    });
  },

  /**
   * Log para STATUS_CHANGE operations
   */
  logStatusChange: async (
    tableName: string,
    recordId: string | number,
    oldStatus: string,
    newStatus: string,
    context?: AuditContext,
    additionalData?: Record<string, any>
  ): Promise<void> => {
    const oldValues = { status: oldStatus, ...additionalData };
    const newValues = { status: newStatus, ...additionalData };

    await auditService.log({
      tableName,
      recordId,
      action: 'STATUS_CHANGE',
      userId: context?.userId,
      oldValues,
      newValues,
      metadata: auditService.buildMetadata(context),
    });
  },

  /**
   * Extrai apenas os campos que foram alterados
   */
  extractChanges: (
    oldValues: Record<string, any>,
    newValues: Record<string, any>
  ): Record<string, any> => {
    const changes: Record<string, any> = {};

    // Verificar campos novos ou alterados
    for (const [key, newValue] of Object.entries(newValues)) {
      const oldValue = oldValues[key];
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes[key] = {
          from: oldValue,
          to: newValue,
        };
      }
    }

    // Verificar campos removidos
    for (const [key, oldValue] of Object.entries(oldValues)) {
      if (!(key in newValues)) {
        changes[key] = {
          from: oldValue,
          to: null,
        };
      }
    }

    return changes;
  },

  /**
   * Remove campos sensíveis dos valores
   */
  sanitizeValues: (values: Record<string, any>): Record<string, any> => {
    const sensitiveFields = ['password', 'token', 'secret', 'key'];
    const sanitized = { ...values };

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    // Remove campos de timestamp que são redundantes
    delete sanitized.createdAt;
    delete sanitized.updatedAt;
    delete sanitized.deletedAt;

    return sanitized;
  },

  /**
   * Constrói metadata do contexto
   */
  buildMetadata: (context?: AuditContext): AuditMetadata => {
    return {
      ip: context?.ip,
      userAgent: context?.userAgent,
      route: context?.route,
      method: context?.method,
      timestamp: timezoneUtils.now(), // Usar timezone local do Acre
    };
  },

  /**
   * Busca logs de auditoria por tabela e registro
   */
  getLogsByRecord: async (tableName: string, recordId: string | number) => {
    return await prisma.auditLog.findMany({
      where: {
        tableName,
        recordId: String(recordId),
        deletedAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  },

  /**
   * Busca logs de auditoria por usuário
   */
  getLogsByUser: async (userId: number, limit: number = 50) => {
    return await prisma.auditLog.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  },

  /**
   * Busca logs de auditoria por ação
   */
  getLogsByAction: async (action: AuditAction, limit: number = 50) => {
    return await prisma.auditLog.findMany({
      where: {
        action,
        deletedAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  },
};