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
        // Check notification permission
        if ("Notification" in window) {
            setNotificationPermission(Notification.permission);
        }

        // Check if app is installable
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
                new Notification("🔔 Notifications Enabled!", {
                    body: "You'll receive daily reminders at 8 PM",
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
                <h1 className="text-2xl font-bold">Settings</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Customize your FinTrack experience
                </p>
            </header>

            <div className="space-y-4">
                {/* Install App */}
                {isInstallable && (
                    <Card className="border-0 bg-gradient-to-r from-primary/20 to-primary/5">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                                        <Download className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">Install FinTrack</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Add to home screen for quick access
                                        </p>
                                    </div>
                                </div>
                                <Button onClick={installApp} size="sm" className="gradient-primary">
                                    Install
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Notifications */}
                <Card className="border-0 bg-card">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Bell className="w-5 h-5" />
                            Notifications
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Daily Reminders</p>
                                <p className="text-sm text-muted-foreground">
                                    Get reminded at 8 PM to log your expenses
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
                                        Enabled
                                    </>
                                ) : notificationPermission === "denied" ? (
                                    <>
                                        <X className="w-3 h-3" />
                                        Blocked
                                    </>
                                ) : (
                                    "Not set"
                                )}
                            </Badge>
                        </div>

                        {notificationPermission !== "granted" && notificationPermission !== "denied" && (
                            <Button
                                onClick={requestNotificationPermission}
                                variant="outline"
                                className="w-full"
                            >
                                Enable Notifications
                            </Button>
                        )}

                        {notificationPermission === "denied" && (
                            <p className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
                                Notifications are blocked. Please enable them in your browser settings.
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* App Info */}
                <Card className="border-0 bg-card">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Smartphone className="w-5 h-5" />
                            App Info
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center justify-between py-2">
                            <span className="text-muted-foreground">Version</span>
                            <span className="font-medium">1.0.0</span>
                        </div>
                        <div className="flex items-center justify-between py-2">
                            <span className="text-muted-foreground">Theme</span>
                            <div className="flex items-center gap-2">
                                <Moon className="w-4 h-4" />
                                <span className="font-medium">Dark</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Security */}
                <Card className="border-0 bg-card">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Shield className="w-5 h-5" />
                            Privacy & Security
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-start gap-3 p-3 rounded-xl bg-muted">
                            <span className="text-2xl">🔒</span>
                            <div>
                                <p className="font-medium">Your data is private</p>
                                <p className="text-sm text-muted-foreground">
                                    All your financial data is stored securely and never shared with third parties.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* About */}
                <Card className="border-0 bg-card">
                    <CardContent className="p-4">
                        <button className="flex items-center justify-between w-full">
                            <span>About FinTrack</span>
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </button>
                    </CardContent>
                </Card>

                {/* Footer */}
                <div className="text-center pt-8 pb-4">
                    <p className="text-sm text-muted-foreground">
                        Made with 💜 for better financial health
                    </p>
                </div>
            </div>
        </main>
    );
}
