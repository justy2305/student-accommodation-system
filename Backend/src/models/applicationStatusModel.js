const pool = require("../config/database");

// Get status history for one application
const getApplicationStatusHistory = async (applicationId) => {
  const result = await pool.query(
    `SELECT
       application_status_history.*,
       users.first_name,
       users.last_name
     FROM application_status_history
     LEFT JOIN users
       ON application_status_history.changed_by = users.id
     WHERE application_status_history.application_id = $1
     ORDER BY application_status_history.changed_at ASC`,
    [applicationId]
  );

  return result.rows;
};

// Student signs their lease agreement. Only works for their own approved
// application, with lease dates set, that is not signed yet. Records it in
// the status history.
const signLease = async (applicationId, studentId) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `UPDATE applications
       SET lease_signed_at = NOW()
       WHERE id = $1
         AND student_id = $2
         AND status = 'Approved'
         AND lease_start IS NOT NULL
         AND lease_end IS NOT NULL
         AND lease_signed_at IS NULL
       RETURNING *`,
      [applicationId, studentId]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return null;
    }

    await client.query(
      `INSERT INTO application_status_history
       (application_id, status, changed_by, note)
       VALUES ($1, 'Approved', $2, 'Lease agreement signed by student')`,
      [applicationId, studentId]
    );

    await client.query("COMMIT");

    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  getApplicationStatusHistory,
  signLease,
};
