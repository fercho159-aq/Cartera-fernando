import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { transactions, NewTransaction, accountMembers } from '@/lib/db/schema';
import { desc, gte, and, sql, eq } from 'drizzle-orm';
import { addDays, addWeeks, addMonths } from 'date-fns';
import { getCurrentUserId } from '@/lib/auth-helpers';

// Prevent static generation - this route needs runtime access to database
export const dynamic = 'force-dynamic';

// Helper to calculate next occurrence
function calculateNextOccurrence(date: Date, period: string): Date | null {
    switch (period) {
        case 'daily':
            return addDays(date, 1);
        case 'weekly':
            return addWeeks(date, 1);
        case 'monthly':
            return addMonths(date, 1);
        default:
            return null;
    }
}

export async function GET(request: NextRequest) {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        // Obtener accountId del query string
        const { searchParams } = new URL(request.url);
        const accountIdParam = searchParams.get('accountId');
        const accountId = accountIdParam ? parseInt(accountIdParam, 10) : null;

        // Si hay accountId, verificar que el usuario sea miembro
        if (accountId) {
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
                return NextResponse.json({ error: 'No tienes acceso a esta cuenta' }, { status: 403 });
            }
        }

        // First, process recurring transactions for this user
        await processRecurringTransactions(userId);

        // Get transactions from the last 6 months
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        // Construir condición de filtrado
        const conditions = accountId
            ? and(
                eq(transactions.accountId, accountId),
                gte(transactions.date, sixMonthsAgo)
            )
            : and(
                eq(transactions.userId, userId),
                sql`${transactions.accountId} IS NULL`, // Solo transacciones personales
                gte(transactions.date, sixMonthsAgo)
            );

        const result = await db
            .select()
            .from(transactions)
            .where(conditions)
            .orderBy(desc(transactions.date));

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error fetching transactions:', error);
        return NextResponse.json(
            { error: 'Failed to fetch transactions' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const body = await request.json();

        // Si hay accountId, verificar membresía
        if (body.accountId) {
            const [membership] = await db
                .select()
                .from(accountMembers)
                .where(
                    and(
                        eq(accountMembers.accountId, body.accountId),
                        eq(accountMembers.userId, userId)
                    )
                )
                .limit(1);

            if (!membership) {
                return NextResponse.json({ error: 'No tienes acceso a esta cuenta' }, { status: 403 });
            }
        }

        const newTransaction: NewTransaction = {
            userId,
            accountId: body.accountId || null,
            amount: body.amount,
            title: body.title,
            type: body.type,
            category: body.category,
            isRecurring: body.isRecurring || false,
            recurrencePeriod: body.recurrencePeriod || 'none',
            date: new Date(body.date),
            nextOccurrence: body.isRecurring
                ? calculateNextOccurrence(new Date(body.date), body.recurrencePeriod)
                : null,
        };

        const result = await db
            .insert(transactions)
            .values(newTransaction)
            .returning();

        return NextResponse.json(result[0], { status: 201 });
    } catch (error) {
        console.error('Error creating transaction:', error);
        return NextResponse.json(
            { error: 'Failed to create transaction' },
            { status: 500 }
        );
    }
}

// Process recurring transactions for a specific user
async function processRecurringTransactions(userId: number) {
    const now = new Date();

    // Find recurring transactions that need to be processed for this user
    const recurringToProcess = await db
        .select()
        .from(transactions)
        .where(
            and(
                eq(transactions.userId, userId),
                sql`${transactions.isRecurring} = true`,
                sql`${transactions.nextOccurrence} <= ${now}`
            )
        );

    for (const transaction of recurringToProcess) {
        // Create new transaction instance
        const newTransaction: NewTransaction = {
            userId,
            amount: transaction.amount,
            title: transaction.title,
            type: transaction.type,
            category: transaction.category,
            isRecurring: false, // The new instance is not recurring itself
            recurrencePeriod: 'none',
            date: transaction.nextOccurrence || now,
            parentId: transaction.id,
        };

        await db.insert(transactions).values(newTransaction);

        // Update the next occurrence of the parent transaction
        const nextOccurrence = calculateNextOccurrence(
            transaction.nextOccurrence || now,
            transaction.recurrencePeriod
        );

        if (nextOccurrence) {
            await db
                .update(transactions)
                .set({ nextOccurrence })
                .where(sql`${transactions.id} = ${transaction.id}`);
        }
    }
}
