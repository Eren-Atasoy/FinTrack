import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  CreditCard, 
  TrendingUp, 
  Target, 
  Lightbulb,
  FileText,
  Settings,
  Bell,
  MoreVertical,
  Car,
  Globe,
  Home,
  BrainCircuit,
  Search,
  Filter,
  LogOut,
  Activity,
  Menu,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Mail,
  Lock,
  User as UserIcon,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import * as XLSX from 'xlsx';
import { trendData } from './mockData';
import { FinancialState, Transaction, Asset, Goal, TransactionType, User, ParsedTransaction } from './types';
import { getFinancialAdvice, analyzeBankStatement } from './aiService';
import { 
  fetchFinancialState, 
  createTransaction, 
  createTransactionsBulk,
  deleteTransaction as apiDeleteTransaction,
  createAsset,
  updateAsset as apiUpdateAsset,
  deleteAsset as apiDeleteAsset,
  createGoal,
  updateGoal as apiUpdateGoal,
  deleteGoal as apiDeleteGoal,
  login,
  register,
  logout as apiLogout,
  getCurrentUser
} from './api';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Select, Label, Badge } from './components';

// --- Helper Components & Functions ---
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(amount);
};

const Sparkline: React.FC<{ data: number[], color: string }> = ({ data, color }) => {
  const chartData = data.map((val, i) => ({ index: i, value: val }));
  return (
    <div className="h-12 w-full mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const navItems = [
  { name: 'Panel', icon: LayoutDashboard },
  { name: 'İşlemler', icon: CreditCard },
  { name: 'Veri Aktarımı', icon: UploadCloud },
  { name: 'Yatırımlar', icon: TrendingUp },
  { name: 'Hedefler', icon: Target },
  { name: 'Yapay Zeka Danışmanı', icon: Lightbulb },
  { name: 'Raporlar', icon: FileText },
  { name: 'Ayarlar', icon: Settings },
];

const EXPENSE_CATEGORIES = ['Market', 'Fatura', 'Kira', 'Abonelik', 'Eğlence', 'Ulaşım', 'Sağlık', 'Dışarıda Yemek', 'Eğitim', 'Diğer Gider'];
const INCOME_CATEGORIES = ['Maaş', 'Serbest Çalışma', 'Kira Geliri', 'Diğer Gelir'];
const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES, 'Hisse Senedi', 'Yatırım Fonu', 'Kripto', 'Döviz/Altın', 'Kendi Hesabına Transfer'];

// --- Auth View Component ---
const AuthView: React.FC<{ onLogin: (user: User) => void }> = ({ onLogin }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      let user;
      if (isLoginMode) {
        user = await login(email, password);
      } else {
        user = await register(name, email, password);
      }
      onLogin(user);
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 selection:bg-primary/30">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
      <Card className="w-full max-w-md border-primary/20 shadow-2xl shadow-primary/10 relative z-10 bg-card/95 backdrop-blur">
        <CardHeader className="space-y-2 text-center pb-6 pt-8">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
            <Activity className="w-7 h-7 text-primary-foreground" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight text-slate-100">FinTrack AI</CardTitle>
          <p className="text-sm text-muted-foreground">
            {isLoginMode ? 'Hesabınıza giriş yapın' : 'Yeni bir hesap oluşturun'}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-md text-center">
                {error}
              </div>
            )}
            
            {!isLoginMode && (
              <div className="space-y-2">
                <Label>Ad Soyad</Label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    type="text" 
                    placeholder="Ad Soyad" 
                    className="pl-9" 
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required 
                  />
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label>E-posta</Label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  type="email" 
                  placeholder="ornek@eposta.com" 
                  className="pl-9" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required 
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Şifre</Label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  className="pl-9" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required 
                />
              </div>
            </div>

            <Button type="submit" className="w-full mt-6 h-10 text-base" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLoginMode ? 'Giriş Yap' : 'Kayıt Ol')}
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm text-muted-foreground">
            {isLoginMode ? 'Hesabınız yok mu? ' : 'Zaten hesabınız var mı? '}
            <button 
              type="button" 
              onClick={() => { setIsLoginMode(!isLoginMode); setError(''); }}
              className="text-primary hover:underline font-medium"
            >
              {isLoginMode ? 'Kayıt Olun' : 'Giriş Yapın'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// --- Main App Component ---
export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  const [activeNav, setActiveNav] = useState('Panel');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [state, setState] = useState<FinancialState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Check auth status on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error("Auth check failed", error);
      } finally {
        setIsAuthLoading(false);
      }
    };
    initAuth();
  }, []);

  // Fetch financial data when user is authenticated
  useEffect(() => {
    if (!user) return;
    
    const loadData = async () => {
      setIsLoading(true);
      try {
        const data = await fetchFinancialState();
        setState(data);
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [user]);

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- Derived State ---
  const totalBalance = useMemo(() => {
    if (!state) return 0;
    const income = state.transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expense = state.transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    return income - expense;
  }, [state]);

  const monthlyNetFlow = useMemo(() => {
    if (!state) return 0;
    const income = state.transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expense = state.transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    return income - expense;
  }, [state]);

  const totalInvestments = useMemo(() => {
    if (!state) return 0;
    return state.assets.reduce((acc, a) => acc + a.value, 0);
  }, [state]);

  // Available cash is Total Income - Total Expense - Total Allocated to Goals
  const availableCash = useMemo(() => {
    if (!state) return 0;
    const income = state.transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expense = state.transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const allocatedToGoals = state.goals.reduce((acc, g) => acc + g.currentAmount, 0);
    
    return Math.max(0, income - expense - allocatedToGoals);
  }, [state]);

  // --- Async Handlers ---
  const handleAddTransaction = async (tx: Omit<Transaction, 'id'>) => {
    const newTx = await createTransaction(tx);
    setState(prev => prev ? { ...prev, transactions: [newTx, ...prev.transactions] } : prev);
  };

  const handleBulkAddTransactions = async (txs: Omit<Transaction, 'id'>[]) => {
    const newTxs = await createTransactionsBulk(txs);
    setState(prev => prev ? { ...prev, transactions: [...newTxs, ...prev.transactions] } : prev);
  };

  const handleDeleteTransaction = async (id: string) => {
    await apiDeleteTransaction(id);
    setState(prev => prev ? { ...prev, transactions: prev.transactions.filter(t => t.id !== id) } : prev);
  };

  const handleAddAsset = async (asset: Omit<Asset, 'id'>) => {
    const newAsset = await createAsset(asset);
    setState(prev => prev ? { ...prev, assets: [...prev.assets, newAsset] } : prev);
  };

  const handleDeleteAsset = async (id: string) => {
    await apiDeleteAsset(id);
    setState(prev => prev ? { ...prev, assets: prev.assets.filter(a => a.id !== id) } : prev);
  };

  const handleAddGoal = async (goal: Omit<Goal, 'id'>) => {
    const newGoal = await createGoal(goal);
    setState(prev => prev ? { ...prev, goals: [...prev.goals, newGoal] } : prev);
  };

  const handleUpdateGoal = async (id: string, updates: Partial<Goal>) => {
    const updatedGoal = await apiUpdateGoal(id, updates);
    setState(prev => prev ? { ...prev, goals: prev.goals.map(g => g.id === id ? updatedGoal : g) } : prev);
  };

  const handleDeleteGoal = async (id: string) => {
    await apiDeleteGoal(id);
    setState(prev => prev ? { ...prev, goals: prev.goals.filter(g => g.id !== id) } : prev);
  };

  const handleLogout = async () => {
    await apiLogout();
    setUser(null);
    setState(null);
  };

  // --- Render Loading or Auth ---
  if (isAuthLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-primary">
        <Loader2 className="w-12 h-12 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthView onLogin={setUser} />;
  }

  // --- Render Content Switcher ---
  const renderContent = () => {
    if (isLoading || !state) {
      return (
        <div className="flex flex-col items-center justify-center h-[80vh] text-primary">
          <Loader2 className="w-12 h-12 animate-spin mb-4" />
          <p className="text-slate-300 font-medium">Veriler Yükleniyor...</p>
        </div>
      );
    }

    switch (activeNav) {
      case 'Panel':
        return <DashboardView state={state} totalBalance={totalBalance} monthlyNetFlow={monthlyNetFlow} totalInvestments={totalInvestments} />;
      case 'İşlemler':
        return <TransactionsView transactions={state.transactions} onAdd={handleAddTransaction} onDelete={handleDeleteTransaction} />;
      case 'Veri Aktarımı':
        return <ImportView existingTransactions={state.transactions} onBulkAdd={handleBulkAddTransactions} onComplete={() => setActiveNav('İşlemler')} />;
      case 'Yatırımlar':
        return <InvestmentsView assets={state.assets} onAdd={handleAddAsset} onDelete={handleDeleteAsset} />;
      case 'Hedefler':
        return <GoalsView goals={state.goals} availableCash={availableCash} onAdd={handleAddGoal} onUpdate={handleUpdateGoal} onDelete={handleDeleteGoal} />;
      case 'Yapay Zeka Danışmanı':
        return <AdvisorView state={state} />;
      case 'Raporlar':
      case 'Ayarlar':
        return (
          <div className="flex flex-col items-center justify-center h-[80vh] text-muted-foreground">
            <Settings className="w-16 h-16 mb-4 opacity-20" />
            <h2 className="text-2xl font-semibold">{activeNav}</h2>
            <p>Bu modül yapım aşamasındadır.</p>
          </div>
        );
      default:
        return <DashboardView state={state} totalBalance={totalBalance} monthlyNetFlow={monthlyNetFlow} totalInvestments={totalInvestments} />;
    }
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans selection:bg-primary/30">
      
      {/* Collapsible Left Sidebar */}
      <aside 
        className={`${isSidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300 ease-in-out border-r border-border bg-card flex flex-col py-6 z-20 relative`}
      >
        {/* Toggle Button */}
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-8 bg-slate-800 border border-border rounded-full p-1 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors z-30"
        >
          {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        <div className={`flex items-center gap-3 px-6 mb-8 ${!isSidebarOpen && 'justify-center px-0'}`}>
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
            <Activity className="w-5 h-5 text-primary-foreground" />
          </div>
          {isSidebarOpen && <span className="text-lg font-bold text-slate-100 tracking-wide whitespace-nowrap overflow-hidden">FinTrack AI</span>}
        </div>
        
        <nav className="flex flex-col gap-2 flex-1 px-3">
          {navItems.map((item) => (
            <button
              key={item.name}
              onClick={() => setActiveNav(item.name)}
              title={!isSidebarOpen ? item.name : undefined}
              className={`flex items-center gap-3 py-3 rounded-lg transition-colors ${isSidebarOpen ? 'px-4' : 'justify-center px-0'} ${
                activeNav === item.name 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-muted-foreground hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {isSidebarOpen && <span className="font-medium text-sm whitespace-nowrap overflow-hidden">{item.name}</span>}
            </button>
          ))}
        </nav>

        <div className="px-3 mt-auto">
          <button 
            onClick={handleLogout}
            title={!isSidebarOpen ? "Çıkış Yap" : undefined}
            className={`flex items-center gap-3 py-3 w-full rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors ${isSidebarOpen ? 'px-4' : 'justify-center px-0'}`}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {isSidebarOpen && <span className="font-medium text-sm whitespace-nowrap overflow-hidden">Çıkış Yap</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header Navigation */}
        <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center px-6 justify-between z-10">
          <div className="flex items-center gap-4">
            {!isSidebarOpen && (
              <button onClick={() => setIsSidebarOpen(true)} className="md:hidden text-slate-300 hover:text-white">
                <Menu className="w-6 h-6" />
              </button>
            )}
            <h1 className="text-xl font-semibold text-slate-100">{activeNav}</h1>
          </div>
          
          <div className="flex items-center gap-4">
            
            {/* Notifications Dropdown */}
            <div className="relative" ref={notificationRef}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-muted-foreground hover:text-slate-200 hover:bg-slate-800 rounded-full transition-colors"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full border-2 border-background"></span>
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-50">
                  <div className="p-4 border-b border-border flex justify-between items-center bg-slate-800/50">
                    <h3 className="font-semibold text-slate-100">Bildirimler</h3>
                    <Badge className="bg-primary/20 text-primary border-primary/30">2 Yeni</Badge>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    <div className="p-4 border-b border-border/50 hover:bg-slate-800/30 transition-colors cursor-pointer">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-primary/10 rounded-full text-primary mt-0.5"><Target className="w-4 h-4" /></div>
                        <div>
                          <p className="text-sm font-medium text-slate-200">Hedefe Çok Yaklaştınız!</p>
                          <p className="text-xs text-muted-foreground mt-1">"Araba Al" hedefinizin %75'ini tamamladınız. Tebrikler!</p>
                          <p className="text-[10px] text-slate-500 mt-2">2 saat önce</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 hover:bg-slate-800/30 transition-colors cursor-pointer">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-secondary/20 rounded-full text-secondary-foreground mt-0.5"><BrainCircuit className="w-4 h-4" /></div>
                        <div>
                          <p className="text-sm font-medium text-slate-200">Yeni AI Önerisi</p>
                          <p className="text-xs text-muted-foreground mt-1">Haftalık finansal aksiyon planınız hazır. İncelemek için tıklayın.</p>
                          <p className="text-[10px] text-slate-500 mt-2">5 saat önce</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 border-t border-border text-center bg-slate-800/30">
                    <button 
                      onClick={() => setShowNotifications(false)}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      Tümünü Okundu İşaretle
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pl-4 border-l border-border">
              <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center text-primary font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-sm hidden sm:block">
                <p className="font-medium leading-none text-slate-200">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-[1600px] mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}

// --- Sub-Views ---

const DashboardView: React.FC<{ state: FinancialState, totalBalance: number, monthlyNetFlow: number, totalInvestments: number }> = ({ state, totalBalance, monthlyNetFlow, totalInvestments }) => {
  const netWorthData = [10, 12, 11, 15, 14, 18, 22, 20, 25, 28];
  const portfolioData = [5, 6, 8, 7, 10, 12, 11, 14, 16, 18];

  const donutColors = ['#2dd4bf', '#3b82f6', '#10b981', '#eab308', '#f97316', '#8b5cf6'];
  const donutData = useMemo(() => {
    const grouped = state.assets.reduce((acc, asset) => {
      acc[asset.type] = (acc[asset.type] || 0) + asset.value;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(grouped).map(([name, value], i) => ({ name, value, color: donutColors[i % donutColors.length] }));
  }, [state.assets]);

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* --- ROW 1: KPIs --- */}
      <Card className="col-span-12 md:col-span-6 lg:col-span-3 glow-primary">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Toplam Net Varlık</CardTitle>
          <MoreVertical className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-slate-100">{formatCurrency(totalBalance + totalInvestments)}</div>
          <p className="text-xs text-primary mt-1">Bu ay +3.1%</p>
          <Sparkline data={netWorthData} color="#2dd4bf" />
        </CardContent>
      </Card>

      <Card className="col-span-12 md:col-span-6 lg:col-span-3">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Aylık Nakit Akışı</CardTitle>
          <MoreVertical className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-slate-100">{formatCurrency(monthlyNetFlow)} <span className="text-sm font-normal text-muted-foreground">Net</span></div>
          <div className="flex items-end gap-4 mt-4 h-12">
            <div className="flex flex-col items-center gap-1">
              <div className="w-8 bg-primary rounded-t-sm" style={{ height: '40px' }}></div>
              <span className="text-[10px] text-muted-foreground">Gelir</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-8 bg-secondary rounded-t-sm" style={{ height: '20px' }}></div>
              <span className="text-[10px] text-muted-foreground">Gider</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-12 md:col-span-6 lg:col-span-3">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Yatırım Portföyü</CardTitle>
          <MoreVertical className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-slate-100">{formatCurrency(totalInvestments)} <span className="text-sm font-normal text-muted-foreground">Toplam</span></div>
          <p className="text-xs text-primary mt-1">Yılbaşından beri +5.2%</p>
          <Sparkline data={portfolioData} color="#10b981" />
        </CardContent>
      </Card>

      <Card className="col-span-12 md:col-span-6 lg:col-span-3">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Aktif Hedefler</CardTitle>
          <MoreVertical className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-slate-100 mb-4">{state.goals.length} Hedef</div>
          <div className="flex gap-4 overflow-hidden">
            {state.goals.slice(0, 3).map((goal, i) => {
              const progress = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
              const color = donutColors[i % donutColors.length];
              return (
                <div key={goal.id} className="relative w-12 h-12 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#2a3441" strokeWidth="3" />
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={color} strokeWidth="3" strokeDasharray={`${progress}, 100`} />
                  </svg>
                  <span className="absolute text-xs font-medium">{i+1}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* --- ROW 2 & 3: Main Grid --- */}
      <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-8 gap-6">
          {/* Area Chart */}
          <Card className="col-span-1 md:col-span-5">
            <CardHeader className="flex flex-row items-center justify-between pb-0">
              <CardTitle>6 Aylık Gelir ve Gider Trendi</CardTitle>
              <div className="flex bg-slate-800/50 rounded-md p-1">
                {['1A', '3A', '6A', '1Y'].map(tf => (
                  <button key={tf} className={`px-3 py-1 text-xs rounded-sm ${tf === '6A' ? 'bg-slate-700 text-slate-100' : 'text-muted-foreground hover:text-slate-300'}`}>
                    {tf}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="h-[280px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#fb923c" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#fb923c" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a3441" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₺${value/1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e2532', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)' }}
                    itemStyle={{ color: '#f8fafc', fontSize: '12px' }}
                    labelStyle={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}
                  />
                  <Area type="monotone" dataKey="income" stroke="#2dd4bf" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" name="Toplam Gelir" />
                  <Area type="monotone" dataKey="expense" stroke="#fb923c" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" name="Toplam Gider" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Donut Chart */}
          <Card className="col-span-1 md:col-span-3">
            <CardHeader className="flex flex-row items-center justify-between pb-0">
              <CardTitle>Varlık Dağılımı</CardTitle>
              <MoreVertical className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center h-[300px]">
              {donutData.length > 0 ? (
                <>
                  <div className="h-[180px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={donutData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                          stroke="none"
                        >
                          {donutData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-xs text-muted-foreground">Varlık</span>
                      <span className="text-xs font-medium">Dağılımı</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-2 mt-4 w-full px-2">
                    {donutData.map((item, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[10px] text-slate-300">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                        <span className="truncate">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Henüz varlık eklenmedi.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions Table */}
        <Card className="flex-1">
          <CardHeader className="flex flex-row items-center justify-between py-4 border-b border-border">
            <CardTitle>Son İşlemler</CardTitle>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="h-8 text-xs gap-2 border-slate-700">
                <Filter className="w-3 h-3" /> Filtrele
              </Button>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground border-b border-border bg-slate-800/20">
                <tr>
                  <th className="px-6 py-3 font-medium">Tarih</th>
                  <th className="px-6 py-3 font-medium">Açıklama</th>
                  <th className="px-6 py-3 font-medium">Kategori</th>
                  <th className="px-6 py-3 font-medium text-right">Tutar</th>
                </tr>
              </thead>
              <tbody>
                {state.transactions.slice(0, 5).map((tx) => (
                  <tr key={tx.id} className="border-b border-border/50 hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-3 text-slate-300">{tx.date}</td>
                    <td className="px-6 py-3 text-slate-200">{tx.description}</td>
                    <td className="px-6 py-3 text-slate-400">{tx.category}</td>
                    <td className={`px-6 py-3 font-medium text-right ${tx.type === 'income' ? 'text-primary' : 'text-secondary'}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </td>
                  </tr>
                ))}
                {state.transactions.length === 0 && (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">İşlem bulunamadı.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Right Column (Span 4) */}
      <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
        {/* Goal Tracker */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle>Hedef Takibi</CardTitle>
            <MoreVertical className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-5">
            {state.goals.slice(0, 4).map((goal, i) => {
              const progress = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
              const colorClass = i % 2 === 0 ? 'bg-primary' : 'bg-secondary';
              return (
                <div key={goal.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-800 rounded-md">
                        <Target className="w-4 h-4 text-slate-300" />
                      </div>
                      <span className="text-sm font-medium text-slate-200">{goal.name}</span>
                    </div>
                    <span className="text-sm font-bold">{progress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${colorClass}`} style={{ width: `${progress}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Hedef: {formatCurrency(goal.targetAmount)}</span>
                    <span>Bitiş: {goal.deadline}</span>
                  </div>
                </div>
              );
            })}
            {state.goals.length === 0 && <p className="text-sm text-muted-foreground">Aktif hedef yok.</p>}
          </CardContent>
        </Card>

        {/* AI Financial Advisor Preview */}
        <Card className="flex-1 border-primary/20 bg-gradient-to-b from-card to-slate-800/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Yapay Zeka Danışman</CardTitle>
            <BrainCircuit className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent className="pt-4">
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-800 relative">
              <h5 className="text-sm font-medium text-slate-100 mb-2">Haftalık Aksiyon Planı:</h5>
              <p className="text-xs text-slate-300 mb-3">Finansal özgürlük için optimize ediliyor...</p>
              <ol className="text-xs text-slate-400 space-y-2 list-decimal pl-4 marker:text-slate-500">
                <li>Bu hafta "Eğlence" kategorisini ₺1.200 azaltın.</li>
                <li>₺1.200'yi "Yatırım" hesabınıza yönlendirin.</li>
              </ol>
              <div className="mt-4 flex justify-end">
                <Button variant="outline" className="h-7 text-xs bg-slate-100 text-slate-900 hover:bg-white hover:text-black border-0">
                  Tüm Tavsiyeleri Gör
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// --- Import View ---
const ImportView: React.FC<{ 
  existingTransactions: Transaction[], 
  onBulkAdd: (txs: Omit<Transaction, 'id'>[]) => Promise<void>,
  onComplete: () => void
}> = ({ existingTransactions, onBulkAdd, onComplete }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedTransaction[] | null>(null);
  const [error, setError] = useState('');

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFile = async (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setError('Lütfen sadece Excel (.xlsx, .xls) dosyası yükleyin.');
      return;
    }
    
    setError('');
    setIsProcessing(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convert to CSV for the AI prompt (it's token-efficient)
      const csvString = XLSX.utils.sheet_to_csv(worksheet);
      
      // Limit rows to avoid token limits for demo
      const rows = csvString.split('\n').slice(0, 20).join('\n');
      
      const aiResult = await analyzeBankStatement(rows);
      
      // Check for duplicates
      const processedTxs = aiResult.transactions.map(tx => {
        const isDuplicate = existingTransactions.some(et => 
          et.date === tx.date && 
          et.amount === tx.amount && 
          (et.description === tx.clean_description || et.description === tx.original_description)
        );
        return { ...tx, isDuplicate, selected: !isDuplicate };
      });
      
      setParsedData(processedTxs);
    } catch (err: any) {
      setError(err.message || 'Dosya işlenirken bir hata oluştu.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleCategoryChange = (index: number, newCategory: string) => {
    if (!parsedData) return;
    const newData = [...parsedData];
    newData[index].category = newCategory;
    setParsedData(newData);
  };

  const handleToggleSelect = (index: number) => {
    if (!parsedData) return;
    const newData = [...parsedData];
    newData[index].selected = !newData[index].selected;
    setParsedData(newData);
  };

  const handleSaveAll = async () => {
    if (!parsedData) return;
    setIsProcessing(true);
    
    const txsToSave = parsedData
      .filter(tx => tx.selected)
      .map(tx => ({
        date: tx.date,
        amount: tx.amount,
        category: tx.category,
        type: tx.type === 'investment' ? 'expense' : tx.type, // Map investment to expense for cash flow
        description: tx.clean_description
      }));
      
    try {
      await onBulkAdd(txsToSave);
      onComplete();
    } catch (err) {
      setError('Kaydetme sırasında hata oluştu.');
      setIsProcessing(false);
    }
  };

  if (parsedData) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-100">Önizleme ve Onay</h2>
            <p className="text-sm text-muted-foreground mt-1">Yapay zeka tarafından kategorize edilen işlemleri inceleyin.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setParsedData(null)}>İptal</Button>
            <Button onClick={handleSaveAll} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              Seçilileri Kaydet
            </Button>
          </div>
        </div>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-slate-800/50 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-center w-12">
                    <input 
                      type="checkbox" 
                      checked={parsedData.every(tx => tx.selected)}
                      onChange={(e) => setParsedData(parsedData.map(tx => ({ ...tx, selected: e.target.checked })))}
                      className="rounded border-slate-600 bg-slate-800 text-primary focus:ring-primary"
                    />
                  </th>
                  <th className="px-6 py-3 font-medium">Tarih</th>
                  <th className="px-6 py-3 font-medium">Orijinal Açıklama</th>
                  <th className="px-6 py-3 font-medium">Temiz Açıklama</th>
                  <th className="px-6 py-3 font-medium">Kategori</th>
                  <th className="px-6 py-3 font-medium text-right">Tutar</th>
                </tr>
              </thead>
              <tbody>
                {parsedData.map((tx, i) => (
                  <tr key={i} className={`border-b border-border/50 transition-colors ${tx.isDuplicate ? 'bg-destructive/5' : 'hover:bg-slate-800/30'}`}>
                    <td className="px-4 py-3 text-center">
                      <input 
                        type="checkbox" 
                        checked={tx.selected}
                        onChange={() => handleToggleSelect(i)}
                        className="rounded border-slate-600 bg-slate-800 text-primary focus:ring-primary"
                      />
                    </td>
                    <td className="px-6 py-3 text-slate-300 whitespace-nowrap">{tx.date}</td>
                    <td className="px-6 py-3 text-xs text-muted-foreground max-w-[200px] truncate" title={tx.original_description}>
                      {tx.original_description}
                    </td>
                    <td className="px-6 py-3 font-medium text-slate-200">{tx.clean_description}</td>
                    <td className="px-6 py-3">
                      <Select 
                        value={tx.category} 
                        onChange={(e) => handleCategoryChange(i, e.target.value)}
                        className="h-8 text-xs py-1"
                      >
                        {ALL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </Select>
                    </td>
                    <td className={`px-6 py-3 font-medium text-right whitespace-nowrap ${tx.type === 'income' ? 'text-primary' : 'text-secondary'}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto mt-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-100">Banka Özeti İçe Aktar</h2>
        <p className="text-sm text-muted-foreground mt-1">Excel formatındaki banka dökümünüzü yükleyin, yapay zeka otomatik kategorize etsin.</p>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div 
        className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200 ${
          isDragging ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-slate-500 hover:bg-slate-800/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isProcessing ? (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-2">
              <BrainCircuit className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <h3 className="text-lg font-semibold text-slate-200">Yapay Zeka Analiz Ediyor...</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              İşlemleriniz temizleniyor, kolonlar eşleştiriliyor ve kategoriler belirleniyor. Lütfen bekleyin.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-2">
              <FileSpreadsheet className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-200">Excel Dosyanızı Sürükleyin</h3>
            <p className="text-sm text-muted-foreground">veya bilgisayarınızdan seçmek için tıklayın (.xlsx, .xls)</p>
            
            <label className="mt-4 cursor-pointer">
              <Button type="button" variant="outline" className="pointer-events-none">
                Dosya Seç
              </Button>
              <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileInput} />
            </label>
          </div>
        )}
      </div>
      
      <Card className="bg-slate-800/30 border-slate-700/50">
        <CardContent className="p-4 text-sm text-muted-foreground">
          <strong className="text-slate-300">Not:</strong> Güvenliğiniz için verileriniz sadece tarayıcınızda işlenir ve yapay zeka analizi için anonimleştirilerek gönderilir.
        </CardContent>
      </Card>
    </div>
  );
};

// --- Transactions View ---
const TransactionsView: React.FC<{ transactions: Transaction[], onAdd: (tx: Omit<Transaction, 'id'>) => void, onDelete: (id: string) => void }> = ({ transactions, onAdd, onDelete }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ date: new Date().toISOString().split('T')[0], amount: '', category: 'Market', type: 'expense' as TransactionType, description: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || isNaN(Number(formData.amount))) return;
    setIsSubmitting(true);
    await onAdd({ ...formData, amount: Number(formData.amount) });
    setIsSubmitting(false);
    setIsAdding(false);
    setFormData({ ...formData, amount: '', description: '' });
  };

  const categories = formData.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-100">İşlem Geçmişi</h2>
        <Button onClick={() => setIsAdding(!isAdding)}>
          <Plus className="w-4 h-4 mr-2" /> Yeni İşlem
        </Button>
      </div>

      {isAdding && (
        <Card className="border-primary/50">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
              <div className="space-y-2">
                <Label>Tarih</Label>
                <Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Tür</Label>
                <Select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as TransactionType, category: e.target.value === 'expense' ? EXPENSE_CATEGORIES[0] : INCOME_CATEGORIES[0]})}>
                  <option value="expense">Gider</option>
                  <option value="income">Gelir</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Açıklama</Label>
                <Input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Örn. Süpermarket alışverişi" />
              </div>
              <div className="space-y-2">
                <Label>Tutar (₺)</Label>
                <Input type="number" step="0.01" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} placeholder="0.00" required />
              </div>
              <div className="md:col-span-6 flex justify-end gap-2 mt-2">
                <Button type="button" variant="ghost" onClick={() => setIsAdding(false)} disabled={isSubmitting}>İptal</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Kaydet'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-slate-800/50 border-b border-border">
              <tr>
                <th className="px-6 py-4">Tarih</th>
                <th className="px-6 py-4">Açıklama</th>
                <th className="px-6 py-4">Kategori</th>
                <th className="px-6 py-4 text-right">Tutar</th>
                <th className="px-6 py-4 text-center">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-b border-border/50 hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 text-slate-300">{tx.date}</td>
                  <td className="px-6 py-4 font-medium text-slate-200">{tx.description}</td>
                  <td className="px-6 py-4">
                    <Badge className="bg-slate-800 text-slate-300 border-slate-700 font-normal">{tx.category}</Badge>
                  </td>
                  <td className={`px-6 py-4 text-right font-bold ${tx.type === 'income' ? 'text-primary' : 'text-secondary'}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => onDelete(tx.id)} className="text-muted-foreground hover:text-destructive transition-colors p-2">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">Henüz işlem bulunmuyor.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// --- Investments View ---
const InvestmentsView: React.FC<{ assets: Asset[], onAdd: (asset: Omit<Asset, 'id'>) => void, onDelete: (id: string) => void }> = ({ assets, onAdd, onDelete }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', value: '', type: 'Fund' as Asset['type'] });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.value || isNaN(Number(formData.value))) return;
    setIsSubmitting(true);
    await onAdd({ ...formData, value: Number(formData.value) });
    setIsSubmitting(false);
    setIsAdding(false);
    setFormData({ name: '', value: '', type: 'Fund' });
  };

  const donutColors = ['#2dd4bf', '#3b82f6', '#10b981', '#eab308', '#f97316', '#8b5cf6'];
  const pieData = useMemo(() => {
    const grouped = assets.reduce((acc, asset) => {
      acc[asset.type] = (acc[asset.type] || 0) + asset.value;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(grouped).map(([name, value], i) => ({ name, value, color: donutColors[i % donutColors.length] }));
  }, [assets]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-100">Yatırım Portföyü</h2>
        <Button onClick={() => setIsAdding(!isAdding)}>
          <Plus className="w-4 h-4 mr-2" /> Varlık Ekle
        </Button>
      </div>

      {isAdding && (
        <Card className="border-primary/50">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="space-y-2">
                <Label>Varlık Adı</Label>
                <Input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Örn. X Hisse Senedi" required />
              </div>
              <div className="space-y-2">
                <Label>Tür</Label>
                <Select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as Asset['type']})}>
                  <option value="Stock">Hisse Senedi</option>
                  <option value="Fund">Yatırım Fonu</option>
                  <option value="Crypto">Kripto Para</option>
                  <option value="Gold">Altın / Değerli Maden</option>
                  <option value="Cash">Nakit</option>
                  <option value="Other">Diğer</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Güncel Değer (₺)</Label>
                <Input type="number" step="0.01" value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} placeholder="0.00" required />
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <Button type="button" variant="ghost" onClick={() => setIsAdding(false)} disabled={isSubmitting}>İptal</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Kaydet'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Varlık Listesi</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-slate-800/50 border-y border-border">
                <tr>
                  <th className="px-6 py-4">İsim</th>
                  <th className="px-6 py-4">Tür</th>
                  <th className="px-6 py-4 text-right">Değer</th>
                  <th className="px-6 py-4 text-center">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset) => (
                  <tr key={asset.id} className="border-b border-border/50 hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-200">{asset.name}</td>
                    <td className="px-6 py-4"><Badge className="bg-slate-800 text-slate-300 border-slate-700 font-normal">{asset.type}</Badge></td>
                    <td className="px-6 py-4 text-right font-bold text-slate-100">{formatCurrency(asset.value)}</td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => onDelete(asset.id)} className="text-muted-foreground hover:text-destructive transition-colors p-2">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {assets.length === 0 && (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">Varlık bulunamadı.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Dağılım</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ backgroundColor: '#1e2532', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
                    itemStyle={{ color: '#f8fafc' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm">Dağılımı görmek için varlık ekleyin.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// --- Goals View ---
const GoalsView: React.FC<{ 
  goals: Goal[], 
  availableCash: number,
  onAdd: (goal: Omit<Goal, 'id'>) => void, 
  onUpdate: (id: string, updates: Partial<Goal>) => void, 
  onDelete: (id: string) => void 
}> = ({ goals, availableCash, onAdd, onUpdate, onDelete }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ name: '', targetAmount: '', currentAmount: '0', deadline: '' });
  
  const [addFundsId, setAddFundsId] = useState<string | null>(null);
  const [fundAmount, setFundAmount] = useState('');

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const target = Number(formData.targetAmount);
    const current = Number(formData.currentAmount);

    if (!formData.name || isNaN(target) || isNaN(current) || !formData.deadline) {
      setError('Lütfen tüm alanları eksiksiz doldurun.');
      return;
    }

    if (current > availableCash) {
      setError(`Mevcut birikim, kullanılabilir nakit varlığınızı (${formatCurrency(availableCash)}) aşamaz.`);
      return;
    }

    if (current > target) {
      setError('Mevcut birikim, hedef tutardan büyük olamaz.');
      return;
    }

    if (formData.deadline < minDate) {
      setError('Bitiş tarihi en erken yarın olabilir.');
      return;
    }

    setIsSubmitting(true);
    await onAdd({ 
      name: formData.name, 
      targetAmount: target, 
      currentAmount: current, 
      deadline: formData.deadline 
    });
    setIsSubmitting(false);
    setIsAdding(false);
    setFormData({ name: '', targetAmount: '', currentAmount: '0', deadline: '' });
  };

  const handleAddFunds = async (goal: Goal) => {
    const amount = Number(fundAmount);
    if (!isNaN(amount) && amount > 0) {
      if (amount > availableCash) {
        alert(`Yetersiz nakit varlığı! Maksimum ekleyebileceğiniz tutar: ${formatCurrency(availableCash)}`);
        return;
      }
      if (goal.currentAmount + amount > goal.targetAmount) {
        alert(`Eklenen tutar hedefi aşıyor! Maksimum ekleyebileceğiniz tutar: ${formatCurrency(goal.targetAmount - goal.currentAmount)}`);
        return;
      }
      await onUpdate(goal.id, { currentAmount: goal.currentAmount + amount });
      setAddFundsId(null);
      setFundAmount('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-100">Finansal Hedefler</h2>
        <Button onClick={() => { setIsAdding(!isAdding); setError(''); }}>
          <Plus className="w-4 h-4 mr-2" /> Hedef Ekle
        </Button>
      </div>

      {isAdding && (
        <Card className="border-primary/50">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
              {error && (
                <div className="md:col-span-5 p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-md">
                  {error}
                </div>
              )}
              <div className="space-y-2 md:col-span-2">
                <Label>Hedef Adı</Label>
                <Input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Örn. Ev Peşinatı" required />
              </div>
              <div className="space-y-2">
                <Label>Hedef Tutar (₺)</Label>
                <Input type="number" step="0.01" min="1" value={formData.targetAmount} onChange={e => setFormData({...formData, targetAmount: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Mevcut Birikim (₺)</Label>
                <Input type="number" step="0.01" min="0" max={availableCash} value={formData.currentAmount} onChange={e => setFormData({...formData, currentAmount: e.target.value})} required />
                <p className="text-[10px] text-muted-foreground mt-1">Maks: {formatCurrency(availableCash)}</p>
              </div>
              <div className="space-y-2">
                <Label>Bitiş Tarihi</Label>
                <Input type="date" min={minDate} value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} required />
              </div>
              <div className="md:col-span-5 flex justify-end gap-2 mt-2">
                <Button type="button" variant="ghost" onClick={() => { setIsAdding(false); setError(''); }} disabled={isSubmitting}>İptal</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Kaydet'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {goals.map((goal, i) => {
          const progress = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
          const colorClass = i % 2 === 0 ? 'bg-primary' : 'bg-secondary';
          return (
            <Card key={goal.id} className="relative overflow-hidden group">
              <button 
                onClick={() => onDelete(goal.id)} 
                className="absolute top-4 right-4 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <CardHeader>
                <CardTitle className="pr-6">{goal.name}</CardTitle>
                <p className="text-xs text-muted-foreground">Bitiş: {goal.deadline}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-end">
                  <div className="text-3xl font-bold text-slate-100">{progress}%</div>
                  <div className="text-xs text-muted-foreground text-right">
                    {formatCurrency(goal.currentAmount)} <br/> / {formatCurrency(goal.targetAmount)}
                  </div>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${colorClass} transition-all duration-1000 ease-out`} 
                    style={{ width: `${progress}%` }}
                  />
                </div>
                
                {/* Add Funds Section */}
                {addFundsId === goal.id ? (
                  <div className="flex flex-col gap-2 pt-2">
                    <div className="text-[10px] text-muted-foreground flex justify-between">
                      <span>Kullanılabilir Nakit:</span>
                      <span className="font-medium text-slate-200">{formatCurrency(availableCash)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input 
                        type="number" 
                        placeholder="Tutar (₺)" 
                        value={fundAmount} 
                        max={availableCash}
                        onChange={e => setFundAmount(e.target.value)} 
                        className="h-8 text-xs" 
                      />
                      <Button onClick={() => handleAddFunds(goal)} className="h-8 px-3 text-xs">Ekle</Button>
                      <Button variant="ghost" onClick={() => { setAddFundsId(null); setFundAmount(''); }} className="h-8 px-3 text-xs">İptal</Button>
                    </div>
                  </div>
                ) : (
                  <Button variant="outline" onClick={() => setAddFundsId(goal.id)} className="w-full h-8 text-xs mt-2 border-slate-700">
                    <Plus className="w-3 h-3 mr-1" /> Birikim Ekle
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
        {goals.length === 0 && (
          <div className="col-span-full text-center py-16 text-muted-foreground bg-card rounded-xl border border-border">
            Henüz hedef belirlenmedi. Geleceğinizi planlamaya başlayın!
          </div>
        )}
      </div>
    </div>
  );
};

// --- AI Advisor View ---
const AdvisorView: React.FC<{ state: FinancialState }> = ({ state }) => {
  const [advice, setAdvice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGetAdvice = async () => {
    setLoading(true);
    setAdvice(null);
    const result = await getFinancialAdvice(state);
    setAdvice(result);
    setLoading(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20">
          <BrainCircuit className="w-10 h-10 text-primary" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-slate-100 tracking-tight">Akıllı İçgörüler</h2>
          <p className="text-muted-foreground mt-1">12 Haftalık Finansal Özgürlük Danışmanı</p>
        </div>
      </div>

      <Card className="border-primary/30 shadow-lg shadow-primary/5 bg-gradient-to-b from-card to-slate-900/80">
        <CardHeader className="bg-slate-800/30 border-b border-border">
          <CardTitle className="flex items-center justify-between">
            <span>Yapay Zeka Analizi</span>
            <Button onClick={handleGetAdvice} disabled={loading} className="shadow-primary/20 shadow-lg">
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analiz Ediliyor...</> : 'Aksiyon Planı Oluştur'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-8 min-h-[300px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-6 text-muted-foreground py-16">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm">90 Günlük Para Planı kuralları verilerinize uygulanıyor...</p>
            </div>
          ) : advice ? (
            <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed">
              {advice.split('\n').map((line, i) => {
                if (line.startsWith('- ') || line.startsWith('* ')) {
                  return <li key={i} className="ml-4 mb-2">{line.substring(2).replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-100">$1</strong>')}</li>;
                }
                if (line.match(/^\d+\./)) {
                  return <div key={i} className="font-semibold mt-6 mb-3 text-primary text-base">{line}</div>;
                }
                if (line.trim() === '') return <br key={i} />;
                
                const formattedLine = line.split('**').map((part, index) => 
                  index % 2 === 1 ? <strong key={index} className="text-slate-100">{part}</strong> : part
                );
                
                return <p key={i} className="mb-3">{formattedLine}</p>;
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-16">
              <Target className="w-16 h-16 text-muted-foreground opacity-30" />
              <p className="text-muted-foreground max-w-md text-sm">
                "Üç Kova" ve "Üç Hesap" felsefesine dayalı, kişiselleştirilmiş ve matematiğe dayalı aksiyon adımınızı almak için yukarıdaki butona tıklayın.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
