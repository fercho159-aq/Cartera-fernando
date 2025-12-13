"use client";

import { Card } from "@/components/ui/card";
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
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
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

    return (
        <Card
            className={cn(
                "relative overflow-hidden p-4 border-0 card-hover",
                type === "balance" && "gradient-primary text-white col-span-2",
                type === "income" && "bg-card",
                type === "expense" && "bg-card",
                className
            )}
        >
            {/* Background decoration */}
            {type === "balance" && (
                <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10" />
            )}

            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                    <div
                        className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center",
                            type === "balance" && "bg-white/20",
                            type === "income" && "bg-chart-1/20",
                            type === "expense" && "bg-destructive/20"
                        )}
                    >
                        <Icon
                            className={cn(
                                "w-4 h-4",
                                type === "balance" && "text-white",
                                type === "income" && "text-chart-1",
                                type === "expense" && "text-destructive"
                            )}
                        />
                    </div>
                    <span
                        className={cn(
                            "text-sm font-medium",
                            type === "balance" ? "text-white/80" : "text-muted-foreground"
                        )}
                    >
                        {title}
                    </span>
                </div>

                <p
                    className={cn(
                        "font-bold",
                        type === "balance" ? "text-3xl" : "text-2xl",
                        type === "income" && "text-chart-1",
                        type === "expense" && "text-destructive"
                    )}
                >
                    {type === "expense" && "-"}
                    {formatCurrency(Math.abs(value))}
                </p>
            </div>
        </Card>
    );
}
