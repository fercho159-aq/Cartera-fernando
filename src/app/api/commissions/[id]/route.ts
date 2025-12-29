import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { commissionRecords } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getServerSession } from '@/lib/auth-helpers';

// PUT - Actualizar estado de comisión
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

        const updateData: Record<string, unknown> = {};

        if (body.amount !== undefined) updateData.amount = body.amount.toString();
        if (body.status !== undefined) {
            updateData.status = body.status;
            if (body.status === 'confirmed') {
                updateData.confirmedAt = new Date();
            }
            if (body.status === 'paid') {
                updateData.paidAt = new Date();
            }
        }
        if (body.notes !== undefined) updateData.notes = body.notes;

        const [updated] = await db
            .update(commissionRecords)
            .set(updateData)
            .where(
                and(
                    eq(commissionRecords.id, parseInt(id)),
                    eq(commissionRecords.userId, parseInt(session.user.id))
                )
            )
            .returning();

        if (!updated) {
            return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
        }

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Error al actualizar comisión:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}

// DELETE - Eliminar registro de comisión
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
            .delete(commissionRecords)
            .where(
                and(
                    eq(commissionRecords.id, parseInt(id)),
                    eq(commissionRecords.userId, parseInt(session.user.id))
                )
            )
            .returning();

        if (!deleted) {
            return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error al eliminar comisión:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}
