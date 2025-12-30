
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { customCategories } from "@/lib/db/schema";
import { eq, or, isNull, and } from "drizzle-orm";

const DEFAULT_CATEGORIES = [
    { id: "food", name: "food", label: "Comida", icon: "Utensils", color: "#F97316", type: "expense" },
    { id: "transport", name: "transport", label: "Transporte", icon: "Car", color: "#3B82F6", type: "expense" },
    { id: "entertainment", name: "entertainment", label: "Entretenimiento", icon: "Gamepad2", color: "#A855F7", type: "expense" },
    { id: "health", name: "health", label: "Salud", icon: "HeartPulse", color: "#EF4444", type: "expense" },
    { id: "shopping", name: "shopping", label: "Compras", icon: "ShoppingBag", color: "#EC4899", type: "expense" },
    { id: "utilities", name: "utilities", label: "Servicios", icon: "Zap", color: "#EAB308", type: "expense" },
    { id: "housing", name: "housing", label: "Vivienda", icon: "Home", color: "#6366F1", type: "expense" },
    { id: "education", name: "education", label: "Educación", icon: "GraduationCap", color: "#14B8A6", type: "expense" },
    { id: "salary", name: "salary", label: "Salario", icon: "Banknote", color: "#22C55E", type: "income" },
    { id: "freelance", name: "freelance", label: "Freelance", icon: "Laptop", color: "#06B6D4", type: "income" },
    { id: "investment", name: "investment", label: "Inversión", icon: "TrendingUp", color: "#10B981", type: "income" },
    { id: "other", name: "other", label: "Otros", icon: "Box", color: "#64748B", type: "expense" } // Can be both, put default expense
];

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const userId = parseInt(session.user.id);

        // Obtener categorías personalizadas del usuario
        const userCategories = await db
            .select()
            .from(customCategories)
            .where(eq(customCategories.userId, userId));

        // Combinar defaults + custom
        // Transformar los defaults para adaptarlos al formato de la DB (aunque sea similar)
        const formattedDefaults = DEFAULT_CATEGORIES.map(cat => ({
            ...cat,
            isDefault: true,
            userId: null
        }));

        const formattedCustom = userCategories.map(cat => ({
            ...cat,
            id: cat.name, // Usamos el name como ID para compatibilidad con el frontend actual
            isDefault: false,
            dbId: cat.id // Guardamos el ID real de la DB por si acaso
        }));

        // Priorizar defaults si hay conflicto de nombres? No, custom debe sobrescribir o coexistir.
        // Simplemente las concatenamos.

        // Unificar lista
        const allCategories = [...formattedDefaults, ...formattedCustom];

        return NextResponse.json(allCategories);

    } catch (error) {
        console.error("Error fetching categories:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const body = await request.json();
        const { name, label, icon, color, type } = body;

        if (!name || !label) {
            return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
        }

        const userId = parseInt(session.user.id);

        // Verificar si ya existe con el mismo nombre para este usuario
        const existing = await db
            .select()
            .from(customCategories)
            .where(and(
                eq(customCategories.userId, userId),
                eq(customCategories.name, name)
            ));

        if (existing.length > 0) {
            return NextResponse.json({ error: "Ya tienes una categoría con este identificador" }, { status: 400 });
        }

        // Insertar
        const newCategory = await db.insert(customCategories).values({
            userId,
            name: name.toLowerCase().replace(/\s+/g, '_'), // Slugify simple
            label,
            icon: icon || "Tag",
            color: color || "#94A3B8",
            type: type || 'expense'
        }).returning();

        return NextResponse.json(newCategory[0]);

    } catch (error) {
        console.error("Error creating category:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
