const pool = require("../config/database");

// Update application status and save its history
const updateApplicationStatus = async (
  applicationId,
  status,
  changedBy,
  note
) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `UPDATE applications
       SET status = $1
       WHERE id = $2
       RETURNING *`,
      [status, applicationId]
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

module.exports = {
  updateApplicationStatus,
  getApplicationStatusHistory,
};
