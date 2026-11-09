const pool = require("../config/database");

// Update application status and save its history
// leaseStart / leaseEnd ("YYYY-MM-DD") are optional; when they change, any
// earlier signature is cleared because the student agreed to other dates.
const updateApplicationStatus = async (
  applicationId,
  status,
  changedBy,
  note,
  leaseStart = null,
  leaseEnd = null
) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `UPDATE applications
       SET status = $1,
           lease_signed_at = CASE
             WHEN ($3::date IS NOT NULL AND $3::date IS DISTINCT FROM lease_start)
               OR ($4::date IS NOT NULL AND $4::date IS DISTINCT FROM lease_end)
             THEN NULL
             ELSE lease_signed_at
           END,
           lease_start = COALESCE($3::date, lease_start),
           lease_end = COALESCE($4::date, lease_end)
       WHERE id = $2
       RETURNING *`,
      [status, applicationId, leaseStart, leaseEnd]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return null;
    }

    await client.query(
      `INSERT INTO application_status_history
       (application_id, status, changed_by, note)
       VALUES ($1, $2, $3, $4)`,
      [applicationId, status, changedBy, note || null]
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
// the status history so the admin can see when it was signed.
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
  updateApplicationStatus,
  getApplicationStatusHistory,
  signLease,
};
