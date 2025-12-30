
"use client";

import { useState, useEffect } from "react";
import { Transaction } from "@/lib/db/schema";
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

// Mapas de respaldo estáticos
const defaultCategoryEmojis: Record<string, string> = {
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

const defaultCategoryLabels: Record<string, string> = {
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

const iconToEmoji: Record<string, string> = {
    "food": "🍔", "Utensils": "🍔",
    "transport": "🚗", "Car": "🚗",
    "entertainment": "🎮", "Gamepad2": "🎮",
    "health": "🏥", "HeartPulse": "🏥",
    "shopping": "🛍️", "ShoppingBag": "🛍️",
    "utilities": "💡", "Zap": "💡",
    "salary": "💰", "Banknote": "💰",
    "freelance": "💻", "Laptop": "💻",
    "investment": "📈", "TrendingUp": "📈",
    "other": "📦", "Box": "📦",
    "housing": "🏠", "Home": "🏠",
    "education": "🎓", "GraduationCap": "🎓"
};

interface TransactionItemProps {
    transaction: Transaction;
    onDelete?: (id: number) => void;
    isDeleting?: boolean;
    categoryInfo?: { label: string; emoji: string };
}

export function TransactionItem({ transaction, onDelete, isDeleting, categoryInfo }: TransactionItemProps) {
    const isIncome = transaction.type === "income";

    // Usar info pasada o defaults
    const emoji = categoryInfo?.emoji || defaultCategoryEmojis[transaction.category] || "📦";
    const categoryLabel = categoryInfo?.label || defaultCategoryLabels[transaction.category] || transaction.category;

    return (
        <div
            className="flex items-center gap-3 p-4 rounded-2xl card-hover backdrop-blur-xl bg-white/50 dark:bg-white/5 border border-white/60 dark:border-white/10 shadow-sm"
            style={{
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            }}
        >
            {/* Icono de Categoría */}
            <div
                className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 backdrop-blur-sm",
                    isIncome ? "bg-chart-1/15 border border-chart-1/20" : "bg-white/40 dark:bg-white/10 border border-white/30 dark:border-white/10"
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
        </div>
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

    // Categories state for dynamic display
    const [categories, setCategories] = useState<any[]>([]);

    useEffect(() => {
        // Fetch categories to get labels and icons/emojis
        fetch("/api/categories")
            .then(res => {
                if (res.ok) return res.json();
                return [];
            })
            .then(data => {
                if (Array.isArray(data)) setCategories(data);
            })
            .catch(err => console.error("Error fetching categories:", err));
    }, []);

    const getCategoryDetails = (catName: string): { label: string; emoji: string } => {
        const cat = categories.find(c => c.name === catName);
        if (cat) {
            let emoji = "📦";

            // Priority: Mapped Icon -> Mapped Name -> Emoji check -> Fallback
            if (cat.icon && iconToEmoji[cat.icon]) {
                emoji = iconToEmoji[cat.icon];
            } else if (iconToEmoji[cat.name]) {
                emoji = iconToEmoji[cat.name];
            } else if (cat.icon && cat.icon.length <= 4 && !/^[a-zA-Z0-9]+$/.test(cat.icon)) {
                emoji = cat.icon;
            } else {
                emoji = defaultCategoryEmojis[catName] || "📦";
            }

            return { label: cat.label, emoji };
        }
        // Fallback
        return {
            label: defaultCategoryLabels[catName] || catName,
            emoji: defaultCategoryEmojis[catName] || "📦"
        };
    };

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
                                        categoryInfo={getCategoryDetails(transaction.category)}
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
