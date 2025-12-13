import { pgTable, serial, varchar, decimal, text, timestamp, boolean, pgEnum } from 'drizzle-orm/pg-core';

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

// Transactions table
export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
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

// Types
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
