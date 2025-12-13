"use client";

import { Card } from "@/components/ui/card";
import { Wallet, Calendar, TrendingUp, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DailyBudgetCardProps {
    balance: number;
    income: number;
    expenses: number;
}

export function DailyBudgetCard({ balance, income, expenses }: DailyBudgetCardProps) {
    // Calcular días restantes del mes
    const today = new Date();
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const daysRemaining = lastDayOfMonth.getDate() - today.getDate() + 1; // +1 incluye hoy

    // Presupuesto diario = Balance restante / Días restantes
    const dailyBudget = balance > 0 ? balance / daysRemaining : 0;

    // Determinar el estado del presupuesto
    const isHealthy = dailyBudget > 0;
    const isWarning = dailyBudget > 0 && dailyBudget < 100; // Menos de $100/día es advertencia
    const isCritical = balance <= 0;

    // Calcular promedio de gasto diario actual
    const daysPassed = today.getDate();
    const averageDailySpending = daysPassed > 0 ? expenses / daysPassed : 0;

    // Formato de moneda
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("es-MX", {
            style: "currency",
            currency: "MXN",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(Math.abs(amount));
    };

    return (
        <Card className={cn(
            "relative overflow-hidden p-4 border-0",
            isCritical ? "bg-destructive/10 border border-destructive/30" :
                isWarning ? "bg-yellow-500/10 border border-yellow-500/30" :
                    "bg-gradient-to-r from-chart-1/20 to-chart-1/5"
        )}>
            {/* Icono de fondo */}
            <div className="absolute -right-4 -bottom-4 opacity-10">
                <Wallet className="w-24 h-24" />
            </div>

            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        {isCritical ? (
                            <AlertTriangle className="w-5 h-5 text-destructive" />
                        ) : (
                            <TrendingUp className="w-5 h-5 text-chart-1" />
                        )}
                        <span className="text-sm font-medium text-muted-foreground">
                            Presupuesto Diario
                        </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>{daysRemaining} días restantes</span>
                    </div>
                </div>

                {/* Monto principal */}
                <div className="mb-3">
                    <p className={cn(
                        "text-3xl font-bold",
                        isCritical ? "text-destructive" :
                            isWarning ? "text-yellow-500" :
                                "text-chart-1"
                    )}>
                        {isCritical ? "-" : ""}{formatCurrency(dailyBudget)}
                        <span className="text-lg font-normal text-muted-foreground">/día</span>
                    </p>
                </div>

                {/* Mensaje y estadísticas */}
                <div className="space-y-2">
                    {isCritical ? (
                        <p className="text-sm text-destructive">
                            ⚠️ Has gastado más de lo que ingresaste este mes
                        </p>
                    ) : isWarning ? (
                        <p className="text-sm text-yellow-500">
                            ⚡ Presupuesto ajustado, considera reducir gastos
                        </p>
                    ) : income > 0 ? (
                        <p className="text-sm text-chart-1">
                            ✨ ¡Vas bien! Mantén este ritmo
                        </p>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            💡 Registra tus ingresos para calcular tu presupuesto
                        </p>
                    )}

                    {/* Gasto promedio diario */}
                    {expenses > 0 && (
                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
                            <span>Gasto promedio actual:</span>
                            <span className={cn(
                                "font-medium",
                                averageDailySpending > dailyBudget && dailyBudget > 0 ? "text-destructive" : "text-foreground"
                            )}>
                                {formatCurrency(averageDailySpending)}/día
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
}
