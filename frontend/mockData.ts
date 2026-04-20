import { FinancialState } from './types';

const today = new Date();
const getPastDate = (daysAgo: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

export const initialData: FinancialState = {
  transactions: [
    { id: 't1', date: '2023-12-22', amount: 50000, category: 'Diğer Gider', type: 'expense', description: 'Transfer Azaltımı' },
    { id: 't2', date: '2023-12-18', amount: 1200, category: 'Yatırım', type: 'expense', description: 'Eğlence Bütçesi Kesintisi' },
    { id: 't3', date: '2023-12-18', amount: 1200, category: 'Diğer Gider', type: 'expense', description: 'Otopilot Transferi' },
    { id: 't4', date: '2023-12-15', amount: 3500, category: 'Market', type: 'expense', description: 'Süpermarket Alışverişi' },
    { id: 't5', date: '2023-12-10', amount: 32000, category: 'Maaş', type: 'income', description: 'Aylık Maaş' },
  ],
  assets: [
    { id: 'a1', name: 'Yerli Hisse Senetleri', value: 245125, type: 'Stock' },
    { id: 'a2', name: 'Yatırım Fonları', value: 196100, type: 'Fund' },
    { id: 'a3', name: 'Yabancı Hisse Senetleri', value: 147075, type: 'Stock' },
    { id: 'a4', name: 'Altın', value: 147075, type: 'Gold' },
    { id: 'a5', name: 'Gayrimenkul', value: 147075, type: 'Other' },
    { id: 'a6', name: 'Kripto Para', value: 98050, type: 'Crypto' },
    { id: 'a7', name: 'Nakit Varlıklar', value: 45000, type: 'Cash' },
  ],
  goals: [
    { id: 'g1', name: 'Araba Al', targetAmount: 250000, currentAmount: 187500, deadline: '2026-12-31' },
    { id: 'g2', name: 'Yatırım Fonları', targetAmount: 150000, currentAmount: 45000, deadline: '2026-12-31' },
    { id: 'g3', name: 'Yurtdışı Tatili', targetAmount: 150000, currentAmount: 82500, deadline: '2026-12-31' },
    { id: 'g4', name: 'Ev Peşinatı', targetAmount: 150000, currentAmount: 112500, deadline: '2026-12-31' },
  ]
};

// Static chart data to match the visual exactly
export const trendData = [
  { name: '1A', income: 13000, expense: 5000 },
  { name: '2A', income: 11000, expense: 8000 },
  { name: '3A', income: 18000, expense: 6000 },
  { name: '4A', income: 14000, expense: 10000 },
  { name: '5A', income: 16000, expense: 8000 },
  { name: '6A', income: 22000, expense: 12000 },
];
