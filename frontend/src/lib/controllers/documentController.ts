import dotenv from 'dotenv';
dotenv.config();

import { Request, Response } from 'express';
import OpenAI from 'openai';

console.log("OPENAI_API_KEY (depuis controller) :", process.env.OPENAI_API_KEY); // Vérification

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const generateDocument = async (req: Request, res: Response) => {
  const {
    nomEntreprise,
    adresseEntreprise,
    siretEntreprise,
    nomClient,
    adresseClient,
    objetPrestation,
    montantPrestation,
    dateFacture
  } = req.body;

  const prompt = `
Crée une facture professionnelle claire pour auto-entrepreneur français :
- Nom entreprise : ${nomEntreprise}
- Adresse entreprise : ${adresseEntreprise}
- Numéro SIRET : ${siretEntreprise}
- Client : ${nomClient}
- Adresse client : ${adresseClient}
- Objet : ${objetPrestation}
- Montant : ${montantPrestation} €
- Date : ${dateFacture}

Mention obligatoire : "TVA non applicable, art. 293 B du CGI".
Structure le contenu proprement, sans superflu, dans un format texte.
`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // Tu peux tester avec 'gpt-4' si ta clé y a accès
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1000,
      temperature: 0.2
    });

    const generatedDocument = completion.choices[0].message.content;
    res.status(200).json({ document: generatedDocument });
  } catch (error: any) {
    console.error("❌ Erreur GPT :", error.response?.data || error.message || error);
    res.status(500).json({ error: "Erreur génération du document" });
  }
};
