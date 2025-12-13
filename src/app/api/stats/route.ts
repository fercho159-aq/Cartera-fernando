import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { transactions } from '@/lib/db/schema';
import { sql, gte } from 'drizzle-orm';

// Prevent static generation - this route needs runtime access to database
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

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
            .where(gte(transactions.date, sixMonthsAgo))
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

        const categoryData = await db
            .select({
                category: transactions.category,
                total: sql<number>`COALESCE(SUM(${transactions.amount}::numeric), 0)`,
            })
            .from(transactions)
            .where(
                sql`${transactions.date} >= ${firstDayOfMonth} AND ${transactions.type} = 'expense'`
            )
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
