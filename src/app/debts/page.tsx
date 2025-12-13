"use client";

import { useEffect, useState } from "react";
import { Debt } from "@/lib/db/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Loader2,
    Plus,
    User,
    Check,
    Trash2,
    Calendar,
    DollarSign,
    Users,
    CheckCircle2,
    Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function DebtsPage() {
    const [debts, setDebts] = useState<Debt[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; debt: Debt | null; action: 'delete' | 'pay' | null }>({
        open: false,
        debt: null,
        action: null,
    });

    // Form state
    const [personName, setPersonName] = useState("");
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [dueDate, setDueDate] = useState("");

    useEffect(() => {
        fetchDebts();
    }, []);

    const fetchDebts = async () => {
        try {
            const response = await fetch("/api/debts");
            if (response.ok) {
                const data = await response.json();
                setDebts(data);
            }
        } catch (error) {
            console.error("Error al cargar deudas:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!personName || !amount) return;

        setIsSubmitting(true);
        try {
            const response = await fetch("/api/debts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    personName,
                    amount: parseFloat(amount),
                    description: description || null,
                    dueDate: dueDate || null,
                }),
            });

            if (response.ok) {
                const newDebt = await response.json();
                setDebts([newDebt, ...debts]);
                resetForm();
                setIsSheetOpen(false);
            }
        } catch (error) {
            console.error("Error al agregar deuda:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setPersonName("");
        setAmount("");
        setDescription("");
        setDueDate("");
    };

    const handleMarkAsPaid = async (debt: Debt) => {
        try {
            const response = await fetch(`/api/debts/${debt.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isPaid: !debt.isPaid }),
            });

            if (response.ok) {
                const updatedDebt = await response.json();
                setDebts(debts.map((d) => (d.id === debt.id ? updatedDebt : d)));
            }
        } catch (error) {
            console.error("Error al actualizar deuda:", error);
        }
        setConfirmDialog({ open: false, debt: null, action: null });
    };

    const handleDelete = async (debt: Debt) => {
        try {
            const response = await fetch(`/api/debts/${debt.id}`, {
                method: "DELETE",
            });

            if (response.ok) {
                setDebts(debts.filter((d) => d.id !== debt.id));
            }
        } catch (error) {
            console.error("Error al eliminar deuda:", error);
        }
        setConfirmDialog({ open: false, debt: null, action: null });
    };

    // Calcular totales
    const totalOwed = debts
        .filter((d) => !d.isPaid)
        .reduce((sum, d) => sum + Number(d.amount), 0);
    const totalPaid = debts
        .filter((d) => d.isPaid)
        .reduce((sum, d) => sum + Number(d.amount), 0);
    const pendingCount = debts.filter((d) => !d.isPaid).length;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <main className="min-h-screen px-4 pt-2 pb-24">
            <header className="mb-6">
                <h1 className="text-2xl font-bold">Deudores</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Personas que te deben dinero
                </p>
            </header>

            {/* Resumen */}
            <div className="grid grid-cols-3 gap-3 mb-6">
                <Card className="border-0 bg-card p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-chart-1/20 flex items-center justify-center">
                            <DollarSign className="w-4 h-4 text-chart-1" />
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground">Te deben</p>
                    <p className="text-lg font-bold text-chart-1">
                        ${totalOwed.toLocaleString()}
                    </p>
                </Card>

                <Card className="border-0 bg-card p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground">Cobrado</p>
                    <p className="text-lg font-bold text-primary">
                        ${totalPaid.toLocaleString()}
                    </p>
                </Card>

                <Card className="border-0 bg-card p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-destructive/20 flex items-center justify-center">
                            <Clock className="w-4 h-4 text-destructive" />
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground">Pendientes</p>
                    <p className="text-lg font-bold text-destructive">{pendingCount}</p>
                </Card>
            </div>

            {/* Botón Agregar */}
            <Button
                onClick={() => setIsSheetOpen(true)}
                className="w-full mb-6 h-12 gradient-primary text-lg font-semibold"
            >
                <Plus className="w-5 h-5 mr-2" />
                Agregar Deudor
            </Button>

            {/* Lista de Deudores */}
            {debts.length === 0 ? (
                <div className="text-center py-12">
                    <Users className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                    <p className="text-lg font-medium text-muted-foreground">
                        Sin deudores
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                        Agrega a las personas que te deben dinero
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {/* Pendientes */}
                    {debts.filter((d) => !d.isPaid).length > 0 && (
                        <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-3 px-1">
                                Pendientes
                            </h3>
                            <div className="space-y-2">
                                {debts
                                    .filter((d) => !d.isPaid)
                                    .map((debt) => (
                                        <DebtCard
                                            key={debt.id}
                                            debt={debt}
                                            onMarkPaid={() => setConfirmDialog({ open: true, debt, action: 'pay' })}
                                            onDelete={() => setConfirmDialog({ open: true, debt, action: 'delete' })}
                                        />
                                    ))}
                            </div>
                        </div>
                    )}

                    {/* Pagados */}
                    {debts.filter((d) => d.isPaid).length > 0 && (
                        <div className="mt-6">
                            <h3 className="text-sm font-medium text-muted-foreground mb-3 px-1">
                                Cobrados
                            </h3>
                            <div className="space-y-2">
                                {debts
                                    .filter((d) => d.isPaid)
                                    .map((debt) => (
                                        <DebtCard
                                            key={debt.id}
                                            debt={debt}
                                            onMarkPaid={() => handleMarkAsPaid(debt)}
                                            onDelete={() => setConfirmDialog({ open: true, debt, action: 'delete' })}
                                        />
                                    ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Sheet para agregar deudor */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl px-6 pb-8">
                    <SheetHeader className="pb-4">
                        <SheetTitle className="text-xl">Agregar Deudor</SheetTitle>
                    </SheetHeader>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Nombre */}
                        <div className="space-y-2">
                            <Label htmlFor="personName" className="text-muted-foreground">
                                Nombre de la persona
                            </Label>
                            <Input
                                id="personName"
                                placeholder="¿Quién te debe?"
                                value={personName}
                                onChange={(e) => setPersonName(e.target.value)}
                                className="h-14 text-lg bg-muted border-0 rounded-xl"
                                required
                            />
                        </div>

                        {/* Monto */}
                        <div className="space-y-2">
                            <Label htmlFor="amount" className="text-muted-foreground">
                                Monto
                            </Label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-muted-foreground">
                                    $
                                </span>
                                <Input
                                    id="amount"
                                    type="number"
                                    inputMode="decimal"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="pl-10 h-16 text-3xl font-bold bg-muted border-0 rounded-xl"
                                    required
                                />
                            </div>
                        </div>

                        {/* Descripción */}
                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-muted-foreground">
                                Descripción (opcional)
                            </Label>
                            <Input
                                id="description"
                                placeholder="¿Por qué te debe?"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="h-14 text-lg bg-muted border-0 rounded-xl"
                            />
                        </div>

                        {/* Fecha límite */}
                        <div className="space-y-2">
                            <Label htmlFor="dueDate" className="text-muted-foreground flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Fecha límite (opcional)
                            </Label>
                            <Input
                                id="dueDate"
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="h-14 text-lg bg-muted border-0 rounded-xl"
                            />
                        </div>

                        {/* Botón */}
                        <Button
                            type="submit"
                            disabled={isSubmitting || !personName || !amount}
                            className="w-full h-14 text-lg font-semibold rounded-xl gradient-primary"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                "Agregar Deudor"
                            )}
                        </Button>
                    </form>
                </SheetContent>
            </Sheet>

            {/* Diálogo de Confirmación */}
            <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ open, debt: null, action: null })}>
                <DialogContent className="max-w-[90vw] rounded-2xl sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {confirmDialog.action === 'pay' ? '¿Marcar como cobrado?' : '¿Eliminar deudor?'}
                        </DialogTitle>
                        <DialogDescription>
                            {confirmDialog.action === 'pay' ? (
                                <>
                                    Se marcará la deuda de{" "}
                                    <span className="font-medium text-foreground">
                                        {confirmDialog.debt?.personName}
                                    </span>{" "}
                                    por ${Number(confirmDialog.debt?.amount).toLocaleString()} como cobrada.
                                </>
                            ) : (
                                <>
                                    Se eliminará permanentemente la deuda de{" "}
                                    <span className="font-medium text-foreground">
                                        {confirmDialog.debt?.personName}
                                    </span>.
                                </>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex-row gap-2 sm:flex-row">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => setConfirmDialog({ open: false, debt: null, action: null })}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant={confirmDialog.action === 'pay' ? 'default' : 'destructive'}
                            className={cn("flex-1", confirmDialog.action === 'pay' && "gradient-income")}
                            onClick={() => {
                                if (confirmDialog.debt) {
                                    if (confirmDialog.action === 'pay') {
                                        handleMarkAsPaid(confirmDialog.debt);
                                    } else {
                                        handleDelete(confirmDialog.debt);
                                    }
                                }
                            }}
                        >
                            {confirmDialog.action === 'pay' ? (
                                <>
                                    <Check className="w-4 h-4 mr-2" />
                                    Cobrado
                                </>
                            ) : (
                                <>
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Eliminar
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </main>
    );
}

// Componente de tarjeta de deuda
function DebtCard({
    debt,
    onMarkPaid,
    onDelete,
}: {
    debt: Debt;
    onMarkPaid: () => void;
    onDelete: () => void;
}) {
    return (
        <Card className={cn(
            "flex items-center gap-3 p-4 border-0 card-hover",
            debt.isPaid ? "bg-muted/50" : "bg-card"
        )}>
            {/* Avatar */}
            <div
                className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold",
                    debt.isPaid ? "bg-chart-1/20 text-chart-1" : "bg-primary/20 text-primary"
                )}
            >
                {debt.personName.charAt(0).toUpperCase()}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <h3 className={cn(
                    "font-medium truncate",
                    debt.isPaid && "line-through text-muted-foreground"
                )}>
                    {debt.personName}
                </h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {debt.description && (
                        <>
                            <span className="truncate max-w-[120px]">{debt.description}</span>
                            <span>•</span>
                        </>
                    )}
                    {debt.dueDate && (
                        <span className={cn(
                            new Date(debt.dueDate) < new Date() && !debt.isPaid && "text-destructive"
                        )}>
                            {format(new Date(debt.dueDate), "d MMM", { locale: es })}
                        </span>
                    )}
                    {debt.isPaid && debt.paidDate && (
                        <span className="text-chart-1">
                            Cobrado {format(new Date(debt.paidDate), "d MMM", { locale: es })}
                        </span>
                    )}
                </div>
            </div>

            {/* Monto */}
            <div className="text-right flex-shrink-0">
                <p
                    className={cn(
                        "font-bold text-lg",
                        debt.isPaid ? "text-chart-1 line-through" : "text-chart-1"
                    )}
                >
                    ${Number(debt.amount).toLocaleString()}
                </p>
            </div>

            {/* Acciones */}
            <div className="flex gap-1 flex-shrink-0">
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                        "h-9 w-9",
                        debt.isPaid
                            ? "text-muted-foreground hover:text-foreground"
                            : "text-chart-1 hover:bg-chart-1/10"
                    )}
                    onClick={onMarkPaid}
                >
                    <Check className="w-4 h-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={onDelete}
                >
                    <Trash2 className="w-4 h-4" />
                </Button>
            </div>
        </Card>
    );
}
