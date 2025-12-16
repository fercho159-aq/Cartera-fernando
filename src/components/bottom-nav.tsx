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
                className="fixed z-50 nav-liquid safe-area-inset-bottom"
                style={{
                    bottom: 0,
                    left: 0,
                    right: 0,
                    position: 'fixed',
                }}
            >
                <div className="flex items-center justify-around h-20 max-w-lg mx-auto px-4">
                    {navItems.map((item) => {
                        if (item.isButton) {
                            return (
                                <button
                                    key={item.label}
                                    onClick={() => setIsSheetOpen(true)}
                                    className="relative -mt-10"
                                >
                                    {/* Efecto de pulso suave */}
                                    <div className="absolute inset-0 rounded-full bg-primary/20 pulse-ring" />
                                    {/* FAB con Liquid Glass */}
                                    <div className="relative flex items-center justify-center w-16 h-16 rounded-full fab-liquid active:scale-90 transition-transform">
                                        <Plus className="w-7 h-7 text-white" strokeWidth={2.5} />
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
                                    "flex flex-col items-center justify-center px-4 py-2 rounded-2xl transition-all duration-300",
                                    isActive
                                        ? "glass-pill text-primary"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <item.icon className={cn(
                                    "w-6 h-6 transition-transform duration-300",
                                    isActive && "scale-110"
                                )} strokeWidth={isActive ? 2.5 : 2} />
                                <span className={cn(
                                    "text-[11px] mt-1 font-medium transition-all duration-300",
                                    isActive ? "opacity-100" : "opacity-70"
                                )}>{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>

            <AddTransactionSheet open={isSheetOpen} onOpenChange={setIsSheetOpen} />
        </>
    );
}

