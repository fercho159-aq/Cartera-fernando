import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { accountMembers, users, accounts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUserId } from '@/lib/auth-helpers';

// Prevent static generation
export const dynamic = 'force-dynamic';

// GET - Obtener miembros de una cuenta
export async function GET(
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

        // Verificar que el usuario es miembro de la cuenta
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
            return NextResponse.json(
                { error: 'No tienes acceso a esta cuenta' },
                { status: 403 }
            );
        }

        // Obtener todos los miembros
        const members = await db
            .select({
                id: accountMembers.id,
                role: accountMembers.role,
                joinedAt: accountMembers.joinedAt,
                userId: users.id,
                userName: users.name,
                userEmail: users.email,
            })
            .from(accountMembers)
            .innerJoin(users, eq(accountMembers.userId, users.id))
            .where(eq(accountMembers.accountId, accountId));

        return NextResponse.json(members);
    } catch (error) {
        console.error('Error al obtener miembros:', error);
        return NextResponse.json(
            { error: 'Error al obtener miembros' },
            { status: 500 }
        );
    }
}

// DELETE - Eliminar miembro de una cuenta (solo owner/admin)
export async function DELETE(
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
        const { memberId } = await request.json();

        if (isNaN(accountId) || !memberId) {
            return NextResponse.json(
                { error: 'Datos inválidos' },
                { status: 400 }
            );
        }

        // Verificar permisos del usuario actual
        const [currentMembership] = await db
            .select()
            .from(accountMembers)
            .where(
                and(
                    eq(accountMembers.accountId, accountId),
                    eq(accountMembers.userId, userId)
                )
            )
            .limit(1);

        if (!currentMembership || currentMembership.role === 'member') {
            return NextResponse.json(
                { error: 'No tienes permisos para eliminar miembros' },
                { status: 403 }
            );
        }

        // Verificar que el miembro a eliminar no sea el owner
        const [account] = await db
            .select()
            .from(accounts)
            .where(eq(accounts.id, accountId))
            .limit(1);

        if (account?.ownerId === memberId) {
            return NextResponse.json(
                { error: 'No puedes eliminar al dueño de la cuenta' },
                { status: 400 }
            );
        }

        // Eliminar miembro
        await db.delete(accountMembers).where(
            and(
                eq(accountMembers.accountId, accountId),
                eq(accountMembers.userId, memberId)
            )
        );

        return NextResponse.json({
            success: true,
            message: 'Miembro eliminado correctamente'
        });
    } catch (error) {
        console.error('Error al eliminar miembro:', error);
        return NextResponse.json(
            { error: 'Error al eliminar miembro' },
            { status: 500 }
        );
    }
}
