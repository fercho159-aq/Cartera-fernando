"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BarChart3, Plus, Users, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { AddTransactionSheet } from "./add-transaction-sheet";

export function BottomNav() {
    const pathname = usePathname();
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    // Ocultar nav en páginas de login y registro
    if (pathname === "/login" || pathname === "/register") {
        return null;
    }

    const navItems = [
        { href: "/", icon: Home, label: "Inicio" },
        { href: "/stats", icon: BarChart3, label: "Stats" },
        { href: "#", icon: Plus, label: "Agregar", isButton: true },
        { href: "/debts", icon: Users, label: "Deudores" },
        { href: "/settings", icon: Settings, label: "Ajustes" },
    ];

    return (
        <>
            <nav 
                className="fixed z-50 glass bg-card/80 border-t border-border safe-area-inset-bottom"
                style={{
                    bottom: 0,
                    left: 0,
                    right: 0,
                    position: 'fixed',
                }}
            >
                <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
                    {navItems.map((item) => {
                        if (item.isButton) {
                            return (
                                <button
                                    key={item.label}
                                    onClick={() => setIsSheetOpen(true)}
                                    className="relative -mt-8"
                                >
                                    {/* Efecto de pulso */}
                                    <div className="absolute inset-0 rounded-full bg-primary/30 pulse-ring" />
                                    <div className="relative flex items-center justify-center w-16 h-16 rounded-full gradient-primary shadow-lg shadow-primary/30 active:scale-95 transition-transform">
                                        <Plus className="w-7 h-7 text-primary-foreground" />
                                    </div>
                                </button>
                            );
                        }

                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors",
                                    isActive ? "text-primary" : "text-muted-foreground"
                                )}
                            >
                                <item.icon className="w-6 h-6" />
                                <span className="text-xs font-medium">{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>

            <AddTransactionSheet open={isSheetOpen} onOpenChange={setIsSheetOpen} />
        </>
    );
}
