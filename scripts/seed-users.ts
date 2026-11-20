import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";

// Sets the demo password (Demo@1234) for the seeded users. Uses the admin DB account from .env.local.
(async () => {
  const c = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT ?? 3306),
    database: process.env.MYSQL_DATABASE,
    user: process.env.DB_ADMIN_USER, password: process.env.DB_ADMIN_PASS,
  });
  const hash = await bcrypt.hash("Demo@1234", 10);
  await c.query("UPDATE users SET password_hash = ?", [hash]);
  console.log("Demo users now use the password Demo@1234");
  await c.end();
})();
