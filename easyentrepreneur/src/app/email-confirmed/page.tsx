'use client'

export default function EmailConfirmedPage() {
  return (
    <div style={{ textAlign: 'center', marginTop: '80px', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#1e40af' }}>Adresse email confirmée ✅</h1>
      <p style={{ marginTop: '10px' }}>Merci d’avoir confirmé votre adresse email.</p>
      <p>Vous pouvez maintenant vous connecter à votre compte.</p>

      <a href="/auth/login" className="ctaButton" style={{ marginTop: '24px' }}>
        Se connecter
      </a>

      <style jsx>{`
        .ctaButton {
          background: linear-gradient(135deg, #FF6B00 0%, #FFB347 100%);
          color: white;
          padding: 0.75rem 1.75rem;
          font-size: 1rem;
          border-radius: 12px;
          font-weight: 500;
          transition: all 0.3s ease;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
          text-decoration: none;
          display: inline-block;
          cursor: pointer;
        }

        .ctaButton:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px rgba(239, 108, 0, 0.4);
        }
      `}</style>
    </div>
  );
}
