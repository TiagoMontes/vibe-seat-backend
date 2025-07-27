import type { Request, Response, NextFunction } from 'express';
import { authService } from '@/modules/auth/auth.service';

export function authenticateJWT(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token não fornecido.' });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token não fornecido.' });
  }

  try {
    const decoded = authService.verifyToken(token);
    (req as any).user = decoded;

    return next();
  } catch {
    return res.status(403).json({ message: 'Token inválido ou expirado.' });
  }
}

// Role hierarchy: user < attendant < admin
const ROLE_HIERARCHY = {
  user: 1,
  attendant: 2,
  admin: 3,
};

// Check if user has minimum required role level
function hasMinimumRole(userRole: string, requiredRole: string): boolean {
  const userLevel =
    ROLE_HIERARCHY[userRole as keyof typeof ROLE_HIERARCHY] || 0;
  const requiredLevel =
    ROLE_HIERARCHY[requiredRole as keyof typeof ROLE_HIERARCHY] || 999;
  return userLevel >= requiredLevel;
}

// Generic role middleware
export function requireRole(minimumRole: 'user' | 'attendant' | 'admin') {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }

    if (!hasMinimumRole(user.role, minimumRole)) {
      return res.status(403).json({
        message: `Acesso negado. Permissão mínima requerida: ${minimumRole}`,
      });
    }

    next();
  };
}

// Specific role middleware
export const requireUser = requireRole('user');
export const requireAttendant = requireRole('attendant');
export const requireAdmin = requireRole('admin');

// Legacy support
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  return requireAdmin(req, res, next);
}

// Check if user is approved
export function requireApproved(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = (req as any).user;

  if (user?.status !== 'approved') {
    return res.status(403).json({
      message: 'Acesso negado. Usuário não aprovado.',
    });
  }

  next();
}

// Allow users to update their own data or admins to update any user
export function requireOwnershipOrAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = (req as any).user;
  const targetUserId = parseInt(req.params.id || '0');

  if (!user) {
    return res.status(401).json({ message: 'Usuário não autenticado' });
  }

  // Admins can update any user
  if (hasMinimumRole(user.role, 'admin')) {
    return next();
  }

  // Users can only update their own data
  if (user.id === targetUserId) {
    return next();
  }

  return res.status(403).json({
    message: 'Acesso negado. Você só pode atualizar seus próprios dados.',
  });
}
