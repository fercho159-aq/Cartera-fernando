"use client";

import { useEffect } from "react";

export function NotificationProvider() {
    useEffect(() => {
        // Request notification permission
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }

        // Register service worker
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker
                .register("/sw.js")
                .then((registration) => {
                    console.log("Service Worker registered:", registration.scope);
                })
                .catch((error) => {
                    console.error("Service Worker registration failed:", error);
                });
        }

        // Schedule daily reminder at 8 PM
        scheduleReminderNotification();
    }, []);

    const scheduleReminderNotification = () => {
        if (!("Notification" in window) || Notification.permission !== "granted") {
            return;
        }

        const now = new Date();
        const reminderTime = new Date();
        reminderTime.setHours(20, 0, 0, 0); // 8 PM

        // If it's already past 8 PM today, schedule for tomorrow
        if (now > reminderTime) {
            reminderTime.setDate(reminderTime.getDate() + 1);
        }

        const timeUntilReminder = reminderTime.getTime() - now.getTime();

        // Schedule the notification
        setTimeout(() => {
            showReminderNotification();
            // Schedule the next one for tomorrow
            setInterval(showReminderNotification, 24 * 60 * 60 * 1000);
        }, timeUntilReminder);
    };

    const showReminderNotification = () => {
        if (Notification.permission === "granted") {
            new Notification("💰 FinTrack Reminder", {
                body: "Did you record your expenses today?",
                icon: "/icon-192x192.png",
                badge: "/icon-192x192.png",
                tag: "daily-reminder",
                requireInteraction: true,
            });
        }
    };

    return null;
}
