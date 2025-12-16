"use client";

import { useEffect, useCallback } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Users, User } from "lucide-react";
import { useAccountStore } from "@/lib/account-store";
import { cn } from "@/lib/utils";

export function AccountSelector() {
    const { accounts, activeAccountId, setAccounts, setActiveAccountId } = useAccountStore();

    const fetchAccounts = useCallback(async () => {
        try {
            const response = await fetch("/api/accounts");
            if (response.ok) {
                const data = await response.json();
                setAccounts(data);
            }
        } catch (error) {
            console.error("Error al cargar cuentas:", error);
        }
    }, [setAccounts]);

    useEffect(() => {
        fetchAccounts();
    }, [fetchAccounts]);

    const handleChange = (value: string) => {
        if (value === "personal") {
            setActiveAccountId(null);
        } else {
            setActiveAccountId(parseInt(value, 10));
        }
    };

    const activeAccount = accounts.find(a => a.id === activeAccountId);

    return (
        <Select
            value={activeAccountId?.toString() || "personal"}
            onValueChange={handleChange}
        >
            <SelectTrigger className={cn(
                "w-auto min-w-[140px] h-9 border-0 bg-muted/50 rounded-full text-sm font-medium",
                activeAccountId && "bg-primary/10 text-primary"
            )}>
                <div className="flex items-center gap-2">
                    {activeAccountId ? (
                        <Users className="w-4 h-4" />
                    ) : (
                        <User className="w-4 h-4" />
                    )}
                    <SelectValue placeholder="Cuenta">
                        {activeAccount?.name || "Personal"}
                    </SelectValue>
                </div>
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="personal">
                    <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>Cuenta Personal</span>
                    </div>
                </SelectItem>
                {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id.toString()}>
                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            <span>{account.name}</span>
                        </div>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
