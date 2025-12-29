import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { commissionRecords, incomeSources } from '@/lib/db/schema';
import { eq, and, desc, gte } from 'drizzle-orm';
import { getServerSession } from '@/lib/auth-helpers';

// GET - Obtener registros de comisiones
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const incomeSourceId = searchParams.get('incomeSourceId');
        const months = parseInt(searchParams.get('months') || '12');

        // Calcular fecha límite
        const limitDate = new Date();
        limitDate.setMonth(limitDate.getMonth() - months);

        let records;
        if (incomeSourceId) {
            records = await db
                .select()
                .from(commissionRecords)
                .where(
                    and(
                        eq(commissionRecords.userId, parseInt(session.user.id)),
                        eq(commissionRecords.incomeSourceId, parseInt(incomeSourceId)),
                        gte(commissionRecords.createdAt, limitDate)
                    )
                )
                .orderBy(desc(commissionRecords.periodYear), desc(commissionRecords.periodMonth));
        } else {
            records = await db
                .select()
                .from(commissionRecords)
                .where(
                    and(
                        eq(commissionRecords.userId, parseInt(session.user.id)),
                        gte(commissionRecords.createdAt, limitDate)
                    )
                )
                .orderBy(desc(commissionRecords.periodYear), desc(commissionRecords.periodMonth));
        }

        return NextResponse.json(records);
    } catch (error) {
        console.error('Error al obtener comisiones:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}

// POST - Registrar nueva comisión
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }

        const body = await request.json();
        const {
            incomeSourceId,
            amount,
            periodMonth,
            periodYear,
            status = 'pending',
            notes
        } = body;

        if (!incomeSourceId || !amount || !periodMonth || !periodYear) {
            return NextResponse.json(
                { error: 'Faltan campos requeridos' },
                { status: 400 }
            );
        }

        // Verificar que la fuente de ingreso pertenece al usuario
        const [source] = await db
            .select()
            .from(incomeSources)
            .where(
                and(
                    eq(incomeSources.id, parseInt(incomeSourceId)),
                    eq(incomeSources.userId, parseInt(session.user.id))
                )
            );

        if (!source) {
            return NextResponse.json(
                { error: 'Fuente de ingreso no encontrada' },
                { status: 404 }
            );
        }

        const [newRecord] = await db
            .insert(commissionRecords)
            .values({
                incomeSourceId: parseInt(incomeSourceId),
                userId: parseInt(session.user.id),
                amount: amount.toString(),
                periodMonth,
                periodYear,
                status,
                notes,
                confirmedAt: status === 'confirmed' ? new Date() : null,
                paidAt: status === 'paid' ? new Date() : null
            })
            .returning();

        // Actualizar promedio de últimos 3 meses
        await updateAverageLast3Months(parseInt(incomeSourceId), parseInt(session.user.id));

        return NextResponse.json(newRecord, { status: 201 });
    } catch (error) {
        console.error('Error al crear comisión:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}

// Función auxiliar para calcular promedio de últimos 3 meses
async function updateAverageLast3Months(incomeSourceId: number, userId: number) {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const records = await db
        .select()
        .from(commissionRecords)
        .where(
            and(
                eq(commissionRecords.incomeSourceId, incomeSourceId),
                eq(commissionRecords.userId, userId),
                gte(commissionRecords.createdAt, threeMonthsAgo)
            )
        );

    if (records.length > 0) {
        const total = records.reduce((sum, r) => sum + Number(r.amount), 0);
        const average = total / records.length;

        await db
            .update(incomeSources)
            .set({ averageLast3Months: average.toString() })
            .where(eq(incomeSources.id, incomeSourceId));
    }
}
