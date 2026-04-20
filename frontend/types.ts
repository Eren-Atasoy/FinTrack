export type TransactionType = 'income' | 'expense';

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  category: string;
  type: TransactionType;
  description: string;
}

export interface Asset {
  id: string;
  name: string;
  value: number;
  type: 'Stock' | 'Fund' | 'Crypto' | 'Gold' | 'Cash' | 'Other';
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string; // YYYY-MM-DD
}

export interface FinancialState {
  transactions: Transaction[];
  assets: Asset[];
  goals: Goal[];
}

export interface ParsedTransaction {
  date: string;
  original_description: string;
  clean_description: string;
  category: string;
  amount: number;
  type: TransactionType | 'investment';
  isDuplicate?: boolean;
  selected?: boolean;
}

export interface AIParseResult {
  confidence_score: number;
  transactions: ParsedTransaction[];
}
