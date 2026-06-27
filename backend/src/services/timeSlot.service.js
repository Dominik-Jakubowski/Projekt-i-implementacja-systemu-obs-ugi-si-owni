const { sql, getPool } = require('../db/pool');
const { HttpError } = require('../utils/httpError');
const { isUniqueConstraintError } = require('../utils/sqlErrors');

async function listTimeSlots() {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT TimeSlotId, StartTime, EndTime, IsActive
    FROM TimeSlots
    ORDER BY StartTime
  `);

  return result.recordset;
}

async function createTimeSlot({ startTime, endTime }) {
  if (!startTime || !endTime) {
    throw new HttpError(400, 'startTime and endTime are required');
  }

  const pool = await getPool();
  let result;

  try {
    result = await pool.request()
      .input('StartTime', sql.Time, startTime)
      .input('EndTime', sql.Time, endTime)
      .query(`
        INSERT INTO TimeSlots (StartTime, EndTime)
        OUTPUT INSERTED.TimeSlotId, INSERTED.StartTime, INSERTED.EndTime, INSERTED.IsActive
        VALUES (@StartTime, @EndTime)
      `);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new HttpError(409, 'Time slot already exists');
    }

    throw error;
  }

  return result.recordset[0];
}

async function updateTimeSlot(timeSlotId, { startTime, endTime, isActive }) {
  const pool = await getPool();
  let result;

  try {
    result = await pool.request()
      .input('TimeSlotId', sql.Int, timeSlotId)
      .input('StartTime', sql.Time, startTime || null)
      .input('EndTime', sql.Time, endTime || null)
      .input('IsActive', sql.Bit, isActive == null ? null : isActive)
      .query(`
        UPDATE TimeSlots
        SET
          StartTime = COALESCE(@StartTime, StartTime),
          EndTime = COALESCE(@EndTime, EndTime),
          IsActive = COALESCE(@IsActive, IsActive)
        OUTPUT INSERTED.TimeSlotId, INSERTED.StartTime, INSERTED.EndTime, INSERTED.IsActive
        WHERE TimeSlotId = @TimeSlotId
      `);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new HttpError(409, 'Time slot already exists');
    }

    throw error;
  }

  const timeSlot = result.recordset[0];

  if (!timeSlot) {
    throw new HttpError(404, 'Time slot not found');
  }

  return timeSlot;
}

module.exports = {
  listTimeSlots,
  createTimeSlot,
  updateTimeSlot,
};
