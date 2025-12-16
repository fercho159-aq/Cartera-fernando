import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { transactions, accountMembers } from '@/lib/db/schema';
import { sql, gte, eq, and } from 'drizzle-orm';
import { getCurrentUserId } from '@/lib/auth-helpers';

// Prevent static generation - this route needs runtime access to database
export const dynamic = 'force-dynamic';

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

        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        // Construir condición de filtrado para datos mensuales
        const monthlyCondition = accountId
            ? and(
                eq(transactions.accountId, accountId),
                gte(transactions.date, sixMonthsAgo)
            )
            : and(
                eq(transactions.userId, userId),
                sql`${transactions.accountId} IS NULL`,
                gte(transactions.date, sixMonthsAgo)
            );

        // Get monthly aggregated data for the last 6 months
        const result = await db
            .select({
                month: sql<string>`TO_CHAR(${transactions.date}, 'Mon')`,
                monthNum: sql<number>`EXTRACT(MONTH FROM ${transactions.date})`,
                year: sql<number>`EXTRACT(YEAR FROM ${transactions.date})`,
                income: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'income' THEN ${transactions.amount}::numeric ELSE 0 END), 0)`,
                expense: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'expense' THEN ${transactions.amount}::numeric ELSE 0 END), 0)`,
            })
            .from(transactions)
            .where(monthlyCondition)
            .groupBy(
                sql`TO_CHAR(${transactions.date}, 'Mon')`,
                sql`EXTRACT(MONTH FROM ${transactions.date})`,
                sql`EXTRACT(YEAR FROM ${transactions.date})`
            )
            .orderBy(
                sql`EXTRACT(YEAR FROM ${transactions.date})`,
                sql`EXTRACT(MONTH FROM ${transactions.date})`
            );

        // Get category breakdown for current month
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Construir condición de filtrado para categorías
        const categoryCondition = accountId
            ? and(
                eq(transactions.accountId, accountId),
                sql`${transactions.date} >= ${firstDayOfMonth} AND ${transactions.type} = 'expense'`
            )
            : and(
                eq(transactions.userId, userId),
                sql`${transactions.accountId} IS NULL`,
                sql`${transactions.date} >= ${firstDayOfMonth} AND ${transactions.type} = 'expense'`
            );

        const categoryData = await db
            .select({
                category: transactions.category,
                total: sql<number>`COALESCE(SUM(${transactions.amount}::numeric), 0)`,
            })
            .from(transactions)
            .where(categoryCondition)
            .groupBy(transactions.category);

        return NextResponse.json({
            monthlyData: result,
            categoryData,
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        return NextResponse.json(
            { error: 'Failed to fetch statistics' },
            { status: 500 }
        );
    }
}

