"use client";

import { useEffect } from "react";
import { TransactionList } from "@/components/transaction-list";
import { useTransactionStore } from "@/lib/store";
import { Loader2 } from "lucide-react";

export default function TransactionsPage() {
    const { transactions, setTransactions, isLoading, setLoading } = useTransactionStore();

    useEffect(() => {
        const fetchTransactions = async () => {
            if (transactions.length > 0) return; // Ya cargadas

            setLoading(true);
            try {
                const response = await fetch("/api/transactions");
                if (response.ok) {
                    const data = await response.json();
                    setTransactions(data);
                }
            } catch (error) {
                console.error("Error al cargar transacciones:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTransactions();
    }, [transactions.length, setTransactions, setLoading]);

    if (isLoading && transactions.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <main className="min-h-screen px-4 pt-6 pb-24">
            <header className="mb-6">
                <h1 className="text-2xl font-bold">Historial de Transacciones</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Todas tus transacciones de los últimos 6 meses
                </p>
            </header>

            <TransactionList transactions={transactions} />
        </main>
    );
}
