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
                console.error("Error fetching stats:", error);
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

    // Calculate totals from monthly data
    const totalIncome = stats?.monthlyData.reduce((sum, m) => sum + Number(m.income), 0) || 0;
    const totalExpense = stats?.monthlyData.reduce((sum, m) => sum + Number(m.expense), 0) || 0;
    const totalSavings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? ((totalSavings / totalIncome) * 100).toFixed(1) : "0";

    return (
        <main className="min-h-screen px-4 pt-6 pb-24">
            <header className="mb-6">
                <h1 className="text-2xl font-bold">Statistics</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Your financial overview for the last 6 months
                </p>
            </header>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
                <Card className="border-0 bg-card p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-chart-1/20 flex items-center justify-center">
                            <TrendingUp className="w-4 h-4 text-chart-1" />
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground">Total Income</p>
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
                    <p className="text-xs text-muted-foreground">Total Expenses</p>
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
                    <p className="text-xs text-muted-foreground">Savings Rate</p>
                    <p className="text-lg font-bold text-primary">{savingsRate}%</p>
                </Card>
            </div>

            {/* Charts */}
            <div className="space-y-4">
                <MonthlyChart data={stats?.monthlyData || []} />
                <CategoryChart data={stats?.categoryData || []} />

                {/* Insights Card */}
                <Card className="border-0 bg-card">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">💡 Insights</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {stats?.categoryData && stats.categoryData.length > 0 ? (
                            <>
                                <div className="flex items-start gap-3 p-3 rounded-xl bg-muted">
                                    <span className="text-2xl">📊</span>
                                    <div>
                                        <p className="font-medium">Top Spending Category</p>
                                        <p className="text-sm text-muted-foreground">
                                            Your highest expense category is{" "}
                                            <span className="font-medium capitalize">
                                                {stats.categoryData.sort((a, b) => Number(b.total) - Number(a.total))[0]?.category}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                                {totalSavings > 0 ? (
                                    <div className="flex items-start gap-3 p-3 rounded-xl bg-chart-1/10">
                                        <span className="text-2xl">🎉</span>
                                        <div>
                                            <p className="font-medium text-chart-1">Great job!</p>
                                            <p className="text-sm text-muted-foreground">
                                                You&apos;ve saved ${totalSavings.toLocaleString()} over the past 6 months
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-start gap-3 p-3 rounded-xl bg-destructive/10">
                                        <span className="text-2xl">⚠️</span>
                                        <div>
                                            <p className="font-medium text-destructive">Watch out!</p>
                                            <p className="text-sm text-muted-foreground">
                                                You&apos;re spending more than you earn. Consider cutting back on expenses.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <p className="text-muted-foreground text-center py-4">
                                Add some transactions to see your insights!
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
