import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { transactions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Prevent static generation - this route needs runtime access to database
export const dynamic = 'force-dynamic';

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const transactionId = parseInt(id, 10);

        if (isNaN(transactionId)) {
            return NextResponse.json(
                { error: 'ID de transacción inválido' },
                { status: 400 }
            );
        }

        // Delete the transaction
        const result = await db
            .delete(transactions)
            .where(eq(transactions.id, transactionId))
            .returning();

        if (result.length === 0) {
            return NextResponse.json(
                { error: 'Transacción no encontrada' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Transacción eliminada correctamente',
            deleted: result[0]
        });
    } catch (error) {
        console.error('Error al eliminar transacción:', error);
        return NextResponse.json(
            { error: 'Error al eliminar la transacción' },
            { status: 500 }
        );
    }
}
