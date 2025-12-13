"use client";

import { useEffect, useState } from "react";
import { StatCard } from "./stat-card";
import { CategoryChart } from "./category-chart";
import { MonthlyChart } from "./monthly-chart";
import { TransactionList } from "./transaction-list";
import { useTransactionStore } from "@/lib/store";
import { Loader2, Bell, ChevronRight } from "lucide-react";
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
    const [stats, setStats] = useState<Stats | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [transactionsRes, statsRes] = await Promise.all([
                    fetch("/api/transactions"),
                    fetch("/api/stats"),
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
        };

        fetchData();
    }, [setTransactions, setLoading]);

    const monthlyStats = getMonthlyStats();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <main className="min-h-screen px-4 pt-6 pb-24">
            {/* Encabezado */}
            <header className="flex items-center justify-between mb-6">
                <div>
                    <p className="text-muted-foreground text-sm">Bienvenido de nuevo 👋</p>
                    <h1 className="text-2xl font-bold mt-1">Tus Finanzas</h1>
                </div>
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
            </header>

            {/* Tarjetas de Resumen */}
            <div className="grid grid-cols-2 gap-3 mb-6">
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
                <TransactionList transactions={transactions} limit={5} />
            </div>
        </main>
    );
}
