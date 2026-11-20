import mysql, { Pool } from "mysql2/promise";

// One pool per MySQL account. Each account holds a different database role (see db/rbac.sql),
// so the database itself enforces what each application role may read or write.
export type DbRole = "AUTH" | "ADMIN" | "MANAGER" | "DRIVER";
const creds: Record<DbRole, [string | undefined, string | undefined]> = {
  AUTH: [process.env.DB_AUTH_USER, process.env.DB_AUTH_PASS],
  ADMIN: [process.env.DB_ADMIN_USER, process.env.DB_ADMIN_PASS],
  MANAGER: [process.env.DB_MANAGER_USER, process.env.DB_MANAGER_PASS],
  DRIVER: [process.env.DB_DRIVER_USER, process.env.DB_DRIVER_PASS],
};
const g = globalThis as unknown as { _pools?: Partial<Record<DbRole, Pool>> };
g._pools ??= {};

export function getPool(role: DbRole): Pool {
  if (!g._pools![role]) {
    const [user, password] = creds[role];
    g._pools![role] = mysql.createPool({
      host: process.env.MYSQL_HOST,
      database: process.env.MYSQL_DATABASE,
      user,
      password,
      connectionLimit: 5,
    });
  }
  return g._pools![role]!;
}

export async function q<T = any>(role: DbRole, sql: string, params: any[] = []): Promise<T[]> {
  const [rows] = await getPool(role).query(sql, params);
  return rows as T[];
}

/** Calls a stored procedure that returns one result set. */
export async function callProc<T = any>(role: DbRole, sql: string, params: any[] = []): Promise<T[]> {
  const [res] = await getPool(role).query(sql, params);
  return (res as any[])[0] as T[];
}
