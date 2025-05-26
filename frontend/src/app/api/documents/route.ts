import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// POST /api/documents
export async function POST(request: NextRequest) {
  try {
    const {
      nomEntreprise,
      adresseEntreprise,
      siretEntreprise,
      nomClient,
      adresseClient,
      objetPrestation,
      montantPrestation,
      dateFacture,
    } = await request.json();

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

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // ou "gpt-4" si tu as l'accès
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1000,
      temperature: 0.2,
    });

    const generatedDocument = completion.choices[0].message.content;
    return NextResponse.json({ document: generatedDocument });
  } catch (error: any) {
    console.error("❌ Erreur GPT :", error.response?.data || error.message || error);
    return NextResponse.json(
      { error: "Erreur génération du document" },
      { status: 500 }
    );
  }
}
