import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

export const authService = {
  generateToken: (user: { id: number; username: string; role: string }) => {
    return jwt.sign(
      {
        sub: user.id,
        username: user.username,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: '1d' }
    );
  },

  verifyToken: (token: string) => {
    return jwt.verify(token, JWT_SECRET);
  },
};
