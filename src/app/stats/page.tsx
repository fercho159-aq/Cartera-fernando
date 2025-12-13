"use client";

import { useEffect, useState } from "react";
import { CategoryChart } from "@/components/category-chart";
import { MonthlyChart } from "@/components/monthly-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, TrendingDown, PiggyBank } from "lucide-react";

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

export default function StatsPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch("/api/stats");
                if (response.ok) {
                    const data = await response.json();
                    setStats(data);
                }
            } catch (error) {
                console.error("Error al cargar estadísticas:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    // Calcular totales de los datos mensuales
    const totalIncome = stats?.monthlyData.reduce((sum, m) => sum + Number(m.income), 0) || 0;
    const totalExpense = stats?.monthlyData.reduce((sum, m) => sum + Number(m.expense), 0) || 0;
    const totalSavings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? ((totalSavings / totalIncome) * 100).toFixed(1) : "0";

    const categoryLabels: Record<string, string> = {
        food: "Comida",
        transport: "Transporte",
        entertainment: "Entretenimiento",
        health: "Salud",
        shopping: "Compras",
        utilities: "Servicios",
        salary: "Salario",
        freelance: "Freelance",
        investment: "Inversión",
        other: "Otro",
    };

    return (
        <main className="min-h-screen px-4 pt-6 pb-24">
            <header className="mb-6">
                <h1 className="text-2xl font-bold">Estadísticas</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Tu resumen financiero de los últimos 6 meses
                </p>
            </header>

            {/* Estadísticas Resumen */}
            <div className="grid grid-cols-3 gap-3 mb-6">
                <Card className="border-0 bg-card p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-chart-1/20 flex items-center justify-center">
                            <TrendingUp className="w-4 h-4 text-chart-1" />
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground">Total Ingresos</p>
                    <p className="text-lg font-bold text-chart-1">
                        ${totalIncome.toLocaleString()}
                    </p>
                </Card>

                <Card className="border-0 bg-card p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-destructive/20 flex items-center justify-center">
                            <TrendingDown className="w-4 h-4 text-destructive" />
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground">Total Gastos</p>
                    <p className="text-lg font-bold text-destructive">
                        ${totalExpense.toLocaleString()}
                    </p>
                </Card>

                <Card className="border-0 bg-card p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                            <PiggyBank className="w-4 h-4 text-primary" />
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground">Tasa Ahorro</p>
                    <p className="text-lg font-bold text-primary">{savingsRate}%</p>
                </Card>
            </div>

            {/* Gráficas */}
            <div className="space-y-4">
                <MonthlyChart data={stats?.monthlyData || []} />
                <CategoryChart data={stats?.categoryData || []} />

                {/* Tarjeta de Insights */}
                <Card className="border-0 bg-card">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">💡 Análisis</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {stats?.categoryData && stats.categoryData.length > 0 ? (
                            <>
                                <div className="flex items-start gap-3 p-3 rounded-xl bg-muted">
                                    <span className="text-2xl">📊</span>
                                    <div>
                                        <p className="font-medium">Categoría con más gastos</p>
                                        <p className="text-sm text-muted-foreground">
                                            Tu mayor gasto es en{" "}
                                            <span className="font-medium capitalize">
                                                {categoryLabels[stats.categoryData.sort((a, b) => Number(b.total) - Number(a.total))[0]?.category] || stats.categoryData[0]?.category}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                                {totalSavings > 0 ? (
                                    <div className="flex items-start gap-3 p-3 rounded-xl bg-chart-1/10">
                                        <span className="text-2xl">🎉</span>
                                        <div>
                                            <p className="font-medium text-chart-1">¡Excelente trabajo!</p>
                                            <p className="text-sm text-muted-foreground">
                                                Has ahorrado ${totalSavings.toLocaleString()} en los últimos 6 meses
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-start gap-3 p-3 rounded-xl bg-destructive/10">
                                        <span className="text-2xl">⚠️</span>
                                        <div>
                                            <p className="font-medium text-destructive">¡Cuidado!</p>
                                            <p className="text-sm text-muted-foreground">
                                                Estás gastando más de lo que ganas. Considera reducir gastos.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <p className="text-muted-foreground text-center py-4">
                                ¡Agrega transacciones para ver tu análisis!
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
