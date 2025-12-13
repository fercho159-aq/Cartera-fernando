import { neon, NeonQueryFunction } from '@neondatabase/serverless';
import { drizzle, NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Lazy initialization to avoid build-time errors
let sqlConnection: NeonQueryFunction<false, false> | null = null;
let dbInstance: NeonHttpDatabase<typeof schema> | null = null;

function getDb(): NeonHttpDatabase<typeof schema> {
    if (!dbInstance) {
        const connectionString = process.env.DATABASE_URL;

        if (!connectionString) {
            throw new Error(
                'DATABASE_URL is not set. Please set the DATABASE_URL environment variable.'
            );
        }

        sqlConnection = neon(connectionString);
        dbInstance = drizzle(sqlConnection, { schema });
    }

    return dbInstance;
}

// Export a proxy that lazily initializes the database
export { getDb, schema };

// For backwards compatibility, export db as a getter
export const db = new Proxy({} as NeonHttpDatabase<typeof schema>, {
    get(_, prop) {
        const database = getDb();
        return (database as unknown as Record<string | symbol, unknown>)[prop];
    },
});
