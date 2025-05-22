'use client';

import { useState, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { parseISO, isWithinInterval } from 'date-fns';

// Statuts factures
type InvoiceStatus = 'PAYEE' | 'EN_ATTENTE' | 'ANNULE';
// Statuts devis
type QuoteStatus = 'ACCEPTE' | 'EN_ATTENTE' | 'REFUSE';

// Union des deux types pour le composant
type Statut = InvoiceStatus | QuoteStatus;

type InvoiceOrQuote = {
  totalTTC: number;
  statut: Statut;
  issuedAt: string; // ISO
  clientName: string;
};

type Props = {
  data: InvoiceOrQuote[]; // Données à afficher
  type: "facture" | "devis"; // Pour adapter les labels et statuts
};

const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

const STATUS_CONFIG = {
  facture: {
    STATUS_LABELS: {
      PAYEE: "Payée",
      EN_ATTENTE: "En attente",
      ANNULE: "Annulée"
    },
    STATUS_COLORS: {
      ALL:    { stroke: "#3b82f6", fill: "#c7e0ff" },
      PAYEE:  { stroke: "#22c55e", fill: "#b9f5c5" },
      EN_ATTENTE: { stroke: "#fbbf24", fill: "#fde68a" },
      ANNULE: { stroke: "#ef4444", fill: "#fecaca" }
    },
    STATUS_VALUES: [
      { value: "PAYEE", label: "Payée" },
      { value: "EN_ATTENTE", label: "En attente" },
      { value: "ANNULE", label: "Annulée" }
    ],
    defaultStatus: "PAYEE" as Statut,
    chartLabel: "Chiffre d'affaires"
  },
  devis: {
    STATUS_LABELS: {
      ACCEPTE: "Accepté",
      EN_ATTENTE: "En attente",
      REFUSE: "Refusé"
    },
    STATUS_COLORS: {
      ALL:    { stroke: "#3b82f6", fill: "#c7e0ff" },
      ACCEPTE:  { stroke: "#22c55e", fill: "#b9f5c5" },
      EN_ATTENTE: { stroke: "#fbbf24", fill: "#fde68a" },
      REFUSE: { stroke: "#ef4444", fill: "#fecaca" }
    },
    STATUS_VALUES: [
      { value: "ACCEPTE", label: "Accepté" },
      { value: "EN_ATTENTE", label: "En attente" },
      { value: "REFUSE", label: "Refusé" }
    ],
    defaultStatus: "ACCEPTE" as Statut,
    chartLabel: "Total devis acceptés"
  }
};

export default function RevenueChart({ data, type }: Props) {
  const config = STATUS_CONFIG[type];

  const currentYear = new Date().getFullYear();
  const [startDate, setStartDate] = useState<string>(`${currentYear}-01-01`);
  const [endDate, setEndDate] = useState<string>(`${currentYear}-12-31`);
  const [status, setStatus] = useState<'ALL' | Statut>('ALL');
  const [client, setClient] = useState<string>('ALL');

  // Liste unique des clients présents
  const clients = useMemo(() => {
    const names = data.map(inv => inv.clientName).filter(Boolean);
    const unique = Array.from(new Set(names));
    return unique.sort((a, b) => a.localeCompare(b, 'fr'));
  }, [data]);

  // ---- Données à afficher
  const chartData = useMemo(() => {
    const months: Record<number, number> = {};
    for (let i = 0; i < 12; i++) months[i] = 0;

    data.forEach(item => {
      if (!item.issuedAt) return;
      if (client !== 'ALL' && item.clientName !== client) return;
      if (status !== 'ALL' && item.statut !== status) return;

      const date = parseISO(item.issuedAt);
      if (
        isWithinInterval(date, {
          start: parseISO(startDate),
          end: parseISO(endDate)
        })
      ) {
        const monthIdx = date.getMonth();
        months[monthIdx] += item.totalTTC ?? 0;
      }
    });

    return Array.from({ length: 12 }, (_, i) => ({
      month: MONTHS_FR[i],
      montant: months[i]
    }));
  }, [data, startDate, endDate, status, client]);

  // Couleur selon statut
  const chartColor = config.STATUS_COLORS[status as keyof typeof config.STATUS_COLORS] ?? config.STATUS_COLORS.ALL;

  return (
    <div style={{ width: '100%', background: 'white', borderRadius: 16, boxShadow: '0 2px 16px #0001', padding: 24, margin: '32px 0' }}>
      <div style={{
        display: 'flex', gap: 16, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap',
        fontWeight: 500, fontSize: 16
      }}>
        <span>Période :</span>
        <input
          type="date"
          value={startDate}
          max={endDate}
          onChange={e => setStartDate(e.target.value)}
          style={{
            padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 15, fontWeight: 500, background: "#f4f8ff"
          }}
        />
        <span>au</span>
        <input
          type="date"
          value={endDate}
          min={startDate}
          onChange={e => setEndDate(e.target.value)}
          style={{
            padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 15, fontWeight: 500, background: "#f4f8ff"
          }}
        />
        <span style={{ marginLeft: 24 }}>Statut :</span>
        <select
          value={status}
          onChange={e => setStatus(e.target.value as any)}
          style={{
            padding: "8px 14px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 15, fontWeight: 500, background: "#f4f8ff", color: "#374151"
          }}
        >
          <option value="ALL">Tous</option>
          {config.STATUS_VALUES.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <span style={{ marginLeft: 24 }}>Client :</span>
        <select
          value={client}
          onChange={e => setClient(e.target.value)}
          style={{
            padding: "8px 14px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 15, fontWeight: 500, background: "#f4f8ff", color: "#374151"
          }}
        >
          <option value="ALL">Tous</option>
          {clients.map(name =>
            <option key={name} value={name}>{name}</option>
          )}
        </select>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 15, fontWeight: 500, fill: "#547ef2" }}
            interval={0}
          />
          <YAxis tickFormatter={v => `${v} €`} />
          <Tooltip formatter={v => `${v} €`} />
          <Area
            type="monotone"
            dataKey="montant"
            stroke={chartColor.stroke}
            fill={chartColor.fill}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
