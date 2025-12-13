"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Bell,
    Download,
    Smartphone,
    Shield,
    Moon,
    ChevronRight,
    Check,
    X
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
    const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | null>(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);

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

    return (
        <main className="min-h-screen px-4 pt-6 pb-24">
            <header className="mb-6">
                <h1 className="text-2xl font-bold">Ajustes</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Personaliza tu experiencia en FinTrack
                </p>
            </header>

            <div className="space-y-4">
                {/* Instalar App */}
                {isInstallable && (
                    <Card className="border-0 bg-gradient-to-r from-primary/20 to-primary/5">
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
                <Card className="border-0 bg-card">
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
                <Card className="border-0 bg-card">
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
                        <div className="flex items-center justify-between py-2">
                            <span className="text-muted-foreground">Tema</span>
                            <div className="flex items-center gap-2">
                                <Moon className="w-4 h-4" />
                                <span className="font-medium">Oscuro</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Seguridad */}
                <Card className="border-0 bg-card">
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
                <Card className="border-0 bg-card">
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
