'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const data = [
  { mois: 'Janv', montant: 1200 },
  { mois: 'Fév', montant: 1800 },
  { mois: 'Mars', montant: 2600 },
  { mois: 'Avril', montant: 2200 },
  { mois: 'Mai', montant: 2800 }
];

export default function RevenueChart() {
  return (
    <div style={{ width: '100%', height: 300 }}>
      <h2 style={{ marginBottom: '1rem' }}>Évolution du chiffre d’affaire</h2>
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="mois" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="montant" stroke="#3b82f6" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
