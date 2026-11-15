const { Pool, types } = require("pg");
require("dotenv").config();

// Return DATE columns (e.g. lease_start) as plain "YYYY-MM-DD" text, so a lease
// starting on 1 February never shifts to 31 January because of the time zone.
types.setTypeParser(1082, (value) => value);

// On a host like Railway, DATABASE_URL holds the whole connection string
// (e.g. Render's External Database URL). Locally, the DB_* values are used.
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false },
    })
  : new Pool({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
    });

module.exports = pool;