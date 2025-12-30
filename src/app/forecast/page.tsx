"use client";

import { useEffect, useState } from "react";
import { useIncomeStore } from "@/lib/income-store";
import { useAccountStore } from "@/lib/account-store";
import { IncomeSourcesSheet } from "@/components/income-sources-sheet";
import {
    ArrowLeft,
    TrendingUp,
    TrendingDown,
    Calendar,
    DollarSign,
    Plus,
    Trash2,
    Edit2,
    Loader2,
    AlertTriangle,
    ChevronDown,
    ChevronUp
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function ForecastPage() {
    const { forecast, incomeSources, fetchForecast, fetchIncomeSources, isLoading, removeIncomeSource } = useIncomeStore();
    const { activeAccountId } = useAccountStore();
    const [expandedMonth, setExpandedMonth] = useState<number | null>(0);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    useEffect(() => {
        fetchForecast(activeAccountId);
        fetchIncomeSources(activeAccountId);
    }, [fetchForecast, fetchIncomeSources, activeAccountId]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("es-MX", {
            style: "currency",
            currency: "MXN",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const handleDeleteSource = async (id: number) => {
        if (!confirm("¿Eliminar esta fuente de ingreso?")) return;

        setDeletingId(id);
        try {
            const response = await fetch(`/api/income-sources/${id}`, {
                method: "DELETE"
            });

            if (response.ok) {
                removeIncomeSource(id);
                fetchForecast(activeAccountId);
            }
        } catch (error) {
            console.error("Error al eliminar:", error);
        } finally {
            setDeletingId(null);
        }
    };

    const frequencyLabels: Record<string, string> = {
        weekly: "Semanal",
        biweekly: "Quincenal",
        monthly: "Mensual",
        custom: "Personalizado"
    };

    if (isLoading && !forecast) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <main className="min-h-screen px-4 pt-2 pb-24">
            {/* Header */}
            <header className="flex items-center gap-4 mb-6">
                <Link
                    href="/"
                    className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">Proyección Financiera</h1>
                    <p className="text-sm text-muted-foreground">Forecast a 3 meses</p>
                </div>
            </header>

            {/* Resumen actual */}
            {forecast && (
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="p-4 rounded-2xl bg-chart-1/10 border border-chart-1/20">
                        <p className="text-xs text-muted-foreground mb-1">Balance actual</p>
                        <p className={cn(
                            "text-xl font-bold",
                            forecast.currentBalance >= 0 ? "text-chart-1" : "text-destructive"
                        )}>
                            {formatCurrency(forecast.currentBalance)}
                        </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-muted/50 border border-border">
                        <p className="text-xs text-muted-foreground mb-1">Presupuesto diario</p>
                        <p className="text-xl font-bold text-chart-1">
                            {formatCurrency(forecast.smartDailyBudget)}
                            <span className="text-sm font-normal text-muted-foreground">/día</span>
                        </p>
                    </div>
                </div>
            )}

            {/* Próximo pago */}
            {forecast?.nextPayday && (
                <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-chart-1/10 to-chart-1/5 border border-chart-1/20">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-chart-1" />
                            <span className="font-medium">
                                Próximo pago ({(() => {
                                    const date = new Date();
                                    date.setDate(date.getDate() + forecast.nextPayday.daysUntil);
                                    return date.toLocaleDateString("es-MX", { day: "numeric", month: "long" });
                                })()})
                            </span>
                        </div>
                        <span className="text-sm bg-chart-1/20 text-chart-1 px-2 py-1 rounded-full">
                            En {forecast.nextPayday.daysUntil} días
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                        {forecast.nextPayday.sources.map((source, i) => (
                            <div key={i} className="flex items-center gap-2 bg-background/50 px-3 py-2 rounded-xl">
                                <DollarSign className="w-4 h-4 text-chart-1" />
                                <span className="text-sm">{source.name}</span>
                                <span className="font-bold text-chart-1">
                                    +{formatCurrency(source.amount)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Fuentes de ingreso configuradas */}
            <section className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Mis ingresos</h2>
                    <IncomeSourcesSheet onSuccess={() => {
                        fetchIncomeSources(activeAccountId);
                        fetchForecast(activeAccountId);
                    }}>
                        <Button size="sm" variant="outline" className="gap-2">
                            <Plus className="w-4 h-4" />
                            Agregar
                        </Button>
                    </IncomeSourcesSheet>
                </div>

                {incomeSources.length === 0 ? (
                    <div className="p-6 rounded-2xl border-2 border-dashed border-border text-center">
                        <DollarSign className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                        <p className="font-medium mb-1">Sin ingresos configurados</p>
                        <p className="text-sm text-muted-foreground mb-4">
                            Configura tu salario y comisiones para obtener proyecciones precisas
                        </p>
                        <IncomeSourcesSheet>
                            <Button className="gap-2">
                                <Plus className="w-4 h-4" />
                                Configurar mi primer ingreso
                            </Button>
                        </IncomeSourcesSheet>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {incomeSources.map((source) => (
                            <div
                                key={source.id}
                                className={cn(
                                    "p-4 rounded-2xl border transition-all",
                                    source.type === "fixed"
                                        ? "bg-chart-1/5 border-chart-1/20"
                                        : "bg-yellow-500/5 border-yellow-500/20"
                                )}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-medium">{source.name}</span>
                                            <span className={cn(
                                                "text-xs px-2 py-0.5 rounded-full",
                                                source.type === "fixed"
                                                    ? "bg-chart-1/20 text-chart-1"
                                                    : "bg-yellow-500/20 text-yellow-600"
                                            )}>
                                                {source.type === "fixed" ? "Fijo" : "Variable"}
                                            </span>
                                        </div>
                                        <p className="text-2xl font-bold">
                                            {formatCurrency(Number(source.baseAmount))}
                                        </p>
                                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                            <span>{frequencyLabels[source.frequency]}</span>
                                            <span>•</span>
                                            <span>Días: {source.payDays.join(", ")}</span>
                                        </div>
                                        {source.type === "variable" && source.averageLast3Months && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Promedio 3 meses: {formatCurrency(Number(source.averageLast3Months))}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            className="p-2 rounded-full hover:bg-muted transition-colors"
                                            disabled={deletingId === source.id}
                                        >
                                            <Edit2 className="w-4 h-4 text-muted-foreground" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteSource(source.id)}
                                            className="p-2 rounded-full hover:bg-destructive/10 transition-colors"
                                            disabled={deletingId === source.id}
                                        >
                                            {deletingId === source.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="w-4 h-4 text-destructive" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Proyección mensual */}
            {forecast && forecast.forecast.length > 0 && (
                <section>
                    <h2 className="text-lg font-semibold mb-4">Proyección mensual</h2>
                    <div className="space-y-3">
                        {forecast.forecast.map((month, index) => {
                            const isExpanded = expandedMonth === index;
                            const isPositive = month.projectedBalance >= 0;

                            return (
                                <div
                                    key={`${month.year}-${month.monthNum}`}
                                    className={cn(
                                        "rounded-2xl border overflow-hidden transition-all",
                                        isPositive
                                            ? "bg-chart-1/5 border-chart-1/20"
                                            : "bg-destructive/5 border-destructive/20"
                                    )}
                                >
                                    <button
                                        onClick={() => setExpandedMonth(isExpanded ? null : index)}
                                        className="w-full p-4 flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-10 h-10 rounded-full flex items-center justify-center",
                                                isPositive ? "bg-chart-1/20" : "bg-destructive/20"
                                            )}>
                                                {isPositive ? (
                                                    <TrendingUp className="w-5 h-5 text-chart-1" />
                                                ) : (
                                                    <TrendingDown className="w-5 h-5 text-destructive" />
                                                )}
                                            </div>
                                            <div className="text-left">
                                                <p className="font-medium capitalize">
                                                    {month.month} {month.year}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {month.paydays.length} día(s) de pago
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="text-right">
                                                <p className={cn(
                                                    "font-bold",
                                                    isPositive ? "text-chart-1" : "text-destructive"
                                                )}>
                                                    {formatCurrency(month.projectedBalance)}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Balance proyectado
                                                </p>
                                            </div>
                                            {isExpanded ? (
                                                <ChevronUp className="w-5 h-5 text-muted-foreground" />
                                            ) : (
                                                <ChevronDown className="w-5 h-5 text-muted-foreground" />
                                            )}
                                        </div>
                                    </button>

                                    {isExpanded && (
                                        <div className="px-4 pb-4 border-t border-border/50">
                                            {/* Resumen del mes */}
                                            <div className="grid grid-cols-2 gap-3 py-3">
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Ingresos</p>
                                                    <p className="font-medium text-chart-1">
                                                        +{formatCurrency(month.totalIncome)}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Gastos (est.)</p>
                                                    <p className="font-medium text-destructive">
                                                        -{formatCurrency(month.projectedExpenses)}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Días de pago */}
                                            {month.paydays.length > 0 && (
                                                <div className="space-y-2 pt-3 border-t border-border/50">
                                                    <p className="text-xs font-medium text-muted-foreground">
                                                        Días de pago
                                                    </p>
                                                    {month.paydays.map((payday, pIndex) => (
                                                        <div
                                                            key={pIndex}
                                                            className="flex items-center justify-between p-3 rounded-xl bg-background/50"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-chart-1/20 flex items-center justify-center">
                                                                    <span className="text-sm font-bold text-chart-1">
                                                                        {payday.dayOfMonth}
                                                                    </span>
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-medium">
                                                                        +{formatCurrency(payday.income)}
                                                                    </p>
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {payday.incomeDetails.map((detail, dIndex) => (
                                                                            <span
                                                                                key={dIndex}
                                                                                className="text-xs text-muted-foreground"
                                                                            >
                                                                                {detail.name}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-xs text-muted-foreground">Balance</p>
                                                                <p className={cn(
                                                                    "font-medium",
                                                                    payday.projectedBalance >= 0 ? "text-chart-1" : "text-destructive"
                                                                )}>
                                                                    {formatCurrency(payday.projectedBalance)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Alerta si hay déficit */}
                                            {!isPositive && (
                                                <div className="mt-3 p-3 rounded-xl bg-destructive/10 flex items-center gap-3">
                                                    <AlertTriangle className="w-5 h-5 text-destructive" />
                                                    <p className="text-sm text-destructive">
                                                        Posible déficit este mes. Considera reducir gastos.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* Nota sobre ingresos variables */}
            {incomeSources.some(s => s.type === "variable") && (
                <div className="mt-6 p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/20">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                        <div>
                            <p className="font-medium text-yellow-600">Ingresos variables</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Las proyecciones de comisiones usan el promedio de los últimos 3 meses.
                                Registra tus comisiones cada mes para mejorar la precisión.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
