"use client";

import { useState } from "react";
import { Transaction } from "@/lib/db/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ArrowUpRight, ArrowDownLeft, RefreshCw, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useTransactionStore } from "@/lib/store";

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
    onDelete?: (id: number) => void;
    isDeleting?: boolean;
}

export function TransactionItem({ transaction, onDelete, isDeleting }: TransactionItemProps) {
    const isIncome = transaction.type === "income";
    const emoji = categoryEmojis[transaction.category] || "📦";
    const categoryLabel = categoryLabels[transaction.category] || transaction.category;

    return (
        <Card className="flex items-center gap-3 p-4 border-0 bg-card card-hover">
            {/* Icono de Categoría */}
            <div
                className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0",
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
            <div className="text-right flex-shrink-0">
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

            {/* Botón Eliminar */}
            {onDelete && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="flex-shrink-0 h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => onDelete(transaction.id)}
                    disabled={isDeleting}
                >
                    {isDeleting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Trash2 className="w-4 h-4" />
                    )}
                </Button>
            )}
        </Card>
    );
}

interface TransactionListProps {
    transactions: Transaction[];
    limit?: number;
    showDeleteButton?: boolean;
}

export function TransactionList({ transactions, limit, showDeleteButton = true }: TransactionListProps) {
    const { removeTransaction } = useTransactionStore();
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; transaction: Transaction | null }>({
        open: false,
        transaction: null,
    });

    const displayTransactions = limit
        ? transactions.slice(0, limit)
        : transactions;

    const handleDeleteClick = (transaction: Transaction) => {
        setConfirmDialog({ open: true, transaction });
    };

    const handleConfirmDelete = async () => {
        if (!confirmDialog.transaction) return;

        const transactionId = confirmDialog.transaction.id;
        setDeletingId(transactionId);
        setConfirmDialog({ open: false, transaction: null });

        try {
            const response = await fetch(`/api/transactions/${transactionId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                removeTransaction(transactionId);
            } else {
                console.error('Error al eliminar transacción');
            }
        } catch (error) {
            console.error('Error al eliminar transacción:', error);
        } finally {
            setDeletingId(null);
        }
    };

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
        <>
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
                                    <TransactionItem
                                        key={transaction.id}
                                        transaction={transaction}
                                        onDelete={showDeleteButton ? () => handleDeleteClick(transaction) : undefined}
                                        isDeleting={deletingId === transaction.id}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Diálogo de Confirmación */}
            <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ open, transaction: null })}>
                <DialogContent className="max-w-[90vw] rounded-2xl sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>¿Eliminar transacción?</DialogTitle>
                        <DialogDescription>
                            Esta acción no se puede deshacer. Se eliminará permanentemente la transacción
                            {confirmDialog.transaction && (
                                <span className="font-medium text-foreground">
                                    {" "}&quot;{confirmDialog.transaction.title}&quot;
                                </span>
                            )}
                            .
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex-row gap-2 sm:flex-row">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => setConfirmDialog({ open: false, transaction: null })}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            className="flex-1"
                            onClick={handleConfirmDelete}
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
