
"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
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
    Plus,
    Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTransactionStore } from "@/lib/store";
import { useAccountStore } from "@/lib/account-store";
import { VoiceInput } from "./voice-input";


const recurrenceOptions = [
    { value: "none", label: "Una vez" },
    { value: "daily", label: "Diario" },
    { value: "weekly", label: "Semanal" },
    { value: "monthly", label: "Mensual" },
];

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
    const { activeAccountId, getActiveAccount } = useAccountStore();
    const activeAccount = getActiveAccount();

    const [type, setType] = useState<"income" | "expense">("expense");
    const [amount, setAmount] = useState("");
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("other");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [recurrence, setRecurrence] = useState("none");
    const [isLoading, setIsLoading] = useState(false);
    const [voiceError, setVoiceError] = useState<string | null>(null);

    // Categories state
    const [categories, setCategories] = useState<any[]>([]);
    const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);

    // Create Category state
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [newCategoryEmoji, setNewCategoryEmoji] = useState("🏷️");
    const [isCreating, setIsCreating] = useState(false);

    // Fetch categories
    const fetchCategories = async () => {
        try {
            const res = await fetch("/api/categories");
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    setCategories(data);
                }
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
        } finally {
            setIsCategoriesLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            fetchCategories();
        }
    }, [open]);

    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategoryName) return;

        setIsCreating(true);
        try {
            const res = await fetch("/api/categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newCategoryName,
                    label: newCategoryName,
                    icon: newCategoryEmoji, // Sending the emoji as the icon
                    type: type // Create with current type context
                })
            });

            if (res.ok) {
                const newCat = await res.json();
                await fetchCategories();
                setCategory(newCat.name); // Auto-select new category
                setIsCreatingCategory(false);
                setNewCategoryName("");
                setNewCategoryEmoji("🏷️");
            }
        } catch (error) {
            console.error("Error creating category:", error);
        } finally {
            setIsCreating(false);
        }
    };

    const handleScanDataLoaded = (data: { amount: string; title: string; category: string; date: string }) => {
        setAmount(data.amount);
        setTitle(data.title);
        setCategory(data.category);
        setDate(data.date);
        setType("expense");
        onOpenChange(true);
    };

    const handleVoiceResult = (result: { amount: number; title: string; category: string; type: "income" | "expense" }) => {
        setAmount(result.amount.toString());
        setTitle(result.title);
        setCategory(result.category);
        setType(result.type);
        setVoiceError(null);
    };

    const handleVoiceError = (error: string) => {
        setVoiceError(error);
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
                    accountId: activeAccountId,
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

    const getDisplayEmoji = (cat: any) => {
        if (!cat) return "📦";
        // If the icon is already an emoji (simple check)
        if (cat.icon && (/\p{Emoji}/u.test(cat.icon) || cat.icon.length <= 2)) {
            return cat.icon;
        }
        // Fallback to mapped
        return iconToEmoji[cat.icon] || iconToEmoji[cat.name] || "📦";
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
                        {activeAccount && (
                            <div className="flex items-center gap-2 mt-2 p-2 rounded-lg bg-primary/10 text-sm">
                                <Users className="w-4 h-4 text-primary" />
                                <span>Agregando a: <strong>{activeAccount.name}</strong></span>
                            </div>
                        )}
                    </SheetHeader>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Opciones rápidas: Escanear y Voz */}
                        <div className="space-y-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={goToScan}
                                className="w-full h-14 text-lg rounded-xl border-dashed border-2 hover:border-primary hover:bg-primary/5"
                            >
                                <Camera className="w-6 h-6 mr-3" />
                                📸 Escanear Ticket
                            </Button>

                            <VoiceInput
                                onResult={handleVoiceResult}
                                onError={handleVoiceError}
                            />

                            {voiceError && (
                                <p className="text-sm text-red-500 text-center">{voiceError}</p>
                            )}
                        </div>

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
                            <div className="flex justify-between items-center">
                                <Label className="text-muted-foreground">Categoría</Label>
                                <button
                                    type="button"
                                    onClick={() => setIsCreatingCategory(true)}
                                    className="text-xs text-primary hover:underline flex items-center gap-1"
                                >
                                    <Plus className="w-3 h-3" />
                                    Nueva categoría
                                </button>
                            </div>

                            <div className="grid grid-cols-5 gap-2">
                                {isCategoriesLoading ? (
                                    <div className="col-span-5 py-4 flex justify-center">
                                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                    </div>
                                ) : (
                                    <>
                                        {categories.map((cat) => (
                                            <button
                                                key={cat.id || cat.name} // Prefer unique ID but fallback to name
                                                type="button"
                                                onClick={() => setCategory(cat.name)}
                                                className={cn(
                                                    "flex flex-col items-center justify-center p-3 rounded-xl transition-all",
                                                    category === cat.name
                                                        ? "bg-primary text-primary-foreground scale-105 shadow-lg"
                                                        : "bg-muted hover:bg-accent"
                                                )}
                                            >
                                                <span className="text-2xl">{getDisplayEmoji(cat)}</span>
                                                <span className="text-[10px] mt-1 truncate w-full text-center capitalize">
                                                    {cat.label}
                                                </span>
                                            </button>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => setIsCreatingCategory(true)}
                                            className="flex flex-col items-center justify-center p-3 rounded-xl bg-muted/50 hover:bg-muted border border-dashed border-muted-foreground/30"
                                        >
                                            <Plus className="w-6 h-6 text-muted-foreground" />
                                            <span className="text-[10px] mt-1 text-muted-foreground">Crear</span>
                                        </button>
                                    </>
                                )}
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

                    {/* Dialog Crear Categoría */}
                    <Dialog open={isCreatingCategory} onOpenChange={setIsCreatingCategory}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Nueva Categoría</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleCreateCategory} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Nombre</Label>
                                    <Input
                                        placeholder="Ej: Gimnasio"
                                        value={newCategoryName}
                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Emoji</Label>
                                    <Input
                                        className="text-2xl h-14 w-20 text-center"
                                        value={newCategoryEmoji}
                                        onChange={(e) => setNewCategoryEmoji(e.target.value)}
                                        maxLength={2}
                                    />
                                    <p className="text-xs text-muted-foreground">Escribe un emoji para identificarla</p>
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="ghost" onClick={() => setIsCreatingCategory(false)}>
                                        Cancelar
                                    </Button>
                                    <Button type="submit" disabled={isCreating || !newCategoryName}>
                                        {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Crear Categoría"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>

                </SheetContent>
            </Sheet>
        </>
    );
}
