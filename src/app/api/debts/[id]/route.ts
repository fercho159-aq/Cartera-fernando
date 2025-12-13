import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { debts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Prevent static generation
export const dynamic = 'force-dynamic';

// PATCH - Marcar deuda como pagada/no pagada
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const debtId = parseInt(id, 10);
        const body = await request.json();

        if (isNaN(debtId)) {
            return NextResponse.json(
                { error: 'ID de deuda inválido' },
                { status: 400 }
            );
        }

        const updateData: { isPaid?: boolean; paidDate?: Date | null } = {};

        if (body.isPaid !== undefined) {
            updateData.isPaid = body.isPaid;
            updateData.paidDate = body.isPaid ? new Date() : null;
        }

        const result = await db
            .update(debts)
            .set(updateData)
            .where(eq(debts.id, debtId))
            .returning();

        if (result.length === 0) {
            return NextResponse.json(
                { error: 'Deuda no encontrada' },
                { status: 404 }
            );
        }

        return NextResponse.json(result[0]);
    } catch (error) {
        console.error('Error al actualizar deuda:', error);
        return NextResponse.json(
            { error: 'Error al actualizar la deuda' },
            { status: 500 }
        );
    }
}

// DELETE - Eliminar una deuda
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const debtId = parseInt(id, 10);

        if (isNaN(debtId)) {
            return NextResponse.json(
                { error: 'ID de deuda inválido' },
                { status: 400 }
            );
        }

        const result = await db
            .delete(debts)
            .where(eq(debts.id, debtId))
            .returning();

        if (result.length === 0) {
            return NextResponse.json(
                { error: 'Deuda no encontrada' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Deuda eliminada correctamente'
        });
    } catch (error) {
        console.error('Error al eliminar deuda:', error);
        return NextResponse.json(
            { error: 'Error al eliminar la deuda' },
            { status: 500 }
        );
    }
}
