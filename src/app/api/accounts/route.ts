import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { accounts, accountMembers, NewAccount, users } from '@/lib/db/schema';
import { eq, or } from 'drizzle-orm';
import { getCurrentUserId } from '@/lib/auth-helpers';

// Prevent static generation
export const dynamic = 'force-dynamic';

// Generar código de invitación único
function generateInviteCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// GET - Obtener todas las cuentas del usuario (propias y donde es miembro)
export async function GET() {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        // Obtener cuentas donde el usuario es dueño
        const ownedAccounts = await db
            .select({
                id: accounts.id,
                name: accounts.name,
                description: accounts.description,
                ownerId: accounts.ownerId,
                inviteCode: accounts.inviteCode,
                createdAt: accounts.createdAt,
                role: accountMembers.role,
                ownerName: users.name,
                ownerEmail: users.email,
            })
            .from(accounts)
            .leftJoin(accountMembers, eq(accounts.id, accountMembers.accountId))
            .leftJoin(users, eq(accounts.ownerId, users.id))
            .where(
                or(
                    eq(accounts.ownerId, userId),
                    eq(accountMembers.userId, userId)
                )
            );

        // Eliminar duplicados y formatear
        const uniqueAccounts = Array.from(
            new Map(ownedAccounts.map(acc => [acc.id, acc])).values()
        ).map(acc => ({
            ...acc,
            isOwner: acc.ownerId === userId,
        }));

        return NextResponse.json(uniqueAccounts);
    } catch (error) {
        console.error('Error al obtener cuentas:', error);
        return NextResponse.json(
            { error: 'Error al obtener las cuentas' },
            { status: 500 }
        );
    }
}

// POST - Crear una nueva cuenta compartida
export async function POST(request: NextRequest) {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const body = await request.json();

        if (!body.name) {
            return NextResponse.json(
                { error: 'El nombre de la cuenta es requerido' },
                { status: 400 }
            );
        }

        const newAccount: NewAccount = {
            name: body.name,
            description: body.description || null,
            ownerId: userId,
            inviteCode: generateInviteCode(),
        };

        const [createdAccount] = await db
            .insert(accounts)
            .values(newAccount)
            .returning();

        // Agregar al dueño como miembro con rol 'owner'
        await db.insert(accountMembers).values({
            accountId: createdAccount.id,
            userId: userId,
            role: 'owner',
        });

        return NextResponse.json(createdAccount, { status: 201 });
    } catch (error) {
        console.error('Error al crear cuenta:', error);
        return NextResponse.json(
            { error: 'Error al crear la cuenta' },
            { status: 500 }
        );
    }
}
