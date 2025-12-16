import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { debts, NewDebt, accountMembers } from '@/lib/db/schema';
import { desc, eq, and, sql } from 'drizzle-orm';
import { getCurrentUserId } from '@/lib/auth-helpers';

// Prevent static generation
export const dynamic = 'force-dynamic';

// GET - Obtener todas las deudas del usuario
export async function GET(request: NextRequest) {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        // Obtener accountId del query string
        const { searchParams } = new URL(request.url);
        const accountIdParam = searchParams.get('accountId');
        const accountId = accountIdParam ? parseInt(accountIdParam, 10) : null;

        // Si hay accountId, verificar que el usuario sea miembro
        if (accountId) {
            const [membership] = await db
                .select()
                .from(accountMembers)
                .where(
                    and(
                        eq(accountMembers.accountId, accountId),
                        eq(accountMembers.userId, userId)
                    )
                )
                .limit(1);

            if (!membership) {
                return NextResponse.json({ error: 'No tienes acceso a esta cuenta' }, { status: 403 });
            }
        }

        // Construir condición de filtrado
        const conditions = accountId
            ? eq(debts.accountId, accountId)
            : and(
                eq(debts.userId, userId),
                sql`${debts.accountId} IS NULL` // Solo deudas personales
            );

        const result = await db
            .select()
            .from(debts)
            .where(conditions)
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

        // Si hay accountId, verificar membresía
        if (body.accountId) {
            const [membership] = await db
                .select()
                .from(accountMembers)
                .where(
                    and(
                        eq(accountMembers.accountId, body.accountId),
                        eq(accountMembers.userId, userId)
                    )
                )
                .limit(1);

            if (!membership) {
                return NextResponse.json({ error: 'No tienes acceso a esta cuenta' }, { status: 403 });
            }
        }

        const newDebt: NewDebt = {
            userId,
            accountId: body.accountId || null,
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

