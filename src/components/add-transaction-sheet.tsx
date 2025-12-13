"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
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
import { Badge } from "@/components/ui/badge";
import {
    ArrowDownLeft,
    ArrowUpRight,
    Loader2,
    Calendar,
    RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTransactionStore } from "@/lib/store";

const categories = [
    { value: "food", label: "🍔 Food", emoji: "🍔" },
    { value: "transport", label: "🚗 Transport", emoji: "🚗" },
    { value: "entertainment", label: "🎮 Entertainment", emoji: "🎮" },
    { value: "health", label: "🏥 Health", emoji: "🏥" },
    { value: "shopping", label: "🛍️ Shopping", emoji: "🛍️" },
    { value: "utilities", label: "💡 Utilities", emoji: "💡" },
    { value: "salary", label: "💰 Salary", emoji: "💰" },
    { value: "freelance", label: "💻 Freelance", emoji: "💻" },
    { value: "investment", label: "📈 Investment", emoji: "📈" },
    { value: "other", label: "📦 Other", emoji: "📦" },
];

const recurrenceOptions = [
    { value: "none", label: "One-time" },
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
];

interface AddTransactionSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
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

                // Reset form
                setAmount("");
                setTitle("");
                setCategory("other");
                setDate(new Date().toISOString().split("T")[0]);
                setRecurrence("none");

                onOpenChange(false);
                router.refresh();
            }
        } catch (error) {
            console.error("Error adding transaction:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl px-6 pb-8 overflow-y-auto">
                <SheetHeader className="pb-4">
                    <SheetTitle className="text-xl">Add Transaction</SheetTitle>
                </SheetHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Type Toggle */}
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
                            Expense
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
                            Income
                        </button>
                    </div>

                    {/* Amount Input */}
                    <div className="space-y-2">
                        <Label htmlFor="amount" className="text-muted-foreground">Amount</Label>
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

                    {/* Title Input */}
                    <div className="space-y-2">
                        <Label htmlFor="title" className="text-muted-foreground">Description</Label>
                        <Input
                            id="title"
                            placeholder="What was this for?"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="h-14 text-lg bg-muted border-0 rounded-xl"
                            required
                        />
                    </div>

                    {/* Category Selection */}
                    <div className="space-y-2">
                        <Label className="text-muted-foreground">Category</Label>
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
                                        {cat.value}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Date Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="date" className="text-muted-foreground flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Date
                        </Label>
                        <Input
                            id="date"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="h-14 text-lg bg-muted border-0 rounded-xl"
                        />
                    </div>

                    {/* Recurrence Selection */}
                    <div className="space-y-2">
                        <Label className="text-muted-foreground flex items-center gap-2">
                            <RefreshCw className="w-4 h-4" />
                            Frequency
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

                    {/* Submit Button */}
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
                            `Add ${type === "income" ? "Income" : "Expense"}`
                        )}
                    </Button>
                </form>
            </SheetContent>
        </Sheet>
    );
}
