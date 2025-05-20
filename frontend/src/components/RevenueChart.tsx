'use client';

import { useState, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, parseISO, isWithinInterval } from 'date-fns';

type InvoiceStatus = 'PAYEE' | 'EN_ATTENTE' | 'ANNULE';

type Invoice = {
  totalTTC: number;
  statut: InvoiceStatus;
  issuedAt: string; // ISO
  clientName: string;
};

type Props = {
  invoices: Invoice[];
};

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  PAYEE: "Payée",
  EN_ATTENTE: "En attente",
  ANNULE: "Annulée"
};

const STATUS_COLORS: Record<'ALL' | InvoiceStatus, { stroke: string; fill: string }> = {
  ALL:    { stroke: "#3b82f6", fill: "#c7e0ff" }, // Bleu
  PAYEE:  { stroke: "#22c55e", fill: "#b9f5c5" }, // Vert
  EN_ATTENTE: { stroke: "#fbbf24", fill: "#fde68a" }, // Jaune
  ANNULE: { stroke: "#ef4444", fill: "#fecaca" }, // Rouge
};

const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

export default function RevenueChart({ invoices }: Props) {
  // ---- Filtres
  const currentYear = new Date().getFullYear();
  const [startDate, setStartDate] = useState<string>(`${currentYear}-01-01`);
  const [endDate, setEndDate] = useState<string>(`${currentYear}-12-31`);
  const [status, setStatus] = useState<'ALL' | InvoiceStatus>('ALL');
  const [client, setClient] = useState<string>('ALL');

  // Liste unique des clients présents
  const clients = useMemo(() => {
    const names = invoices.map(inv => inv.clientName).filter(Boolean);
    const unique = Array.from(new Set(names));
    return unique.sort((a, b) => a.localeCompare(b, 'fr'));
  }, [invoices]);

  // ---- Données à afficher
  const data = useMemo(() => {
    const months: Record<number, number> = {};
    for (let i = 0; i < 12; i++) months[i] = 0;

    invoices.forEach(inv => {
      if (!inv.issuedAt) return;
      if (client !== 'ALL' && inv.clientName !== client) return;
      if (status !== 'ALL' && inv.statut !== status) return;

      const date = parseISO(inv.issuedAt);
      if (
        isWithinInterval(date, {
          start: parseISO(startDate),
          end: parseISO(endDate)
        })
      ) {
        const monthIdx = date.getMonth();
        months[monthIdx] += inv.totalTTC ?? 0;
      }
    });

    return Array.from({ length: 12 }, (_, i) => ({
      month: MONTHS_FR[i],
      montant: months[i]
    }));
  }, [invoices, startDate, endDate, status, client]);

  // Couleur selon statut
  const chartColor = STATUS_COLORS[status];

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
          <option value="PAYEE">Payée</option>
          <option value="EN_ATTENTE">En attente</option>
          <option value="ANNULE">Annulée</option>
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
        <AreaChart data={data}>
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
