"use client";

import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
    title: string;
    value: number;
    type: "balance" | "income" | "expense";
    className?: string;
}

export function StatCard({ title, value, type, className }: StatCardProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("es-MX", {
            style: "currency",
            currency: "MXN",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const icons = {
        balance: Wallet,
        income: TrendingUp,
        expense: TrendingDown,
    };

    const Icon = icons[type];

    if (type === "balance") {
        return (
            <div
                className={cn(
                    "relative overflow-hidden p-5 rounded-3xl col-span-2",
                    "bg-gradient-to-br from-primary via-primary/90 to-primary/70",
                    "shadow-xl shadow-primary/30",
                    "border border-white/20",
                    className
                )}
            >
                {/* Decoración Liquid Glass */}
                <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/15 blur-2xl" />
                <div className="absolute right-10 bottom-0 w-24 h-24 rounded-full bg-white/10 blur-xl" />

                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                            <Icon className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-sm font-medium text-white/80">
                            {title}
                        </span>
                    </div>

                    <p className="text-4xl font-bold text-white tracking-tight">
                        {formatCurrency(Math.abs(value))}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div
            className={cn(
                "relative overflow-hidden p-4 rounded-2xl",
                "backdrop-blur-xl bg-white/50 dark:bg-white/5",
                "border border-white/60 dark:border-white/10",
                "shadow-lg shadow-black/5 dark:shadow-black/20",
                className
            )}
            style={{
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            }}
        >
            {/* Brillo interior */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 pointer-events-none rounded-2xl" />

            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                    <div
                        className={cn(
                            "w-9 h-9 rounded-xl flex items-center justify-center backdrop-blur-sm",
                            "border border-white/40 dark:border-white/10",
                            type === "income" && "bg-chart-1/20",
                            type === "expense" && "bg-destructive/20"
                        )}
                    >
                        <Icon
                            className={cn(
                                "w-4 h-4",
                                type === "income" && "text-chart-1",
                                type === "expense" && "text-destructive"
                            )}
                        />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">
                        {title}
                    </span>
                </div>

                <p
                    className={cn(
                        "text-2xl font-bold tracking-tight",
                        type === "income" && "text-chart-1",
                        type === "expense" && "text-destructive"
                    )}
                >
                    {type === "expense" && "-"}
                    {formatCurrency(Math.abs(value))}
                </p>
            </div>
        </div>
    );
}

