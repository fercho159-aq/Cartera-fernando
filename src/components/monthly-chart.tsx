"use client";

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MonthlyData {
    month: string;
    monthNum: number;
    year: number;
    income: number;
    expense: number;
}

interface MonthlyChartProps {
    data: MonthlyData[];
}

const monthLabels: Record<string, string> = {
    'Jan': 'Ene',
    'Feb': 'Feb',
    'Mar': 'Mar',
    'Apr': 'Abr',
    'May': 'May',
    'Jun': 'Jun',
    'Jul': 'Jul',
    'Aug': 'Ago',
    'Sep': 'Sep',
    'Oct': 'Oct',
    'Nov': 'Nov',
    'Dec': 'Dic',
};

export function MonthlyChart({ data }: MonthlyChartProps) {
    const chartData = data.map((item) => ({
        name: monthLabels[item.month] || item.month,
        ingresos: Number(item.income),
        gastos: Number(item.expense),
    }));

    const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; dataKey: string; color: string }[]; label?: string }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-popover border border-border rounded-lg p-3 shadow-xl">
                    <p className="font-medium mb-2">{label}</p>
                    {payload.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-sm capitalize">{entry.dataKey}:</span>
                            <span className="text-sm font-bold">
                                ${entry.value.toLocaleString()}
                            </span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    if (chartData.length === 0) {
        return (
            <Card className="border-0 bg-card">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Ingresos vs Gastos</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-48">
                    <p className="text-muted-foreground text-center">
                        Sin datos aún.<br />
                        ¡Agrega tu primera transacción!
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-0 bg-card">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg">Ingresos vs Gastos</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-64 -ml-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} barGap={4}>
                            <defs>
                                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#22c55e" />
                                    <stop offset="100%" stopColor="#16a34a" />
                                </linearGradient>
                                <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#ef4444" />
                                    <stop offset="100%" stopColor="#dc2626" />
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: "#9ca3af", fontSize: 12 }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: "#9ca3af", fontSize: 12 }}
                                tickFormatter={(value) => `$${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
                            <Legend
                                wrapperStyle={{ paddingTop: "10px" }}
                                formatter={(value) => (
                                    <span className="text-sm capitalize text-muted-foreground">
                                        {value}
                                    </span>
                                )}
                            />
                            <Bar
                                dataKey="ingresos"
                                fill="url(#incomeGradient)"
                                radius={[4, 4, 0, 0]}
                                maxBarSize={40}
                            />
                            <Bar
                                dataKey="gastos"
                                fill="url(#expenseGradient)"
                                radius={[4, 4, 0, 0]}
                                maxBarSize={40}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
