"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Bell,
    Download,
    Smartphone,
    Shield,
    Moon,
    Sun,
    Monitor,
    Heart,
    ChevronRight,
    Check,
    X,
    User,
    LogOut,
    Loader2,
    Palette,
    Users,
    Image
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";
import Link from "next/link";

export default function SettingsPage() {
    const { data: session } = useSession();
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | null>(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    // Estado para íconos de la app
    const [activeIcon, setActiveIcon] = useState<string>('default');
    const [availableIcons, setAvailableIcons] = useState<{ id: string; name: string; preview: string }[]>([]);
    const [isChangingIcon, setIsChangingIcon] = useState(false);

    useEffect(() => {
        // Verificar permisos de notificación
        if ("Notification" in window) {
            setNotificationPermission(Notification.permission);
        }

        // Verificar si la app es instalable
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsInstallable(true);
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

        // Cargar íconos disponibles
        const loadIcons = async () => {
            try {
                const response = await fetch('/api/app-icon');
                if (response.ok) {
                    const data = await response.json();
                    setActiveIcon(data.activeIcon);
                    setAvailableIcons(data.availableIcons);
                }
            } catch (error) {
                console.error('Error loading icons:', error);
            }
        };
        loadIcons();

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        };
    }, []);

    const requestNotificationPermission = async () => {
        if ("Notification" in window) {
            const permission = await Notification.requestPermission();
            setNotificationPermission(permission);

            if (permission === "granted") {
                new Notification("🔔 ¡Notificaciones Activadas!", {
                    body: "Recibirás recordatorios diarios a las 8 PM",
                    icon: "/icon-192x192.png",
                });
            }
        }
    };

    const installApp = async () => {
        if (deferredPrompt) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (deferredPrompt as any).prompt();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { outcome } = await (deferredPrompt as any).userChoice;
            if (outcome === "accepted") {
                setIsInstallable(false);
            }
            setDeferredPrompt(null);
        }
    };

    const handleLogout = async () => {
        setIsLoggingOut(true);
        await signOut({ callbackUrl: "/login" });
    };

    const handleChangeIcon = async (iconId: string) => {
        if (iconId === activeIcon || isChangingIcon) return;

        setIsChangingIcon(true);
        try {
            const response = await fetch('/api/app-icon', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ iconSet: iconId })
            });

            if (response.ok) {
                const data = await response.json();
                setActiveIcon(data.activeIcon);
                // Mostrar mensaje de éxito
                alert('Ícono actualizado. Si tienes la app instalada, reinstala para ver los cambios.');
            }
        } catch (error) {
            console.error('Error changing icon:', error);
        } finally {
            setIsChangingIcon(false);
        }
    };

    const themeOptions = [
        { value: "light" as const, label: "Claro", icon: Sun },
        { value: "dark" as const, label: "Oscuro", icon: Moon },
        { value: "girly" as const, label: "Rosa", icon: Heart },
        { value: "system" as const, label: "Sistema", icon: Monitor },
    ];

    return (
        <main className="min-h-screen px-4 pt-6 pb-24">
            <header className="mb-6">
                <h1 className="text-2xl font-bold">Ajustes</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Personaliza tu experiencia en FinTrack
                </p>
            </header>

            <div className="space-y-4">
                {/* Cuenta de Usuario */}
                <Card className="border-0 bg-card shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <User className="w-5 h-5" />
                            Mi Cuenta
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4 p-3 rounded-xl bg-muted">
                            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                                <User className="w-6 h-6 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold truncate">
                                    {session?.user?.name || "Usuario"}
                                </p>
                                <p className="text-sm text-muted-foreground truncate">
                                    {session?.user?.email}
                                </p>
                            </div>
                        </div>

                        <Button
                            onClick={handleLogout}
                            variant="destructive"
                            className="w-full"
                            disabled={isLoggingOut}
                        >
                            {isLoggingOut ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Cerrando sesión...
                                </>
                            ) : (
                                <>
                                    <LogOut className="w-4 h-4 mr-2" />
                                    Cerrar Sesión
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* Cuentas Compartidas */}
                <Card className="border-0 bg-card shadow-sm">
                    <CardContent className="p-4">
                        <Link href="/accounts" className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                                    <Users className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <p className="font-medium">Cuentas Compartidas</p>
                                    <p className="text-sm text-muted-foreground">
                                        Comparte finanzas con otros
                                    </p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </Link>
                    </CardContent>
                </Card>

                {/* Tema */}
                <Card className="border-0 bg-card shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Palette className="w-5 h-5" />
                            Apariencia
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-4 gap-2">
                            {themeOptions.map((option) => {
                                const isActive = theme === option.value;
                                const Icon = option.icon;
                                return (
                                    <button
                                        key={option.value}
                                        onClick={() => setTheme(option.value)}
                                        className={cn(
                                            "flex flex-col items-center gap-2 p-4 rounded-xl transition-all",
                                            isActive
                                                ? "bg-primary text-primary-foreground shadow-lg"
                                                : "bg-muted hover:bg-muted/80"
                                        )}
                                    >
                                        <Icon className="w-6 h-6" />
                                        <span className="text-sm font-medium">{option.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                        <p className="text-xs text-muted-foreground mt-3 text-center">
                            Tema actual: {resolvedTheme === "dark" ? "🌙 Oscuro" : resolvedTheme === "girly" ? "💖 Rosa" : "☀️ Claro"}
                        </p>
                    </CardContent>
                </Card>

                {/* Ícono de la App */}
                {availableIcons.length > 0 && (
                    <Card className="border-0 bg-card shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Image className="w-5 h-5" />
                                Ícono de la App
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-3">
                                {availableIcons.map((icon) => {
                                    const isActive = activeIcon === icon.id;
                                    return (
                                        <button
                                            key={icon.id}
                                            onClick={() => handleChangeIcon(icon.id)}
                                            disabled={isChangingIcon}
                                            className={cn(
                                                "relative flex items-center gap-3 p-4 rounded-xl transition-all",
                                                isActive
                                                    ? "bg-primary/10 border-2 border-primary"
                                                    : "bg-muted hover:bg-muted/80 border-2 border-transparent"
                                            )}
                                        >
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={icon.preview}
                                                alt={icon.name}
                                                className="w-14 h-14 rounded-xl"
                                            />
                                            <div className="flex-1 text-left">
                                                <p className="font-medium">{icon.name}</p>
                                                {isActive && (
                                                    <p className="text-xs text-primary">Activo</p>
                                                )}
                                            </div>
                                            {isActive && (
                                                <Check className="w-5 h-5 text-primary" />
                                            )}
                                            {isChangingIcon && !isActive && (
                                                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                            <p className="text-xs text-muted-foreground mt-3 text-center">
                                Reinstala la app para aplicar el nuevo ícono
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Instalar App */}
                {isInstallable && (
                    <Card className="border-0 bg-gradient-to-r from-primary/20 to-primary/5 shadow-sm">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                                        <Download className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">Instalar FinTrack</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Agregar a pantalla de inicio
                                        </p>
                                    </div>
                                </div>
                                <Button onClick={installApp} size="sm" className="gradient-primary">
                                    Instalar
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Notificaciones */}
                <Card className="border-0 bg-card shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Bell className="w-5 h-5" />
                            Notificaciones
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Recordatorios Diarios</p>
                                <p className="text-sm text-muted-foreground">
                                    Recibe un recordatorio a las 8 PM
                                </p>
                            </div>
                            <Badge
                                variant={notificationPermission === "granted" ? "default" : "secondary"}
                                className={cn(
                                    "flex items-center gap-1",
                                    notificationPermission === "granted" && "bg-chart-1"
                                )}
                            >
                                {notificationPermission === "granted" ? (
                                    <>
                                        <Check className="w-3 h-3" />
                                        Activo
                                    </>
                                ) : notificationPermission === "denied" ? (
                                    <>
                                        <X className="w-3 h-3" />
                                        Bloqueado
                                    </>
                                ) : (
                                    "Sin configurar"
                                )}
                            </Badge>
                        </div>

                        {notificationPermission !== "granted" && notificationPermission !== "denied" && (
                            <Button
                                onClick={requestNotificationPermission}
                                variant="outline"
                                className="w-full"
                            >
                                Activar Notificaciones
                            </Button>
                        )}

                        {notificationPermission === "denied" && (
                            <p className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
                                Las notificaciones están bloqueadas. Por favor habilítalas en la configuración de tu navegador.
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Información de la App */}
                <Card className="border-0 bg-card shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Smartphone className="w-5 h-5" />
                            Información de la App
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center justify-between py-2">
                            <span className="text-muted-foreground">Versión</span>
                            <span className="font-medium">1.0.0</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Seguridad */}
                <Card className="border-0 bg-card shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Shield className="w-5 h-5" />
                            Privacidad y Seguridad
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-start gap-3 p-3 rounded-xl bg-muted">
                            <span className="text-2xl">🔒</span>
                            <div>
                                <p className="font-medium">Tus datos son privados</p>
                                <p className="text-sm text-muted-foreground">
                                    Toda tu información financiera se almacena de forma segura y nunca se comparte con terceros.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Acerca de */}
                <Card className="border-0 bg-card shadow-sm">
                    <CardContent className="p-4">
                        <button className="flex items-center justify-between w-full">
                            <span>Acerca de FinTrack</span>
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </button>
                    </CardContent>
                </Card>

                {/* Pie de página */}
                <div className="text-center pt-8 pb-4">
                    <p className="text-sm text-muted-foreground">
                        Hecho con 💜 para una mejor salud financiera
                    </p>
                </div>
            </div>
        </main>
    );
}
