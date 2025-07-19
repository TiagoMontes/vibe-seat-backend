import type { Request, Response } from 'express';
import { prisma } from '@/lib/prisma';
import { authService } from './auth.service';

export const authController = {
  login: async (req: Request, res: Response) => {
    const { username, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { username },
      include: { role: true },
    });

    if (!user || user.status !== 'approved') {
      return res.status(401).json({ error: 'Credenciais inválidas ou não aprovadas' });
    }

    const passwordMatch = await Bun.password.verify(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Senha incorreta' });
    }

    const token = authService.generateToken({
      id: user.id,
      username: user.username,
      role: user.role.name,
    });

    res.json({ token });
  },
};