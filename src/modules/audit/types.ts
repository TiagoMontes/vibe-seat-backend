import type { AuditAction } from '@prisma/client';

export interface AuditLogData {
  tableName: string;
  recordId: string;
  action: AuditAction;
  userId?: number;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  changes?: Record<string, any>;
  metadata?: AuditMetadata;
}

export interface AuditMetadata {
  ip?: string;
  userAgent?: string;
  route?: string;
  method?: string;
  timestamp?: Date;
  [key: string]: any;
}

export interface AuditEntry {
  id: number;
  tableName: string;
  recordId: string;
  action: AuditAction;
  userId?: number;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  changes?: Record<string, any>;
  metadata?: AuditMetadata;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface AuditContext {
  userId?: number;
  ip?: string;
  userAgent?: string;
  route?: string;
  method?: string;
}

export interface AuditableChange {
  field: string;
  oldValue: any;
  newValue: any;
}

export interface CreateAuditLogParams {
  tableName: string;
  recordId: string | number;
  action: AuditAction;
  userId?: number;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  metadata?: AuditMetadata;
}