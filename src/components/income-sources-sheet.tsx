"use client";

import { useState } from "react";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { DollarSign, Plus, Loader2 } from "lucide-react";
import { useIncomeStore } from "@/lib/income-store";
import { useAccountStore } from "@/lib/account-store";
import { cn } from "@/lib/utils";

interface IncomeSourcesSheetProps {
    children?: React.ReactNode;
    onSuccess?: () => void;
}

export function IncomeSourcesSheet({ children, onSuccess }: IncomeSourcesSheetProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { fetchIncomeSources, fetchForecast } = useIncomeStore();
    const { activeAccountId } = useAccountStore();

    // Form state
    const [name, setName] = useState("");
    const [type, setType] = useState<"fixed" | "variable">("fixed");
    const [baseAmount, setBaseAmount] = useState("");
    const [frequency, setFrequency] = useState<"weekly" | "biweekly" | "monthly" | "custom">("biweekly");
    const [payDay1, setPayDay1] = useState("15");
    const [payDay2, setPayDay2] = useState("30");
    const [minExpected, setMinExpected] = useState("");
    const [maxExpected, setMaxExpected] = useState("");
    const [includeInForecast, setIncludeInForecast] = useState(true);

    const resetForm = () => {
        setName("");
        setType("fixed");
        setBaseAmount("");
        setFrequency("biweekly");
        setPayDay1("15");
        setPayDay2("30");
        setMinExpected("");
        setMaxExpected("");
        setIncludeInForecast(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !baseAmount) return;

        setIsSubmitting(true);

        try {
            // Construir array de días de pago
            const payDays: number[] = [];
            if (frequency === "biweekly" || frequency === "custom") {
                if (payDay1) payDays.push(parseInt(payDay1));
                if (payDay2) payDays.push(parseInt(payDay2));
            } else if (frequency === "monthly") {
                if (payDay1) payDays.push(parseInt(payDay1));
            } else if (frequency === "weekly") {
                payDays.push(7, 14, 21, 28);
            }

            const response = await fetch("/api/income-sources", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    type,
                    baseAmount: parseFloat(baseAmount),
                    frequency,
                    payDays: payDays.length > 0 ? payDays : [30],
                    minExpected: minExpected ? parseFloat(minExpected) : undefined,
                    maxExpected: maxExpected ? parseFloat(maxExpected) : undefined,
                    accountId: activeAccountId,
                    includeInForecast
                })
            });

            if (!response.ok) {
                throw new Error("Error al crear fuente de ingreso");
            }

            // Refrescar datos
            await fetchIncomeSources(activeAccountId);
            await fetchForecast(activeAccountId);

            resetForm();
            setOpen(false);
            onSuccess?.();
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                {children || (
                    <Button size="sm" className="gap-2">
                        <Plus className="w-4 h-4" />
                        Agregar Ingreso
                    </Button>
                )}
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[90vh] overflow-y-auto rounded-t-3xl">
                <SheetHeader className="mb-6">
                    <SheetTitle className="flex items-center gap-2 text-xl">
                        <DollarSign className="w-6 h-6 text-chart-1" />
                        Configurar Fuente de Ingreso
                    </SheetTitle>
                    <SheetDescription>
                        Configura tu salario, comisiones u otras fuentes de ingreso
                    </SheetDescription>
                </SheetHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Nombre */}
                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre del ingreso</Label>
                        <Input
                            id="name"
                            placeholder="Ej: Salario ACME, Comisiones ventas..."
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    {/* Tipo */}
                    <div className="space-y-3">
                        <Label>Tipo de ingreso</Label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setType("fixed")}
                                className={cn(
                                    "p-4 rounded-xl border-2 text-left transition-all",
                                    type === "fixed"
                                        ? "border-chart-1 bg-chart-1/10"
                                        : "border-border hover:border-chart-1/50"
                                )}
                            >
                                <p className="font-medium">💰 Fijo</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Salario, renta, pensión
                                </p>
                            </button>
                            <button
                                type="button"
                                onClick={() => setType("variable")}
                                className={cn(
                                    "p-4 rounded-xl border-2 text-left transition-all",
                                    type === "variable"
                                        ? "border-yellow-500 bg-yellow-500/10"
                                        : "border-border hover:border-yellow-500/50"
                                )}
                            >
                                <p className="font-medium">📊 Variable</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Comisiones, bonos, freelance
                                </p>
                            </button>
                        </div>
                    </div>

                    {/* Monto */}
                    <div className="space-y-2">
                        <Label htmlFor="baseAmount">
                            {type === "fixed" ? "Monto fijo" : "Monto promedio esperado"}
                        </Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                            <Input
                                id="baseAmount"
                                type="number"
                                placeholder="0.00"
                                value={baseAmount}
                                onChange={(e) => setBaseAmount(e.target.value)}
                                className="pl-8"
                                required
                            />
                        </div>
                    </div>

                    {/* Rango para variables */}
                    {type === "variable" && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="minExpected">Mínimo esperado</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                    <Input
                                        id="minExpected"
                                        type="number"
                                        placeholder="0"
                                        value={minExpected}
                                        onChange={(e) => setMinExpected(e.target.value)}
                                        className="pl-8"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="maxExpected">Máximo esperado</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                    <Input
                                        id="maxExpected"
                                        type="number"
                                        placeholder="0"
                                        value={maxExpected}
                                        onChange={(e) => setMaxExpected(e.target.value)}
                                        className="pl-8"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Frecuencia */}
                    <div className="space-y-2">
                        <Label>Frecuencia de pago</Label>
                        <Select value={frequency} onValueChange={(value) => setFrequency(value as typeof frequency)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="weekly">Semanal</SelectItem>
                                <SelectItem value="biweekly">Quincenal</SelectItem>
                                <SelectItem value="monthly">Mensual</SelectItem>
                                <SelectItem value="custom">Personalizado</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Días de pago */}
                    {(frequency === "biweekly" || frequency === "custom") && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="payDay1">Primer día de pago</Label>
                                <Select value={payDay1} onValueChange={setPayDay1}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                                            <SelectItem key={day} value={day.toString()}>
                                                Día {day}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="payDay2">Segundo día de pago</Label>
                                <Select value={payDay2} onValueChange={setPayDay2}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                                            <SelectItem key={day} value={day.toString()}>
                                                Día {day}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}

                    {frequency === "monthly" && (
                        <div className="space-y-2">
                            <Label htmlFor="payDay1">Día de pago</Label>
                            <Select value={payDay1} onValueChange={setPayDay1}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                                        <SelectItem key={day} value={day.toString()}>
                                            Día {day}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Incluir en forecast */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                        <div>
                            <p className="font-medium">Incluir en proyecciones</p>
                            <p className="text-sm text-muted-foreground">
                                Usar este ingreso para calcular el forecast
                            </p>
                        </div>
                        <Switch
                            checked={includeInForecast}
                            onCheckedChange={setIncludeInForecast}
                        />
                    </div>

                    {/* Submit */}
                    <Button
                        type="submit"
                        className="w-full h-12 text-lg gradient-income"
                        disabled={isSubmitting || !name || !baseAmount}
                    >
                        {isSubmitting ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            "Guardar Fuente de Ingreso"
                        )}
                    </Button>
                </form>
            </SheetContent>
        </Sheet>
    );
}
