import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { debts, NewDebt } from '@/lib/db/schema';
import { desc, eq, and } from 'drizzle-orm';
import { getCurrentUserId } from '@/lib/auth-helpers';

// Prevent static generation
export const dynamic = 'force-dynamic';

// GET - Obtener todas las deudas del usuario
export async function GET() {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const result = await db
            .select()
            .from(debts)
            .where(eq(debts.userId, userId))
            .orderBy(desc(debts.createdAt));

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error al obtener deudas:', error);
        return NextResponse.json(
            { error: 'Error al obtener las deudas' },
            { status: 500 }
        );
    }
}

// POST - Crear nueva deuda
export async function POST(request: NextRequest) {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const body = await request.json();

        const newDebt: NewDebt = {
            userId,
            personName: body.personName,
            amount: body.amount,
            description: body.description || null,
            dueDate: body.dueDate ? new Date(body.dueDate) : null,
            isPaid: false,
        };

        const result = await db
            .insert(debts)
            .values(newDebt)
            .returning();

        return NextResponse.json(result[0], { status: 201 });
    } catch (error) {
        console.error('Error al crear deuda:', error);
        return NextResponse.json(
            { error: 'Error al crear la deuda' },
            { status: 500 }
        );
    }
}
