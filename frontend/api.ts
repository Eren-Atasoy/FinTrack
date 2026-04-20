import { FinancialState, Transaction, Asset, Goal, User } from './types';
import { initialData } from './mockData';

// In a real Next.js app, this would be a Prisma/Drizzle client connecting to a real SQLite/PostgreSQL database.
// Since this is a browser sandbox, we simulate the SQLite database using localStorage to persist data across reloads.
const DB_KEY = 'fintrack_sqlite_db_v2';
const USERS_KEY = 'fintrack_users_v1';
const AUTH_TOKEN_KEY = 'fintrack_auth_token_v1';

// Simulate network latency for realism
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- Auth Endpoints ---

export const getCurrentUser = async (): Promise<User | null> => {
  await delay(400);
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!token) return null;
  
  const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  const user = users.find((u: any) => u.id === token);
  return user ? { id: user.id, name: user.name, email: user.email } : null;
};

export const login = async (email: string, password: string): Promise<User> => {
  await delay(600);
  const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  const user = users.find((u: any) => u.email === email && u.password === password);
  
  if (!user) {
    throw new Error('E-posta veya şifre hatalı.');
  }
  
  localStorage.setItem(AUTH_TOKEN_KEY, user.id);
  return { id: user.id, name: user.name, email: user.email };
};

export const register = async (name: string, email: string, password: string): Promise<User> => {
  await delay(600);
  const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  
  if (users.some((u: any) => u.email === email)) {
    throw new Error('Bu e-posta adresi zaten kullanımda.');
  }
  
  const newUser = {
    id: Math.random().toString(36).substr(2, 9),
    name,
    email,
    password // In a real app, this would be hashed!
  };
  
  users.push(newUser);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  localStorage.setItem(AUTH_TOKEN_KEY, newUser.id);
  
  // Initialize empty financial state for new user
  const userDbKey = `${DB_KEY}_${newUser.id}`;
  localStorage.setItem(userDbKey, JSON.stringify({ transactions: [], assets: [{ id: generateId(), name: 'Nakit Varlıklar', value: 0, type: 'Cash' }], goals: [] }));
  
  return { id: newUser.id, name: newUser.name, email: newUser.email };
};

export const logout = async (): Promise<void> => {
  await delay(300);
  localStorage.removeItem(AUTH_TOKEN_KEY);
};

// --- Financial Data Endpoints ---

// Initialize or get DB for current user
const getDb = (): FinancialState => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!token) throw new Error("Unauthorized");
  
  const userDbKey = `${DB_KEY}_${token}`;
  const data = localStorage.getItem(userDbKey);
  
  if (data) {
    return JSON.parse(data);
  }
  
  // If it's the first time (e.g. demo user), seed with initial data
  localStorage.setItem(userDbKey, JSON.stringify(initialData));
  return initialData;
};

const saveDb = (data: FinancialState) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!token) throw new Error("Unauthorized");
  const userDbKey = `${DB_KEY}_${token}`;
  localStorage.setItem(userDbKey, JSON.stringify(data));
};

const generateId = () => Math.random().toString(36).substr(2, 9);

export const fetchFinancialState = async (): Promise<FinancialState> => {
  await delay(600); // Simulate loading
  return getDb();
};

// Transactions
export const createTransaction = async (tx: Omit<Transaction, 'id'>): Promise<Transaction> => {
  await delay(300);
  const db = getDb();
  const newTx = { ...tx, id: generateId() };
  db.transactions = [newTx, ...db.transactions];
  saveDb(db);
  return newTx;
};

export const createTransactionsBulk = async (txs: Omit<Transaction, 'id'>[]): Promise<Transaction[]> => {
  await delay(500);
  const db = getDb();
  const newTxs = txs.map(tx => ({ ...tx, id: generateId() }));
  db.transactions = [...newTxs, ...db.transactions];
  saveDb(db);
  return newTxs;
};

export const deleteTransaction = async (id: string): Promise<void> => {
  await delay(300);
  const db = getDb();
  db.transactions = db.transactions.filter(t => t.id !== id);
  saveDb(db);
};

// Assets
export const createAsset = async (asset: Omit<Asset, 'id'>): Promise<Asset> => {
  await delay(300);
  const db = getDb();
  const newAsset = { ...asset, id: generateId() };
  db.assets = [...db.assets, newAsset];
  saveDb(db);
  return newAsset;
};

export const updateAsset = async (id: string, updates: Partial<Asset>): Promise<Asset> => {
  await delay(300);
  const db = getDb();
  const assetIndex = db.assets.findIndex(a => a.id === id);
  if (assetIndex > -1) {
    db.assets[assetIndex] = { ...db.assets[assetIndex], ...updates };
    saveDb(db);
    return db.assets[assetIndex];
  }
  throw new Error("Asset not found");
};

export const deleteAsset = async (id: string): Promise<void> => {
  await delay(300);
  const db = getDb();
  db.assets = db.assets.filter(a => a.id !== id);
  saveDb(db);
};

// Goals
export const createGoal = async (goal: Omit<Goal, 'id'>): Promise<Goal> => {
  await delay(300);
  const db = getDb();
  const newGoal = { ...goal, id: generateId() };
  db.goals = [...db.goals, newGoal];
  saveDb(db);
  return newGoal;
};

export const updateGoal = async (id: string, updates: Partial<Goal>): Promise<Goal> => {
  await delay(300);
  const db = getDb();
  const goalIndex = db.goals.findIndex(g => g.id === id);
  if (goalIndex > -1) {
    db.goals[goalIndex] = { ...db.goals[goalIndex], ...updates };
    saveDb(db);
    return db.goals[goalIndex];
  }
  throw new Error("Goal not found");
};

export const deleteGoal = async (id: string): Promise<void> => {
  await delay(300);
  const db = getDb();
  db.goals = db.goals.filter(g => g.id !== id);
  saveDb(db);
};
