    'use client';

import Link from 'next/link';

export default function EmailConfirmed() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white to-blue-50 p-4">
      <div className="bg-white shadow-lg rounded-2xl p-8 max-w-md text-center">
        <h1 className="text-2xl font-bold text-green-600 mb-2">✅ Email confirmé avec succès</h1>
        <p className="text-gray-600 mb-6">
          Votre adresse email a été validée. Vous pouvez maintenant accéder à votre espace personnel.
        </p>
        <Link href="/dashboard">
          <span className="inline-block bg-blue-600 hover:bg-blue-700 transition text-white font-semibold py-2 px-6 rounded-full">
            Accéder à mon compte
          </span>
        </Link>
      </div>
    </main>
  );
}
