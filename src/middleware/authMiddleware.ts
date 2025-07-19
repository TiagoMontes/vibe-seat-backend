import type { Request, Response, NextFunction } from 'express';
import { authService } from '@/modules/auth/auth.service';

export function authenticateJWT(req: Request, res: Response, next: NextFunction) {
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