import { Pool } from 'pg';

const globalForDb = globalThis as unknown as {
  pgPool: Pool | undefined;
};

export function getPool(connectionString?: string): Pool {
  if (!globalForDb.pgPool) {
    const url = connectionString || process.env.DATABASE_URL || '';
    const isLocal = /localhost|127\.0\.0\.1/i.test(url);
    globalForDb.pgPool = new Pool({
      connectionString: url,
      ssl: isLocal ? false : { rejectUnauthorized: false },
      max: 10,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
    });
  }
  return globalForDb.pgPool;
}
