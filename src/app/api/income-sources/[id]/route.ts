import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { incomeSources } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getServerSession } from '@/lib/auth-helpers';

// GET - Obtener una fuente de ingreso específica
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }

        const { id } = await params;

        const [source] = await db
            .select()
            .from(incomeSources)
            .where(
                and(
                    eq(incomeSources.id, parseInt(id)),
                    eq(incomeSources.userId, parseInt(session.user.id))
                )
            );

        if (!source) {
            return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
        }

        return NextResponse.json(source);
    } catch (error) {
        console.error('Error al obtener fuente de ingreso:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}

// PUT - Actualizar fuente de ingreso
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();

        const updateData: Record<string, unknown> = {
            updatedAt: new Date()
        };

        if (body.name !== undefined) updateData.name = body.name;
        if (body.type !== undefined) updateData.type = body.type;
        if (body.baseAmount !== undefined) updateData.baseAmount = body.baseAmount.toString();
        if (body.frequency !== undefined) updateData.frequency = body.frequency;
        if (body.payDays !== undefined) updateData.payDays = body.payDays; // Drizzle ORM will handle the array conversion
        if (body.minExpected !== undefined) updateData.minExpected = body.minExpected?.toString() || null;
        if (body.maxExpected !== undefined) updateData.maxExpected = body.maxExpected?.toString() || null;
        if (body.averageLast3Months !== undefined) updateData.averageLast3Months = body.averageLast3Months?.toString() || null;
        if (body.isActive !== undefined) updateData.isActive = body.isActive;
        if (body.includeInForecast !== undefined) updateData.includeInForecast = body.includeInForecast;

        const [updated] = await db
            .update(incomeSources)
            .set(updateData)
            .where(
                and(
                    eq(incomeSources.id, parseInt(id)),
                    eq(incomeSources.userId, parseInt(session.user.id))
                )
            )
            .returning();

        if (!updated) {
            return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
        }

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Error al actualizar fuente de ingreso:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}

// DELETE - Eliminar fuente de ingreso
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }

        const { id } = await params;

        const [deleted] = await db
            .delete(incomeSources)
            .where(
                and(
                    eq(incomeSources.id, parseInt(id)),
                    eq(incomeSources.userId, parseInt(session.user.id))
                )
            )
            .returning();

        if (!deleted) {
            return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error al eliminar fuente de ingreso:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}
