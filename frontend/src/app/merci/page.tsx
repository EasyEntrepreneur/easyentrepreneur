export default function MerciPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f9fafb] px-4">
      <div className="bg-white shadow-xl rounded-2xl p-8 max-w-md w-full text-center">
        {/* Icône de validation */}
        <div className="flex justify-center mb-6">
          <svg className="h-16 w-16 text-green-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Message de succès */}
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Paiement confirmé !</h1>
        <p className="text-gray-600 mb-6">
          Merci pour votre achat 🧾 <br />
          Votre abonnement est maintenant actif.
        </p>

        {/* Bouton retour */}
        <a
          href="/"
          className="inline-block bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold py-2 px-6 rounded-xl hover:opacity-90 transition"
        >
          Retour à l’accueil
        </a>
      </div>
    </div>
  );
}
