"use client";

import { useEffect } from "react";

export function NotificationProvider() {
    useEffect(() => {
        // Solicitar permiso de notificaciones
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }

        // Registrar service worker
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker
                .register("/sw.js")
                .then((registration) => {
                    console.log("Service Worker registrado:", registration.scope);
                })
                .catch((error) => {
                    console.error("Error al registrar Service Worker:", error);
                });
        }

        // Programar recordatorio diario a las 8 PM
        scheduleReminderNotification();
    }, []);

    const scheduleReminderNotification = () => {
        if (!("Notification" in window) || Notification.permission !== "granted") {
            return;
        }

        const now = new Date();
        const reminderTime = new Date();
        reminderTime.setHours(20, 0, 0, 0); // 8 PM

        // Si ya pasaron las 8 PM, programar para mañana
        if (now > reminderTime) {
            reminderTime.setDate(reminderTime.getDate() + 1);
        }

        const timeUntilReminder = reminderTime.getTime() - now.getTime();

        // Programar la notificación
        setTimeout(() => {
            showReminderNotification();
            // Programar la siguiente para mañana
            setInterval(showReminderNotification, 24 * 60 * 60 * 1000);
        }, timeUntilReminder);
    };

    const showReminderNotification = () => {
        if (Notification.permission === "granted") {
            new Notification("💰 Recordatorio FinTrack", {
                body: "¿Ya registraste tus gastos de hoy?",
                icon: "/icon-192x192.png",
                badge: "/icon-192x192.png",
                tag: "daily-reminder",
                requireInteraction: true,
            });
        }
    };

    return null;
}
