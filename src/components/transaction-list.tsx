"use client";

import { Transaction } from "@/lib/db/schema";
import { Card } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownLeft, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

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

interface TransactionItemProps {
    transaction: Transaction;
}

export function TransactionItem({ transaction }: TransactionItemProps) {
    const isIncome = transaction.type === "income";
    const emoji = categoryEmojis[transaction.category] || "📦";
    const categoryLabel = categoryLabels[transaction.category] || transaction.category;

    return (
        <Card className="flex items-center gap-4 p-4 border-0 bg-card card-hover">
            {/* Icono de Categoría */}
            <div
                className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center text-2xl",
                    isIncome ? "bg-chart-1/20" : "bg-muted"
                )}
            >
                {emoji}
            </div>

            {/* Detalles de la Transacción */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <h3 className="font-medium truncate">{transaction.title}</h3>
                    {transaction.isRecurring && (
                        <RefreshCw className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="capitalize">{categoryLabel}</span>
                    <span>•</span>
                    <span>{format(new Date(transaction.date), "d MMM", { locale: es })}</span>
                </div>
            </div>

            {/* Monto */}
            <div className="text-right">
                <p
                    className={cn(
                        "font-bold text-lg",
                        isIncome ? "text-chart-1" : "text-foreground"
                    )}
                >
                    {isIncome ? "+" : "-"}${Number(transaction.amount).toLocaleString()}
                </p>
                <div className="flex items-center justify-end gap-1">
                    {isIncome ? (
                        <ArrowDownLeft className="w-3 h-3 text-chart-1" />
                    ) : (
                        <ArrowUpRight className="w-3 h-3 text-muted-foreground" />
                    )}
                    <span className="text-xs text-muted-foreground capitalize">
                        {isIncome ? "Ingreso" : "Gasto"}
                    </span>
                </div>
            </div>
        </Card>
    );
}

interface TransactionListProps {
    transactions: Transaction[];
    limit?: number;
}

export function TransactionList({ transactions, limit }: TransactionListProps) {
    const displayTransactions = limit
        ? transactions.slice(0, limit)
        : transactions;

    if (displayTransactions.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-lg font-medium text-muted-foreground">
                    Sin transacciones aún
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                    Toca el botón + para agregar tu primera transacción
                </p>
            </div>
        );
    }

    // Agrupar transacciones por fecha
    const groupedTransactions: Record<string, Transaction[]> = {};

    displayTransactions.forEach((transaction) => {
        const dateKey = format(new Date(transaction.date), "yyyy-MM-dd");
        if (!groupedTransactions[dateKey]) {
            groupedTransactions[dateKey] = [];
        }
        groupedTransactions[dateKey].push(transaction);
    });

    return (
        <div className="space-y-6">
            {Object.entries(groupedTransactions).map(([dateKey, dayTransactions]) => {
                const date = new Date(dateKey);
                const isToday = format(new Date(), "yyyy-MM-dd") === dateKey;
                const isYesterday =
                    format(new Date(Date.now() - 86400000), "yyyy-MM-dd") === dateKey;

                let dateLabel = format(date, "EEEE, d 'de' MMMM", { locale: es });
                if (isToday) dateLabel = "Hoy";
                if (isYesterday) dateLabel = "Ayer";

                return (
                    <div key={dateKey}>
                        <h3 className="text-sm font-medium text-muted-foreground mb-3 px-1 capitalize">
                            {dateLabel}
                        </h3>
                        <div className="space-y-2">
                            {dayTransactions.map((transaction) => (
                                <TransactionItem key={transaction.id} transaction={transaction} />
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
