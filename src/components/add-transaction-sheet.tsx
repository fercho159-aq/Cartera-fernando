"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    ArrowDownLeft,
    ArrowUpRight,
    Loader2,
    Calendar,
    RefreshCw,
    Camera,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTransactionStore } from "@/lib/store";

const categories = [
    { value: "food", label: "🍔 Comida", emoji: "🍔" },
    { value: "transport", label: "🚗 Transporte", emoji: "🚗" },
    { value: "entertainment", label: "🎮 Entretenimiento", emoji: "🎮" },
    { value: "health", label: "🏥 Salud", emoji: "🏥" },
    { value: "shopping", label: "🛍️ Compras", emoji: "🛍️" },
    { value: "utilities", label: "💡 Servicios", emoji: "💡" },
    { value: "salary", label: "💰 Salario", emoji: "💰" },
    { value: "freelance", label: "💻 Freelance", emoji: "💻" },
    { value: "investment", label: "📈 Inversión", emoji: "📈" },
    { value: "other", label: "📦 Otro", emoji: "📦" },
];

const recurrenceOptions = [
    { value: "none", label: "Una vez" },
    { value: "daily", label: "Diario" },
    { value: "weekly", label: "Semanal" },
    { value: "monthly", label: "Mensual" },
];

interface AddTransactionSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

// Componente interno que usa useSearchParams
function ScanDataLoader({ onDataLoaded }: { onDataLoaded: (data: { amount: string; title: string; category: string; date: string }) => void }) {
    const searchParams = useSearchParams();
    const router = useRouter();
    
    useEffect(() => {
        const fromScan = searchParams.get('fromScan');
        if (fromScan === 'true') {
            const scannedData = sessionStorage.getItem('scannedTicket');
            if (scannedData) {
                try {
                    const data = JSON.parse(scannedData);
                    onDataLoaded({
                        amount: data.amount.toString(),
                        title: data.title,
                        category: data.category,
                        date: data.date,
                    });
                    sessionStorage.removeItem('scannedTicket');
                    router.replace('/');
                } catch (e) {
                    console.error('Error parsing scanned ticket:', e);
                }
            }
        }
    }, [searchParams, onDataLoaded, router]);
    
    return null;
}

export function AddTransactionSheet({ open, onOpenChange }: AddTransactionSheetProps) {
    const router = useRouter();
    const { addTransaction } = useTransactionStore();

    const [type, setType] = useState<"income" | "expense">("expense");
    const [amount, setAmount] = useState("");
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("other");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [recurrence, setRecurrence] = useState("none");
    const [isLoading, setIsLoading] = useState(false);

    const handleScanDataLoaded = (data: { amount: string; title: string; category: string; date: string }) => {
        setAmount(data.amount);
        setTitle(data.title);
        setCategory(data.category);
        setDate(data.date);
        setType("expense");
        onOpenChange(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || !title) return;

        setIsLoading(true);
        try {
            const response = await fetch("/api/transactions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: parseFloat(amount),
                    title,
                    type,
                    category,
                    date,
                    isRecurring: recurrence !== "none",
                    recurrencePeriod: recurrence,
                }),
            });

            if (response.ok) {
                const newTransaction = await response.json();
                addTransaction(newTransaction);

                // Limpiar formulario
                setAmount("");
                setTitle("");
                setCategory("other");
                setDate(new Date().toISOString().split("T")[0]);
                setRecurrence("none");

                onOpenChange(false);
                router.refresh();
            }
        } catch (error) {
            console.error("Error al agregar transacción:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const goToScan = () => {
        onOpenChange(false);
        router.push('/scan');
    };

    return (
        <>
            <Suspense fallback={null}>
                <ScanDataLoader onDataLoaded={handleScanDataLoaded} />
            </Suspense>
            
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl px-6 pb-8 overflow-y-auto">
                    <SheetHeader className="pb-4">
                        <SheetTitle className="text-xl">Agregar Transacción</SheetTitle>
                    </SheetHeader>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Botón de Escanear Ticket */}
                        <Button
                            type="button"
                            variant="outline"
                            onClick={goToScan}
                            className="w-full h-14 text-lg rounded-xl border-dashed border-2 hover:border-primary hover:bg-primary/5"
                        >
                            <Camera className="w-6 h-6 mr-3" />
                            📸 Escanear Ticket
                        </Button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">
                                    o ingresa manualmente
                                </span>
                            </div>
                        </div>

                        {/* Selector de Tipo */}
                        <div className="flex gap-2 p-1 bg-muted rounded-xl">
                            <button
                                type="button"
                                onClick={() => setType("expense")}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all",
                                    type === "expense"
                                        ? "bg-destructive text-white shadow-lg"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <ArrowUpRight className="w-5 h-5" />
                                Gasto
                            </button>
                            <button
                                type="button"
                                onClick={() => setType("income")}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all",
                                    type === "income"
                                        ? "gradient-income text-white shadow-lg"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <ArrowDownLeft className="w-5 h-5" />
                                Ingreso
                            </button>
                        </div>

                        {/* Campo de Monto */}
                        <div className="space-y-2">
                            <Label htmlFor="amount" className="text-muted-foreground">Monto</Label>
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

                        {/* Campo de Descripción */}
                        <div className="space-y-2">
                            <Label htmlFor="title" className="text-muted-foreground">Descripción</Label>
                            <Input
                                id="title"
                                placeholder="¿En qué gastaste?"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="h-14 text-lg bg-muted border-0 rounded-xl"
                                required
                            />
                        </div>

                        {/* Selección de Categoría */}
                        <div className="space-y-2">
                            <Label className="text-muted-foreground">Categoría</Label>
                            <div className="grid grid-cols-5 gap-2">
                                {categories.slice(0, 10).map((cat) => (
                                    <button
                                        key={cat.value}
                                        type="button"
                                        onClick={() => setCategory(cat.value)}
                                        className={cn(
                                            "flex flex-col items-center justify-center p-3 rounded-xl transition-all",
                                            category === cat.value
                                                ? "bg-primary text-primary-foreground scale-105 shadow-lg"
                                                : "bg-muted hover:bg-accent"
                                        )}
                                    >
                                        <span className="text-2xl">{cat.emoji}</span>
                                        <span className="text-[10px] mt-1 truncate w-full text-center">
                                            {cat.value === "food" ? "comida" :
                                                cat.value === "transport" ? "transp." :
                                                    cat.value === "entertainment" ? "entret." :
                                                        cat.value === "health" ? "salud" :
                                                            cat.value === "shopping" ? "compras" :
                                                                cat.value === "utilities" ? "servic." :
                                                                    cat.value === "salary" ? "salario" :
                                                                        cat.value === "freelance" ? "freelan." :
                                                                            cat.value === "investment" ? "invers." : "otro"}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Selección de Fecha */}
                        <div className="space-y-2">
                            <Label htmlFor="date" className="text-muted-foreground flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Fecha
                            </Label>
                            <Input
                                id="date"
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="h-14 text-lg bg-muted border-0 rounded-xl"
                            />
                        </div>

                        {/* Selección de Frecuencia */}
                        <div className="space-y-2">
                            <Label className="text-muted-foreground flex items-center gap-2">
                                <RefreshCw className="w-4 h-4" />
                                Frecuencia
                            </Label>
                            <div className="flex gap-2 flex-wrap">
                                {recurrenceOptions.map((opt) => (
                                    <Badge
                                        key={opt.value}
                                        variant={recurrence === opt.value ? "default" : "secondary"}
                                        className={cn(
                                            "px-4 py-2 text-sm cursor-pointer transition-all",
                                            recurrence === opt.value && "bg-primary"
                                        )}
                                        onClick={() => setRecurrence(opt.value)}
                                    >
                                        {opt.label}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        {/* Botón de Enviar */}
                        <Button
                            type="submit"
                            disabled={isLoading || !amount || !title}
                            className={cn(
                                "w-full h-14 text-lg font-semibold rounded-xl",
                                type === "income" ? "gradient-income" : "gradient-expense"
                            )}
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                `Agregar ${type === "income" ? "Ingreso" : "Gasto"}`
                            )}
                        </Button>
                    </form>
                </SheetContent>
            </Sheet>
        </>
    );
}
