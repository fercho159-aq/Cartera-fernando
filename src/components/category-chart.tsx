"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const categoryColors: Record<string, string> = {
    food: "#f97316",
    transport: "#3b82f6",
    entertainment: "#a855f7",
    health: "#ef4444",
    shopping: "#ec4899",
    utilities: "#eab308",
    salary: "#22c55e",
    freelance: "#06b6d4",
    investment: "#14b8a6",
    other: "#6b7280",
};

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

const categoryEmojis: Record<string, string> = {
    food: "🍔",
    transport: "🚗",
    entertainment: "🎮",
    health: "🏥",
    shopping: "🛍️",
    utilities: "💡",
    salary: "💰",
    freelance: "💻",
    investment: "📈",
    other: "📦",
};

interface CategoryData {
    category: string;
    total: number;
}

interface CategoryChartProps {
    data: CategoryData[];
}

export function CategoryChart({ data }: CategoryChartProps) {
    const chartData = data.map((item) => ({
        name: categoryLabels[item.category] || item.category,
        value: Number(item.total),
        color: categoryColors[item.category] || categoryColors.other,
        emoji: categoryEmojis[item.category] || categoryEmojis.other,
    }));

    const totalExpenses = chartData.reduce((sum, item) => sum + item.value, 0);

    const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: { name: string; value: number; emoji: string } }[] }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-popover border border-border rounded-lg p-3 shadow-xl">
                    <p className="font-medium">
                        {data.emoji} {data.name}
                    </p>
                    <p className="text-lg font-bold">
                        ${data.value.toLocaleString()}
                    </p>
                </div>
            );
        }
        return null;
    };

    if (chartData.length === 0) {
        return (
            <div
                className="relative overflow-hidden p-5 rounded-2xl backdrop-blur-xl bg-white/50 dark:bg-white/5 border border-white/60 dark:border-white/10 shadow-lg shadow-black/5"
                style={{ backdropFilter: 'blur(20px) saturate(180%)', WebkitBackdropFilter: 'blur(20px) saturate(180%)' }}
            >
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent dark:from-white/5 pointer-events-none rounded-2xl" />
                <div className="relative z-10">
                    <h3 className="text-lg font-semibold mb-4">Gastos por Categoría</h3>
                    <div className="flex items-center justify-center h-40">
                        <p className="text-muted-foreground text-center">
                            Sin gastos este mes.<br />
                            ¡Empieza a registrar tus gastos!
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className="relative overflow-hidden p-5 rounded-2xl backdrop-blur-xl bg-white/50 dark:bg-white/5 border border-white/60 dark:border-white/10 shadow-lg shadow-black/5"
            style={{ backdropFilter: 'blur(20px) saturate(180%)', WebkitBackdropFilter: 'blur(20px) saturate(180%)' }}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent dark:from-white/5 pointer-events-none rounded-2xl" />
            <div className="relative z-10">
                <h3 className="text-lg font-semibold mb-4">Gastos por Categoría</h3>
                <div className="flex items-center gap-4">
                    <div className="w-40 h-40">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={35}
                                    outerRadius={70}
                                    paddingAngle={3}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="flex-1 space-y-2">
                        {chartData.slice(0, 4).map((item) => (
                            <div key={item.name} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: item.color }}
                                    />
                                    <span className="text-sm">
                                        {item.emoji} {item.name}
                                    </span>
                                </div>
                                <span className="text-sm font-medium">
                                    {((item.value / totalExpenses) * 100).toFixed(0)}%
                                </span>
                            </div>
                        ))}
                        {chartData.length > 4 && (
                            <p className="text-xs text-muted-foreground">
                                +{chartData.length - 4} categorías más
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
