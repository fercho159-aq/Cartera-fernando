"use client";

import { useEffect, useState, useCallback } from "react";
import { StatCard } from "./stat-card";
import { SmartBudgetCard } from "./smart-budget-card";
import { CategoryChart } from "./category-chart";
import { MonthlyChart } from "./monthly-chart";
import { TransactionList } from "./transaction-list";
import { AccountSelector } from "./account-selector";
import { useTransactionStore } from "@/lib/store";
import { useAccountStore } from "@/lib/account-store";
import { Loader2, Bell, ChevronRight, Users } from "lucide-react";
import Link from "next/link";

interface Stats {
    monthlyData: Array<{
        month: string;
        monthNum: number;
        year: number;
        income: number;
        expense: number;
    }>;
    categoryData: Array<{
        category: string;
        total: number;
    }>;
}

export function Dashboard() {
    const { transactions, setTransactions, isLoading, setLoading, getMonthlyStats } = useTransactionStore();
    const { activeAccountId, getActiveAccount } = useAccountStore();
    const [stats, setStats] = useState<Stats | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const accountQuery = activeAccountId ? `?accountId=${activeAccountId}` : '';

            const [transactionsRes, statsRes] = await Promise.all([
                fetch(`/api/transactions${accountQuery}`),
                fetch(`/api/stats${accountQuery}`),
            ]);

            if (transactionsRes.ok) {
                const transactionsData = await transactionsRes.json();
                setTransactions(transactionsData);
            }

            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setStats(statsData);
            }
        } catch (error) {
            console.error("Error al cargar datos:", error);
        } finally {
            setLoading(false);
        }
    }, [setTransactions, setLoading, activeAccountId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const monthlyStats = getMonthlyStats();
    const activeAccount = getActiveAccount();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <main className="min-h-screen px-4 pt-2 pb-24">
            {/* Encabezado */}
            <header className="flex items-center justify-between mb-6">
                <div>
                    <p className="text-muted-foreground text-sm">Bienvenido de nuevo 👋</p>
                    <h1 className="text-2xl font-bold mt-1">
                        {activeAccount ? activeAccount.name : "Tus Finanzas"}
                    </h1>
                </div>
                <div className="flex items-center gap-2">
                    <AccountSelector />
                    <button
                        className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
                        onClick={() => {
                            if ("Notification" in window) {
                                Notification.requestPermission().then((permission) => {
                                    if (permission === "granted") {
                                        new Notification("🔔 ¡Notificaciones Activadas!", {
                                            body: "Recibirás recordatorios diarios a las 8 PM",
                                            icon: "/icon-192x192.png",
                                        });
                                    }
                                });
                            }
                        }}
                    >
                        <Bell className="w-5 h-5 text-foreground" />
                    </button>
                </div>
            </header>

            {/* Indicador de cuenta compartida */}
            {activeAccount && (
                <div className="mb-4 p-3 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-medium">Cuenta compartida</p>
                        <p className="text-xs text-muted-foreground">
                            Los datos se sincronizan con todos los miembros
                        </p>
                    </div>
                    <Link
                        href="/accounts"
                        className="text-xs text-primary hover:underline"
                    >
                        Gestionar
                    </Link>
                </div>
            )}

            {/* Tarjetas de Resumen */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <StatCard
                    title="Balance Actual"
                    value={monthlyStats.balance}
                    type="balance"
                />
                <StatCard
                    title="Ingresos"
                    value={monthlyStats.income}
                    type="income"
                />
                <StatCard
                    title="Gastos"
                    value={monthlyStats.expenses}
                    type="expense"
                />
            </div>

            {/* Tarjeta de Presupuesto Diario Inteligente */}
            <div className="mb-6">
                <SmartBudgetCard
                    balance={monthlyStats.balance}
                    income={monthlyStats.income}
                    expenses={monthlyStats.expenses}
                />
            </div>

            {/* Gráficas */}
            <div className="space-y-4 mb-6">
                <CategoryChart data={stats?.categoryData || []} />
                <MonthlyChart data={stats?.monthlyData || []} />
            </div>

            {/* Transacciones Recientes */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Transacciones Recientes</h2>
                    <Link
                        href="/transactions"
                        className="flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                        Ver todo
                        <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>
                <TransactionList transactions={transactions} limit={5} showDeleteButton={false} />
            </div>
        </main>
    );
}

