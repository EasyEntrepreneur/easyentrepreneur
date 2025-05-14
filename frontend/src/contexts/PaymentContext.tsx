'use client';

import { createContext, useState, useContext, ReactNode } from 'react';

type PaymentContextType = {
  paymentMethodId: string | null;
  setPaymentMethodId: (id: string | null) => void;
};

export const PaymentContext = createContext<PaymentContextType>({
  paymentMethodId: null,
  setPaymentMethodId: () => {},
});

export const PaymentProvider = ({ children }: { children: ReactNode }) => {
  const [paymentMethodId, setPaymentMethodId] = useState<string | null>(null);

  return (
    <PaymentContext.Provider value={{ paymentMethodId, setPaymentMethodId }}>
      {children}
    </PaymentContext.Provider>
  );
};

export const usePayment = () => useContext(PaymentContext);
