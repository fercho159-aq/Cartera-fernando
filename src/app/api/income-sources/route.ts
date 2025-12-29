import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { incomeSources } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { getServerSession } from '@/lib/auth-helpers';

// GET - Obtener todas las fuentes de ingreso
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const accountId = searchParams.get('accountId');

        let sources;
        if (accountId) {
            sources = await db
                .select()
                .from(incomeSources)
                .where(
                    and(
                        eq(incomeSources.userId, parseInt(session.user.id)),
                        eq(incomeSources.accountId, parseInt(accountId))
                    )
                )
                .orderBy(incomeSources.createdAt);
        } else {
            sources = await db
                .select()
                .from(incomeSources)
                .where(
                    and(
                        eq(incomeSources.userId, parseInt(session.user.id)),
                        isNull(incomeSources.accountId)
                    )
                )
                .orderBy(incomeSources.createdAt);
        }

        return NextResponse.json(sources);
    } catch (error) {
        console.error('Error al obtener fuentes de ingreso:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}

// POST - Crear nueva fuente de ingreso
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }

        const body = await request.json();
        const {
            name,
            type = 'fixed',
            baseAmount,
            frequency = 'monthly',
            payDays = [15, 30],
            minExpected,
            maxExpected,
            accountId,
            includeInForecast = true
        } = body;

        if (!name || !baseAmount) {
            return NextResponse.json(
                { error: 'Nombre y monto base son requeridos' },
                { status: 400 }
            );
        }

        const [newSource] = await db
            .insert(incomeSources)
            .values({
                userId: parseInt(session.user.id),
                accountId: accountId ? parseInt(accountId) : null,
                name,
                type,
                baseAmount: baseAmount.toString(),
                frequency,
                payDays: JSON.stringify(payDays),
                minExpected: minExpected?.toString() || null,
                maxExpected: maxExpected?.toString() || null,
                includeInForecast
            })
            .returning();

        return NextResponse.json(newSource, { status: 201 });
    } catch (error) {
        console.error('Error al crear fuente de ingreso:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}
