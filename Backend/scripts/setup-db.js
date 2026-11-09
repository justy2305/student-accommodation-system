// Creates (or repairs) the database tables from database/schema.sql.
// Run from the Backend folder:  npm run db:setup
//
// Safe to run more than once:
// - Tables that already have columns, and their data, are never touched.
// - A table that exists but has NO columns and NO rows (an empty shell, which
//   breaks every query) is dropped and created again properly.

const fs = require("fs");
const path = require("path");
const pool = require("../src/config/database");

const APP_TABLES = [
  "users",
  "accommodations",
  "accommodation_images",
  "accommodation_room_types",
  "accommodation_distances",
  "rooms",
  "applications",
  "application_status_history",
  "notifications",
];

async function findEmptyShellTables(client) {
  const shells = [];

  for (const table of APP_TABLES) {
    const exists = await client.query("SELECT to_regclass($1) AS oid", [`public.${table}`]);
    if (!exists.rows[0].oid) continue;

    const columns = await client.query(
      `SELECT COUNT(*)::int AS n
       FROM pg_attribute
       WHERE attrelid = $1::regclass AND attnum > 0 AND NOT attisdropped`,
      [`public.${table}`]
    );
    const rows = await client.query(`SELECT COUNT(*)::int AS n FROM public."${table}"`);

    if (columns.rows[0].n === 0 && rows.rows[0].n === 0) {
      shells.push(table);
    }
  }

  return shells;
}

async function main() {
  const schema = fs.readFileSync(path.join(__dirname, "..", "database", "schema.sql"), "utf8");
  const client = await pool.connect();

  try {
    const database = (await client.query("SELECT current_database() AS db")).rows[0].db;
    console.log(`Setting up database "${database}"...`);

    await client.query("BEGIN");

    const shells = await findEmptyShellTables(client);
    for (const table of shells) {
      await client.query(`DROP TABLE public."${table}" CASCADE`);
      console.log(`  Replaced empty table (no columns, no rows): ${table}`);
    }

    await client.query(schema);
    await client.query("COMMIT");

    for (const table of APP_TABLES) {
      const columns = await client.query(
        `SELECT column_name FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = $1
         ORDER BY ordinal_position`,
        [table]
      );
      console.log(`  ${table}: ${columns.rows.map((c) => c.column_name).join(", ")}`);
    }

    console.log("Database is ready.");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Database setup failed, nothing was changed:", error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
