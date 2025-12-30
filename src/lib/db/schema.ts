import { pgTable, serial, varchar, decimal, timestamp, boolean, pgEnum, integer, text } from 'drizzle-orm/pg-core';

// Enums
export const transactionTypeEnum = pgEnum('transaction_type', ['income', 'expense']);
export const recurrencePeriodEnum = pgEnum('recurrence_period', ['daily', 'weekly', 'monthly', 'none']);
export const categoryEnum = pgEnum('category', [
  'food',
  'transport',
  'entertainment',
  'health',
  'shopping',
  'utilities',
  'salary',
  'freelance',
  'investment',
  'other'
]);
export const accountRoleEnum = pgEnum('account_role', ['owner', 'admin', 'member']);

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: text('password').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Shared Accounts table - Cuentas/carteras compartidas
export const accounts = pgTable('accounts', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: varchar('description', { length: 500 }),
  ownerId: integer('owner_id').references(() => users.id).notNull(),
  inviteCode: varchar('invite_code', { length: 32 }).unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Account Members table - Miembros de cuentas compartidas
export const accountMembers = pgTable('account_members', {
  id: serial('id').primaryKey(),
  accountId: integer('account_id').references(() => accounts.id, { onDelete: 'cascade' }).notNull(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  role: accountRoleEnum('role').notNull().default('member'),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
});

// Transactions table
export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  accountId: integer('account_id').references(() => accounts.id), // NULL = cuenta personal
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  type: transactionTypeEnum('type').notNull(),
  category: categoryEnum('category').notNull().default('other'),
  isRecurring: boolean('is_recurring').notNull().default(false),
  recurrencePeriod: recurrencePeriodEnum('recurrence_period').notNull().default('none'),
  date: timestamp('date').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  nextOccurrence: timestamp('next_occurrence'),
  parentId: serial('parent_id'),
});

// Debts/Debtors table - Para manejar personas que te deben dinero
export const debts = pgTable('debts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  accountId: integer('account_id').references(() => accounts.id), // NULL = cuenta personal
  personName: varchar('person_name', { length: 255 }).notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  description: varchar('description', { length: 500 }),
  isPaid: boolean('is_paid').notNull().default(false),
  dueDate: timestamp('due_date'),
  paidDate: timestamp('paid_date'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Enums para fuentes de ingreso
export const paymentFrequencyEnum = pgEnum('payment_frequency', ['weekly', 'biweekly', 'monthly', 'custom']);
export const incomeTypeEnum = pgEnum('income_type', ['fixed', 'variable']);
export const commissionStatusEnum = pgEnum('commission_status', ['pending', 'confirmed', 'paid']);

// Income Sources table - Fuentes de ingreso configuradas
export const incomeSources = pgTable('income_sources', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  accountId: integer('account_id').references(() => accounts.id, { onDelete: 'cascade' }), // NULL = cuenta personal

  // Información básica
  name: varchar('name', { length: 255 }).notNull(),
  type: incomeTypeEnum('type').notNull().default('fixed'),

  // Configuración de pago
  baseAmount: decimal('base_amount', { precision: 12, scale: 2 }).notNull(),
  frequency: paymentFrequencyEnum('frequency').notNull().default('monthly'),

  // Días de pago (array de integers)
  payDays: integer('pay_days').array().notNull(),

  // Para ingresos variables (comisiones)
  minExpected: decimal('min_expected', { precision: 12, scale: 2 }),
  maxExpected: decimal('max_expected', { precision: 12, scale: 2 }),
  averageLast3Months: decimal('average_last_3_months', { precision: 12, scale: 2 }),

  // Estado
  isActive: boolean('is_active').notNull().default(true),
  includeInForecast: boolean('include_in_forecast').notNull().default(true),

  // Metadata
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Commission Records table - Registro histórico de comisiones
export const commissionRecords = pgTable('commission_records', {
  id: serial('id').primaryKey(),
  incomeSourceId: integer('income_source_id').references(() => incomeSources.id, { onDelete: 'cascade' }).notNull(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),

  // Datos de la comisión
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  periodMonth: integer('period_month').notNull(), // 1-12
  periodYear: integer('period_year').notNull(),

  // Estado
  status: commissionStatusEnum('status').notNull().default('pending'),
  confirmedAt: timestamp('confirmed_at'),
  paidAt: timestamp('paid_at'),

  // Notas
  notes: text('notes'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type Debt = typeof debts.$inferSelect;
export type NewDebt = typeof debts.$inferInsert;
export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type AccountMember = typeof accountMembers.$inferSelect;
export type NewAccountMember = typeof accountMembers.$inferInsert;
export type IncomeSource = typeof incomeSources.$inferSelect;
export type NewIncomeSource = typeof incomeSources.$inferInsert;
export type CommissionRecord = typeof commissionRecords.$inferSelect;
export type NewCommissionRecord = typeof commissionRecords.$inferInsert;
