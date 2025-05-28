// src/utils/uploadPdfToSupabase.ts
import { supabase } from "@/lib/supabaseAdmin"

export async function uploadPdfToSupabase(buffer: Buffer, filePath: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('invoices') // nom du bucket
    .upload(filePath, buffer, {
      contentType: 'application/pdf',
      upsert: true, // écrase si déjà existant
    })
  if (error) {
    console.error("Erreur upload Supabase:", error)
    return null
  }
  // On récupère l’URL publique (adapter selon bucket privé/public)
  const url = `${process.env.SUPABASE_URL}/storage/v1/object/public/invoices/${filePath}`
  return url
}
