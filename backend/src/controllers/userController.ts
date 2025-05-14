import { Response } from 'express';
import prisma from '../lib/prisma'; // ✅ Correct : import default
import { AuthenticatedRequest } from '../middlewares/authenticateToken';

export const getUserProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Utilisateur non authentifié' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        documents: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name ?? '',
        currentPlan: user.currentPlan,
        documents: user.documents,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
