import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Account } from '@/lib/db/schema';

interface AccountWithMeta extends Account {
    isOwner: boolean;
    role?: string;
    ownerName?: string | null;
    ownerEmail?: string | null;
}

interface AccountStore {
    accounts: AccountWithMeta[];
    activeAccountId: number | null; // null = cuenta personal
    isLoading: boolean;
    error: string | null;

    // Actions
    setAccounts: (accounts: AccountWithMeta[]) => void;
    setActiveAccountId: (id: number | null) => void;
    addAccount: (account: AccountWithMeta) => void;
    removeAccount: (id: number) => void;
    setLoading: (isLoading: boolean) => void;
    setError: (error: string | null) => void;

    // Computed
    getActiveAccount: () => AccountWithMeta | null;
}

export const useAccountStore = create<AccountStore>()(
    persist(
        (set, get) => ({
            accounts: [],
            activeAccountId: null,
            isLoading: false,
            error: null,

            setAccounts: (accounts) => set({ accounts }),

            setActiveAccountId: (id) => set({ activeAccountId: id }),

            addAccount: (account) =>
                set((state) => ({
                    accounts: [...state.accounts, account],
                })),

            removeAccount: (id) =>
                set((state) => ({
                    accounts: state.accounts.filter((a) => a.id !== id),
                    // Si se elimina la cuenta activa, volver a personal
                    activeAccountId: state.activeAccountId === id ? null : state.activeAccountId,
                })),

            setLoading: (isLoading) => set({ isLoading }),

            setError: (error) => set({ error }),

            getActiveAccount: () => {
                const { accounts, activeAccountId } = get();
                if (activeAccountId === null) return null;
                return accounts.find((a) => a.id === activeAccountId) || null;
            },
        }),
        {
            name: 'account-storage', // nombre en localStorage
            partialize: (state) => ({ activeAccountId: state.activeAccountId }), // solo persistir el id activo
        }
    )
);
