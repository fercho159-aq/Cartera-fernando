"use client";

import { useEffect } from "react";
import { Wallet, Calendar, TrendingUp, AlertTriangle, Clock, ChevronRight, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIncomeStore } from "@/lib/income-store";
import { useAccountStore } from "@/lib/account-store";
import { IncomeSourcesSheet } from "./income-sources-sheet";
import Link from "next/link";

interface SmartBudgetCardProps {
    balance: number;
    income: number;
    expenses: number;
}

export function SmartBudgetCard({ balance, income, expenses }: SmartBudgetCardProps) {
    const { forecast, fetchForecast, isLoading } = useIncomeStore();
    const { activeAccountId } = useAccountStore();

    useEffect(() => {
        fetchForecast(activeAccountId);
    }, [fetchForecast, activeAccountId]);

    // Calcular días restantes del mes (fallback si no hay forecast)
    const today = new Date();
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const daysRemainingInMonth = lastDayOfMonth.getDate() - today.getDate() + 1;

    // Usar datos del forecast si están disponibles
    const hasIncomeSources = forecast && forecast.incomeSources.length > 0;

    // Calcular días hasta el próximo pago
    const daysUntilNextPay = hasIncomeSources
        ? forecast.daysUntilNextPay
        : daysRemainingInMonth;

    // Siempre usar el balance real pasado como prop (de las transacciones del mes actual)
    // y dividir entre días hasta el próximo pago para calcular el presupuesto diario
    const smartDailyBudget = balance > 0 ? balance / daysUntilNextPay : 0;

    // Calcular promedio de gasto diario actual
    const daysPassed = today.getDate();
    const averageDailySpending = daysPassed > 0 ? expenses / daysPassed : 0;

    // Determinar el estado del presupuesto
    const isHealthy = smartDailyBudget > averageDailySpending;
    const isWarning = smartDailyBudget > 0 && smartDailyBudget < averageDailySpending * 1.2;
    const isCritical = balance <= 0 || smartDailyBudget < averageDailySpending * 0.8;

    // Formato de moneda
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("es-MX", {
            style: "currency",
            currency: "MXN",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(Math.abs(amount));
    };

    // Calcular total del próximo pago
    const nextPayAmount = forecast?.nextPayday?.sources.reduce((sum, s) => sum + s.amount, 0) || 0;

    return (
        <div
            className={cn(
                "relative overflow-hidden p-5 rounded-2xl",
                "backdrop-blur-xl",
                "border",
                "shadow-lg",
                isCritical
                    ? "bg-destructive/10 border-destructive/30 shadow-destructive/10"
                    : isWarning
                        ? "bg-yellow-500/10 border-yellow-500/30 shadow-yellow-500/10"
                        : "bg-white/50 dark:bg-white/5 border-white/60 dark:border-white/10 shadow-black/5"
            )}
            style={{
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            }}
        >
            {/* Brillo interior */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent dark:from-white/5 pointer-events-none rounded-2xl" />

            {/* Icono de fondo con efecto blur */}
            <div className="absolute -right-4 -bottom-4 opacity-5">
                <Wallet className="w-28 h-28" />
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
                            Presupuesto Diario {hasIncomeSources && "Inteligente"}
                        </span>
                    </div>
                    {hasIncomeSources ? (
                        <div className="flex items-center gap-1 text-xs text-chart-1 bg-chart-1/10 px-2 py-1 rounded-full">
                            <Clock className="w-3 h-3" />
                            <span>{daysUntilNextPay} días para cobrar</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            <span>{daysRemainingInMonth} días restantes</span>
                        </div>
                    )}
                </div>

                {/* Monto principal */}
                <div className="mb-3">
                    <p className={cn(
                        "text-3xl font-bold",
                        isCritical ? "text-destructive" :
                            isWarning ? "text-yellow-500" :
                                "text-chart-1"
                    )}>
                        {balance < 0 ? "-" : ""}{formatCurrency(smartDailyBudget)}
                        <span className="text-lg font-normal text-muted-foreground">/día</span>
                    </p>
                </div>

                {/* Mensaje y estadísticas */}
                <div className="space-y-3">
                    {isCritical ? (
                        <p className="text-sm text-destructive">
                            ⚠️ Presupuesto crítico - reduce gastos
                        </p>
                    ) : isWarning ? (
                        <p className="text-sm text-yellow-500">
                            ⚡ Presupuesto ajustado - gasta con cuidado
                        </p>
                    ) : isHealthy && hasIncomeSources ? (
                        <p className="text-sm text-chart-1">
                            ✨ ¡Vas por buen camino hasta tu próximo pago!
                        </p>
                    ) : income > 0 ? (
                        <p className="text-sm text-chart-1">
                            ✨ ¡Vas bien! Mantén este ritmo
                        </p>
                    ) : null}

                    {/* Info del próximo pago */}
                    {hasIncomeSources && forecast.nextPayday && (
                        <div className="p-3 rounded-xl bg-chart-1/5 border border-chart-1/10">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-muted-foreground">Próximo pago</span>
                                <span className="text-xs font-medium text-chart-1">
                                    {(() => {
                                        const date = new Date();
                                        date.setDate(date.getDate() + forecast.nextPayday.daysUntil);
                                        return date.toLocaleDateString("es-MX", { day: "numeric", month: "long" });
                                    })()}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex flex-wrap gap-1">
                                    {forecast.nextPayday.sources.map((source, i) => (
                                        <span key={i} className="text-xs bg-chart-1/10 px-2 py-0.5 rounded-full">
                                            {source.name}
                                        </span>
                                    ))}
                                </div>
                                <span className="font-bold text-chart-1">
                                    +{formatCurrency(nextPayAmount)}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Gasto promedio diario */}
                    {expenses > 0 && (
                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
                            <span>Gasto promedio actual:</span>
                            <span className={cn(
                                "font-medium",
                                averageDailySpending > smartDailyBudget && smartDailyBudget > 0 ? "text-destructive" : "text-foreground"
                            )}>
                                {formatCurrency(averageDailySpending)}/día
                            </span>
                        </div>
                    )}

                    {/* CTA para configurar ingresos */}
                    {!hasIncomeSources && !isLoading && (
                        <div className="pt-3 border-t border-border/50">
                            <IncomeSourcesSheet>
                                <button className="w-full flex items-center justify-between p-3 rounded-xl bg-primary/5 hover:bg-primary/10 transition-colors text-left">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                            <Settings className="w-4 h-4 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">Configura tus ingresos</p>
                                            <p className="text-xs text-muted-foreground">
                                                Para un presupuesto más preciso
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                </button>
                            </IncomeSourcesSheet>
                        </div>
                    )}

                    {/* Link al forecast */}
                    {hasIncomeSources && (
                        <Link
                            href="/forecast"
                            className="flex items-center justify-center gap-2 text-xs text-primary hover:underline pt-2"
                        >
                            Ver proyección a 3 meses
                            <ChevronRight className="w-3 h-3" />
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
