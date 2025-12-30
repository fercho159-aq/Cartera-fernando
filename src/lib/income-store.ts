import { create } from 'zustand';
import { IncomeSource } from '@/lib/db/schema';

interface ForecastDay {
    date: string;
    dayOfMonth: number;
    income: number;
    incomeDetails: Array<{ name: string; amount: number; type: string }>;
    projectedBalance: number;
    isPayday: boolean;
}

interface ForecastMonth {
    month: string;
    monthNum: number;
    year: number;
    totalIncome: number;
    projectedExpenses: number;
    projectedBalance: number;
    paydays: ForecastDay[];
}

interface NextPayday {
    day: number;
    daysUntil: number;
    sources: Array<{ name: string; amount: number }>;
}

interface ForecastData {
    currentBalance: number;
    avgMonthlyExpense: number;
    avgDailyExpense: number;
    expenseBreakdown: Array<{ category: string; amount: number }>;
    smartDailyBudget: number;
    daysUntilNextPay: number;
    nextPayday: NextPayday | null;
    incomeSources: Array<{
        id: number;
        name: string;
        type: string;
        amount: number;
        frequency: string;
        payDays: number[];
    }>;
    forecast: ForecastMonth[];
}

interface IncomeStore {
    incomeSources: IncomeSource[];
    forecast: ForecastData | null;
    isLoading: boolean;
    error: string | null;

    // Actions
    setIncomeSources: (sources: IncomeSource[]) => void;
    addIncomeSource: (source: IncomeSource) => void;
    updateIncomeSource: (id: number, source: Partial<IncomeSource>) => void;
    removeIncomeSource: (id: number) => void;
    setForecast: (forecast: ForecastData | null) => void;
    setLoading: (isLoading: boolean) => void;
    setError: (error: string | null) => void;

    // Fetch actions
    fetchIncomeSources: (accountId?: number | null) => Promise<void>;
    fetchForecast: (accountId?: number | null) => Promise<void>;
}

export const useIncomeStore = create<IncomeStore>((set, get) => ({
    incomeSources: [],
    forecast: null,
    isLoading: false,
    error: null,

    setIncomeSources: (sources) => set({ incomeSources: sources }),

    addIncomeSource: (source) =>
        set((state) => ({
            incomeSources: [...state.incomeSources, source]
        })),

    updateIncomeSource: (id, updatedFields) =>
        set((state) => ({
            incomeSources: state.incomeSources.map((s) =>
                s.id === id ? { ...s, ...updatedFields } : s
            )
        })),

    removeIncomeSource: (id) =>
        set((state) => ({
            incomeSources: state.incomeSources.filter((s) => s.id !== id)
        })),

    setForecast: (forecast) => set({ forecast }),

    setLoading: (isLoading) => set({ isLoading }),

    setError: (error) => set({ error }),

    fetchIncomeSources: async (accountId) => {
        const { setLoading, setError, setIncomeSources } = get();
        setLoading(true);
        setError(null);

        try {
            const query = accountId ? `?accountId=${accountId}` : '';
            const response = await fetch(`/api/income-sources${query}`);

            if (!response.ok) {
                throw new Error('Error al cargar fuentes de ingreso');
            }

            const data = await response.json();
            setIncomeSources(data);
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Error desconocido');
        } finally {
            setLoading(false);
        }
    },

    fetchForecast: async (accountId) => {
        const { setLoading, setError, setForecast } = get();
        setLoading(true);
        setError(null);

        try {
            const query = accountId ? `?accountId=${accountId}` : '';
            const response = await fetch(`/api/forecast${query}`);

            if (!response.ok) {
                throw new Error('Error al cargar forecast');
            }

            const data = await response.json();
            setForecast(data);
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Error desconocido');
        } finally {
            setLoading(false);
        }
    }
}));
