import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthenticatedRequest } from '../middlewares/authenticateToken';

export const getUserInfo = async (req: AuthenticatedRequest, res: Response) => {
  const userId = (req as AuthenticatedRequest).user?.userId;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        lastname: true,
        email: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    return res.json({ user });
  } catch (error) {
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};
