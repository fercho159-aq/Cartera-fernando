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

        const monthlyTransactions = transactions.filter((t) => {
            const date = new Date(t.date);
            return date.getMonth() === currentMonth &&
                date.getFullYear() === currentYear;
        });

        const income = monthlyTransactions
            .filter((t) => t.type === 'income')
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const expenses = monthlyTransactions
            .filter((t) => t.type === 'expense')
            .reduce((sum, t) => sum + Number(t.amount), 0);

        return {
            balance: income - expenses,
            income,
            expenses,
        };
    },
}));
