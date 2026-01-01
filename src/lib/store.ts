import { create } from 'zustand';
import { Transaction } from '@/lib/db/schema';

interface TransactionStore {
    transactions: Transaction[];
    isLoading: boolean;
    error: string | null;

    // Actions
    setTransactions: (transactions: Transaction[]) => void;
    addTransaction: (transaction: Transaction) => void;
    removeTransaction: (id: number) => void;
    setLoading: (isLoading: boolean) => void;
    setError: (error: string | null) => void;

    // Computed values helper
    getMonthlyStats: () => {
        balance: number;
        income: number;
        expenses: number;
    };
}

export const useTransactionStore = create<TransactionStore>((set, get) => ({
    transactions: [],
    isLoading: false,
    error: null,

    setTransactions: (transactions) => set({ transactions }),

    addTransaction: (transaction) =>
        set((state) => ({
            transactions: [transaction, ...state.transactions]
        })),

    removeTransaction: (id) =>
        set((state) => ({
            transactions: state.transactions.filter((t) => t.id !== id)
        })),

    setLoading: (isLoading) => set({ isLoading }),

    setError: (error) => set({ error }),

    getMonthlyStats: () => {
        const { transactions } = get();
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        console.log('🔍 getMonthlyStats - Total transacciones en store:', transactions.length);

        // Filtrar transacciones del mes actual para ingresos/gastos mensuales
        const monthlyTransactions = transactions.filter((t) => {
            const date = new Date(t.date);
            return date.getMonth() === currentMonth &&
                date.getFullYear() === currentYear;
        });

        // Ingresos y gastos del MES ACTUAL
        const income = monthlyTransactions
            .filter((t) => t.type === 'income')
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const expenses = monthlyTransactions
            .filter((t) => t.type === 'expense')
            .reduce((sum, t) => sum + Number(t.amount), 0);

        // Balance TOTAL HISTÓRICO (todas las transacciones de todos los tiempos)
        const totalIncome = transactions
            .filter((t) => t.type === 'income')
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const totalExpenses = transactions
            .filter((t) => t.type === 'expense')
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const totalBalance = totalIncome - totalExpenses;

        console.log('📊 Stats calculados:', {
            totalTransactions: transactions.length,
            monthlyTransactions: monthlyTransactions.length,
            totalIncome,
            totalExpenses,
            totalBalance,
            income,
            expenses
        });

        return {
            balance: totalBalance,  // Balance acumulado histórico
            income,                 // Ingresos del mes actual
            expenses,               // Gastos del mes actual
        };
    },
}));
