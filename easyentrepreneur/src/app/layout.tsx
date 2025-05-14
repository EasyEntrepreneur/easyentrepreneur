// src/app/layout.tsx
import './globals.css';
import { Inter } from 'next/font/google';
import { Providers } from '../components/Providers';
import StripeWrapper from '../components/StripeWrapper';
import { PaymentProvider } from '../contexts/PaymentContext'; // ✅ Import context

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'EasyEntrepreneur',
  description: 'Assistant IA des micro-entrepreneurs',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <Providers>
          <PaymentProvider> {/* ✅ Fournit paymentMethodId dans tout le site */}
            <StripeWrapper>
              {children}
            </StripeWrapper>
          </PaymentProvider>
        </Providers>
      </body>
    </html>
  );
}
