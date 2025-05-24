// frontend/src/app/checkout/page.tsx

import { Suspense } from 'react';
import CheckoutClient from './CheckoutClient';

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <CheckoutClient />
    </Suspense>
  );
}
