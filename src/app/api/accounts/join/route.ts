import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { accounts, accountMembers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUserId } from '@/lib/auth-helpers';

// Prevent static generation
export const dynamic = 'force-dynamic';

// POST - Unirse a una cuenta usando código de invitación
export async function POST(request: NextRequest) {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const body = await request.json();
        const { inviteCode } = body;

        if (!inviteCode) {
            return NextResponse.json(
                { error: 'Código de invitación requerido' },
                { status: 400 }
            );
        }

        // Buscar la cuenta por código de invitación
        const [account] = await db
            .select()
            .from(accounts)
            .where(eq(accounts.inviteCode, inviteCode.toUpperCase()))
            .limit(1);

        if (!account) {
            return NextResponse.json(
                { error: 'Código de invitación inválido' },
                { status: 404 }
            );
        }

        // Verificar si ya es miembro
        const [existingMember] = await db
            .select()
            .from(accountMembers)
            .where(
                and(
                    eq(accountMembers.accountId, account.id),
                    eq(accountMembers.userId, userId)
                )
            )
            .limit(1);

        if (existingMember) {
            return NextResponse.json(
                { error: 'Ya eres miembro de esta cuenta' },
                { status: 400 }
            );
        }

        // Agregar como miembro
        await db.insert(accountMembers).values({
            accountId: account.id,
            userId: userId,
            role: 'member',
        });

        return NextResponse.json({
            success: true,
            message: `Te uniste a "${account.name}"`,
            account: account,
        });
    } catch (error) {
        console.error('Error al unirse a cuenta:', error);
        return NextResponse.json(
            { error: 'Error al unirse a la cuenta' },
            { status: 500 }
        );
    }
}
