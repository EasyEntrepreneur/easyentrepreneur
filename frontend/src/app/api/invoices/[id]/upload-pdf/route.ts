import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js"; // ou autre stockage

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const formData = await req.formData();
  const file = formData.get('pdf') as Blob;
  if (!file) return new Response("Aucun fichier", { status: 400 });

  // Ex : upload vers Supabase Storage (ou S3)
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
  const { data, error } = await supabase.storage
    .from('invoices')
    .upload(`invoices/${params.id}.pdf`, file, { upsert: true });

  if (error) return new Response("Upload failed", { status: 500 });

  const publicUrl = supabase.storage.from('invoices').getPublicUrl(`invoices/${params.id}.pdf`).data.publicUrl;

  // Mise à jour de la facture
  await prisma.invoice.update({
    where: { id: params.id },
    data: { pdfUrl: publicUrl },
  });

  return new Response(JSON.stringify({ url: publicUrl }), { status: 200 });
}
