import { Pool } from "pg";

let _pool: Pool | null = null;

function getPool(): Pool {
  if (_pool) return _pool;

  _pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    statement_timeout: 8000,
    ssl: process.env.DATABASE_URL?.includes("railway")
      ? { rejectUnauthorized: false }
      : undefined,
  });

  _pool.on("error", (err) => {
    console.error("[postgres] pool error:", err.message);
  });

  return _pool;
}

export const pool = new Proxy({} as Pool, {
  get(_target, prop) {
    return (getPool() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
