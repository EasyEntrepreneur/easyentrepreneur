import { Request, Response } from 'express';
import prisma from '../lib/prisma'; // ✅ Correct : import default
import bcrypt from 'bcryptjs';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';

export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(401).json({ message: 'Utilisateur non trouvé' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Mot de passe invalide' });
    }

    const jwtSecret: Secret = process.env.JWT_SECRET || 'fallback_secret';
    const expiresIn = (process.env.JWT_EXPIRES_IN || '7d') as `${number}${'d' | 'h' | 'm' | 's'}`;
    const signOptions: SignOptions = { expiresIn };

    const token = jwt.sign(
      { userId: user.id },
      jwtSecret,
      signOptions
    );

    res.json({
      message: 'Connexion réussie',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name ?? '',
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
