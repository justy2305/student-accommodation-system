// Creates (or resets) a student account for testing with Postman:
//   student@findmyhome.test / Student12345
// Run from the Backend folder:  npm run test:accounts
// Safe to run again: it resets the password to the one above.
// For local testing only, so it refuses to run when NODE_ENV=production.

const bcrypt = require("bcryptjs");
const pool = require("../src/config/database"); // also loads .env

const ACCOUNT = {
  firstName: "Test",
  lastName: "Student",
  email: "student@findmyhome.test",
  password: "Student12345",
};

// An older version of this script also made this account; it is removed
const OLD_TEST_ACCOUNTS = ["admin@findmyhome.test"];

async function main() {
  if (process.env.NODE_ENV === "production") {
    console.error("Not creating test accounts: NODE_ENV is production.");
    process.exitCode = 1;
    return;
  }

  const removed = await pool.query(
    "DELETE FROM users WHERE LOWER(email) = ANY($1::text[]) RETURNING email",
    [OLD_TEST_ACCOUNTS]
  );
  for (const row of removed.rows) {
    console.log(`Removed  ${row.email}`);
  }

  const passwordHash = await bcrypt.hash(ACCOUNT.password, 10);
  const existing = await pool.query(
    "SELECT id FROM users WHERE LOWER(email) = LOWER($1)",
    [ACCOUNT.email]
  );

  if (existing.rows.length > 0) {
    await pool.query("UPDATE users SET password = $1 WHERE id = $2", [
      passwordHash,
      existing.rows[0].id,
    ]);
    console.log(`Reset    ${ACCOUNT.email} / ${ACCOUNT.password}`);
  } else {
    await pool.query(
      `INSERT INTO users (first_name, last_name, email, password)
       VALUES ($1, $2, $3, $4)`,
      [ACCOUNT.firstName, ACCOUNT.lastName, ACCOUNT.email, passwordHash]
    );
    console.log(`Created  ${ACCOUNT.email} / ${ACCOUNT.password}`);
  }

  console.log("Done. The Postman collection uses this account by default.");
}

main()
  .catch((error) => {
    console.error("Could not create the test account:", error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
