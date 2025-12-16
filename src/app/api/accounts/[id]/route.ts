import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { accounts, accountMembers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUserId } from '@/lib/auth-helpers';

// Prevent static generation
export const dynamic = 'force-dynamic';

// DELETE - Eliminar una cuenta (solo el dueño puede)
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { id } = await params;
        const accountId = parseInt(id, 10);

        if (isNaN(accountId)) {
            return NextResponse.json(
                { error: 'ID de cuenta inválido' },
                { status: 400 }
            );
        }

        // Verificar que el usuario es el dueño
        const [account] = await db
            .select()
            .from(accounts)
            .where(
                and(
                    eq(accounts.id, accountId),
                    eq(accounts.ownerId, userId)
                )
            )
            .limit(1);

        if (!account) {
            return NextResponse.json(
                { error: 'Cuenta no encontrada o no tienes permisos' },
                { status: 404 }
            );
        }

        // Eliminar la cuenta (los miembros se eliminan en cascada)
        await db.delete(accounts).where(eq(accounts.id, accountId));

        return NextResponse.json({
            success: true,
            message: 'Cuenta eliminada correctamente'
        });
    } catch (error) {
        console.error('Error al eliminar cuenta:', error);
        return NextResponse.json(
            { error: 'Error al eliminar la cuenta' },
            { status: 500 }
        );
    }
}

// PATCH - Actualizar una cuenta
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { id } = await params;
        const accountId = parseInt(id, 10);
        const body = await request.json();

        if (isNaN(accountId)) {
            return NextResponse.json(
                { error: 'ID de cuenta inválido' },
                { status: 400 }
            );
        }

        // Verificar que el usuario es el dueño o admin
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

        if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
            return NextResponse.json(
                { error: 'No tienes permisos para editar esta cuenta' },
                { status: 403 }
            );
        }

        const [updatedAccount] = await db
            .update(accounts)
            .set({
                name: body.name,
                description: body.description,
            })
            .where(eq(accounts.id, accountId))
            .returning();

        return NextResponse.json(updatedAccount);
    } catch (error) {
        console.error('Error al actualizar cuenta:', error);
        return NextResponse.json(
            { error: 'Error al actualizar la cuenta' },
            { status: 500 }
        );
    }
}
