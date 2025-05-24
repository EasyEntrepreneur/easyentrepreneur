// app/dashboard/context/PlanContext.tsx
'use client';

import { createContext, useContext } from 'react';
import { currentPlan } from '@prisma/client';

const PlanContext = createContext<currentPlan | null>(null);

export const PlanProvider = ({
  plan,
  children,
}: {
  plan: currentPlan;
  children: React.ReactNode;
}) => {
  return <PlanContext.Provider value={plan}>{children}</PlanContext.Provider>;
};

export const usePlan = () => {
  const context = useContext(PlanContext);
  if (!context) throw new Error('usePlan must be used within PlanProvider');
  return context;
};
