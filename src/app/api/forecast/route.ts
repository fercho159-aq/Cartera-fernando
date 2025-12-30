import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { incomeSources, transactions } from '@/lib/db/schema';
import { eq, and, isNull, gte, lte, sql } from 'drizzle-orm';
import { getServerSession } from '@/lib/auth-helpers';

interface ForecastDay {
    date: string;
    dayOfMonth: number;
    income: number;
    incomeDetails: Array<{ name: string; amount: number; type: string }>;
    projectedBalance: number;
    isPayday: boolean;
}

interface ForecastMonth {
    month: string;
    monthNum: number;
    year: number;
    totalIncome: number;
    projectedExpenses: number;
    projectedBalance: number;
    paydays: ForecastDay[];
}

// GET - Generar forecast de 3 meses
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const accountId = searchParams.get('accountId');
        const months = parseInt(searchParams.get('months') || '3');

        // Obtener fuentes de ingreso activas
        let sources;
        if (accountId) {
            sources = await db
                .select()
                .from(incomeSources)
                .where(
                    and(
                        eq(incomeSources.userId, parseInt(session.user.id)),
                        eq(incomeSources.accountId, parseInt(accountId)),
                        eq(incomeSources.isActive, true),
                        eq(incomeSources.includeInForecast, true)
                    )
                );
        } else {
            sources = await db
                .select()
                .from(incomeSources)
                .where(
                    and(
                        eq(incomeSources.userId, parseInt(session.user.id)),
                        isNull(incomeSources.accountId),
                        eq(incomeSources.isActive, true),
                        eq(incomeSources.includeInForecast, true)
                    )
                );
        }

        // Calcular promedio de gastos mensuales (últimos 3 meses)
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        const expenseQuery = accountId
            ? and(
                eq(transactions.userId, parseInt(session.user.id)),
                eq(transactions.accountId, parseInt(accountId)),
                eq(transactions.type, 'expense'),
                gte(transactions.date, threeMonthsAgo)
            )
            : and(
                eq(transactions.userId, parseInt(session.user.id)),
                isNull(transactions.accountId),
                eq(transactions.type, 'expense'),
                gte(transactions.date, threeMonthsAgo)
            );

        const [expenseResult] = await db
            .select({
                total: sql<number>`COALESCE(SUM(${transactions.amount}::numeric), 0)`,
                count: sql<number>`COUNT(DISTINCT DATE_TRUNC('month', ${transactions.date}))`
            })
            .from(transactions)
            .where(expenseQuery);

        const avgMonthlyExpense = expenseResult.count > 0
            ? Number(expenseResult.total) / Number(expenseResult.count)
            : 0;

        // Obtener balance actual
        const balanceQuery = accountId
            ? and(
                eq(transactions.userId, parseInt(session.user.id)),
                eq(transactions.accountId, parseInt(accountId))
            )
            : and(
                eq(transactions.userId, parseInt(session.user.id)),
                isNull(transactions.accountId)
            );

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const [balanceResult] = await db
            .select({
                income: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'income' THEN ${transactions.amount}::numeric ELSE 0 END), 0)`,
                expense: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'expense' THEN ${transactions.amount}::numeric ELSE 0 END), 0)`
            })
            .from(transactions)
            .where(
                and(
                    balanceQuery,
                    gte(transactions.date, startOfMonth),
                    lte(transactions.date, endOfMonth)
                )
            );

        const currentBalance = Number(balanceResult.income) - Number(balanceResult.expense);

        // Generar forecast
        const forecast: ForecastMonth[] = [];
        let runningBalance = currentBalance;

        for (let i = 0; i < months; i++) {
            const forecastDate = new Date();
            forecastDate.setMonth(forecastDate.getMonth() + i);

            const monthNum = forecastDate.getMonth() + 1;
            const year = forecastDate.getFullYear();
            const monthName = forecastDate.toLocaleDateString('es-MX', { month: 'long' });
            const daysInMonth = new Date(year, monthNum, 0).getDate();

            // Calcular ingresos del mes
            let monthlyIncome = 0;
            const paydays: ForecastDay[] = [];

            for (const source of sources) {
                const payDays: number[] = source.payDays || [15, 30];
                const amount = source.type === 'variable' && source.averageLast3Months
                    ? Number(source.averageLast3Months)
                    : Number(source.baseAmount);

                // Determinar cuántos pagos hay según frecuencia
                let paymentsThisMonth = 0;
                let paymentDays: number[] = [];

                switch (source.frequency) {
                    case 'weekly':
                        paymentsThisMonth = 4;
                        paymentDays = [7, 14, 21, 28]; // Aproximación
                        break;
                    case 'biweekly':
                        paymentsThisMonth = 2;
                        paymentDays = payDays.slice(0, 2);
                        break;
                    case 'monthly':
                        paymentsThisMonth = 1;
                        paymentDays = [payDays[0] || 30];
                        break;
                    case 'custom':
                        paymentsThisMonth = payDays.length;
                        paymentDays = payDays;
                        break;
                    default:
                        paymentsThisMonth = 1;
                        paymentDays = [30];
                }

                const amountPerPayment = amount / paymentsThisMonth;

                for (const day of paymentDays) {
                    const actualDay = Math.min(day, daysInMonth);
                    const dateStr = `${year}-${String(monthNum).padStart(2, '0')}-${String(actualDay).padStart(2, '0')}`;

                    // Buscar si ya existe este día
                    let payday = paydays.find(p => p.dayOfMonth === actualDay);
                    if (!payday) {
                        payday = {
                            date: dateStr,
                            dayOfMonth: actualDay,
                            income: 0,
                            incomeDetails: [],
                            projectedBalance: 0,
                            isPayday: true
                        };
                        paydays.push(payday);
                    }

                    payday.income += amountPerPayment;
                    payday.incomeDetails.push({
                        name: source.name,
                        amount: amountPerPayment,
                        type: source.type
                    });

                    monthlyIncome += amountPerPayment;
                }
            }

            // Ordenar paydays por día
            paydays.sort((a, b) => a.dayOfMonth - b.dayOfMonth);

            // Calcular balance proyectado para cada día de pago
            let dayBalance = runningBalance;
            const dailyExpense = avgMonthlyExpense / daysInMonth;

            for (const payday of paydays) {
                // Restar gastos hasta este día (desde inicio del mes o último pago)
                const prevPaydayIndex = paydays.indexOf(payday) - 1;
                const daysSinceLast = prevPaydayIndex >= 0
                    ? payday.dayOfMonth - paydays[prevPaydayIndex].dayOfMonth
                    : payday.dayOfMonth;

                dayBalance -= dailyExpense * daysSinceLast;
                dayBalance += payday.income;
                payday.projectedBalance = dayBalance;
            }

            const projectedBalance = runningBalance + monthlyIncome - avgMonthlyExpense;

            forecast.push({
                month: monthName,
                monthNum,
                year,
                totalIncome: monthlyIncome,
                projectedExpenses: avgMonthlyExpense,
                projectedBalance,
                paydays
            });

            runningBalance = projectedBalance;
        }

        // Calcular próximo pago
        const today = new Date();
        const currentDay = today.getDate();
        let nextPayday = null;

        for (const source of sources) {
            const payDays: number[] = source.payDays || [15, 30];
            for (const day of payDays) {
                if (day > currentDay) {
                    const amount = source.type === 'variable' && source.averageLast3Months
                        ? Number(source.averageLast3Months)
                        : Number(source.baseAmount);

                    if (!nextPayday || day < nextPayday.day) {
                        nextPayday = {
                            day,
                            daysUntil: day - currentDay,
                            sources: [{ name: source.name, amount }]
                        };
                    } else if (day === nextPayday.day) {
                        nextPayday.sources.push({ name: source.name, amount });
                    }
                }
            }
        }

        // Si no hay pago este mes, buscar el primer pago del próximo mes
        if (!nextPayday && sources.length > 0) {
            const firstPayDays: number[] = [];
            for (const source of sources) {
                const payDays: number[] = source.payDays || [15, 30];
                firstPayDays.push(...payDays);
            }
            const firstDay = Math.min(...firstPayDays);
            const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
            nextPayday = {
                day: firstDay,
                daysUntil: (daysInMonth - currentDay) + firstDay,
                sources: sources
                    .filter(s => {
                        const payDays: number[] = s.payDays || [15, 30];
                        return payDays.includes(firstDay);
                    })
                    .map(s => ({
                        name: s.name,
                        amount: s.type === 'variable' && s.averageLast3Months
                            ? Number(s.averageLast3Months)
                            : Number(s.baseAmount)
                    }))
            };
        }

        // Calcular presupuesto diario inteligente
        const daysUntilNextPay = nextPayday?.daysUntil || 30;
        const smartDailyBudget = currentBalance > 0 ? currentBalance / daysUntilNextPay : 0;

        return NextResponse.json({
            currentBalance,
            avgMonthlyExpense,
            avgDailyExpense: avgMonthlyExpense / 30,
            smartDailyBudget,
            daysUntilNextPay,
            nextPayday,
            incomeSources: sources.map(s => ({
                id: s.id,
                name: s.name,
                type: s.type,
                amount: s.type === 'variable' && s.averageLast3Months
                    ? Number(s.averageLast3Months)
                    : Number(s.baseAmount),
                frequency: s.frequency,
                payDays: s.payDays || [15, 30]
            })),
            forecast
        });
    } catch (error) {
        console.error('Error al generar forecast:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}
