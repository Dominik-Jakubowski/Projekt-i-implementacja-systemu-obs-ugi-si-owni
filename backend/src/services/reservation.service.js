const { sql, getPool } = require('../db/pool');
const { HttpError } = require('../utils/httpError');

const ACTIVE_STATUS = 'active';
const CANCELLED_STATUS = 'cancelled';

async function listOwnReservations(userId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('UserId', sql.Int, userId)
    .query(`
      SELECT
        r.ReservationId,
        r.ReservationDate,
        r.Status,
        r.CreatedAt,
        e.EquipmentId,
        e.Name AS EquipmentName,
        ts.TimeSlotId,
        ts.StartTime,
        ts.EndTime
      FROM Reservations r
      JOIN Equipment e ON e.EquipmentId = r.EquipmentId
      JOIN TimeSlots ts ON ts.TimeSlotId = r.TimeSlotId
      WHERE r.UserId = @UserId
      ORDER BY r.ReservationDate DESC, ts.StartTime DESC
    `);

  return result.recordset;
}

async function listAllReservations() {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT
      r.ReservationId,
      r.ReservationDate,
      r.Status,
      r.CreatedAt,
      u.UserId,
      u.Email,
      e.EquipmentId,
      e.Name AS EquipmentName,
      ts.TimeSlotId,
      ts.StartTime,
      ts.EndTime
    FROM Reservations r
    JOIN Users u ON u.UserId = r.UserId
    JOIN Equipment e ON e.EquipmentId = r.EquipmentId
    JOIN TimeSlots ts ON ts.TimeSlotId = r.TimeSlotId
    ORDER BY r.ReservationDate DESC, ts.StartTime DESC
  `);

  return result.recordset;
}

async function createReservation(userId, { equipmentId, timeSlotId, reservationDate }) {
  if (!equipmentId || !timeSlotId || !reservationDate) {
    throw new HttpError(400, 'equipmentId, timeSlotId and reservationDate are required');
  }

  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);

  try {
    const request = new sql.Request(transaction)
      .input('UserId', sql.Int, userId)
      .input('EquipmentId', sql.Int, equipmentId)
      .input('TimeSlotId', sql.Int, timeSlotId)
      .input('ReservationDate', sql.Date, reservationDate)
      .input('Status', sql.NVarChar(20), ACTIVE_STATUS);

    const timeSlot = await request.query(`
      SELECT TimeSlotId
      FROM TimeSlots WITH (UPDLOCK, HOLDLOCK)
      WHERE TimeSlotId = @TimeSlotId
        AND IsActive = 1
    `);

    if (timeSlot.recordset.length === 0) {
      throw new HttpError(404, 'Active time slot not found');
    }

    const duplicateReservation = await new sql.Request(transaction)
      .input('UserId', sql.Int, userId)
      .input('EquipmentId', sql.Int, equipmentId)
      .input('TimeSlotId', sql.Int, timeSlotId)
      .input('ReservationDate', sql.Date, reservationDate)
      .input('Status', sql.NVarChar(20), ACTIVE_STATUS)
      .query(`
        SELECT ReservationId
        FROM Reservations WITH (UPDLOCK, HOLDLOCK)
        WHERE UserId = @UserId
          AND EquipmentId = @EquipmentId
          AND TimeSlotId = @TimeSlotId
          AND ReservationDate = @ReservationDate
          AND Status = @Status
      `);

    if (duplicateReservation.recordset.length > 0) {
      throw new HttpError(409, 'User already has an active reservation for this equipment, date and time slot');
    }

    const availability = await request.query(`
      SELECT
        e.Quantity,
        COUNT(r.ReservationId) AS ActiveReservations
      FROM Equipment e WITH (UPDLOCK, HOLDLOCK)
      LEFT JOIN Reservations r WITH (UPDLOCK, HOLDLOCK)
        ON r.EquipmentId = e.EquipmentId
        AND r.TimeSlotId = @TimeSlotId
        AND r.ReservationDate = @ReservationDate
        AND r.Status = @Status
      WHERE e.EquipmentId = @EquipmentId
        AND e.IsActive = 1
      GROUP BY e.Quantity
    `);

    const row = availability.recordset[0];

    if (!row) {
      throw new HttpError(404, 'Active equipment not found');
    }

    if (row.ActiveReservations >= row.Quantity) {
      throw new HttpError(409, 'Equipment reservation limit reached for this date and time slot');
    }

    const insertResult = await new sql.Request(transaction)
      .input('UserId', sql.Int, userId)
      .input('EquipmentId', sql.Int, equipmentId)
      .input('TimeSlotId', sql.Int, timeSlotId)
      .input('ReservationDate', sql.Date, reservationDate)
      .input('Status', sql.NVarChar(20), ACTIVE_STATUS)
      .query(`
        INSERT INTO Reservations (UserId, EquipmentId, TimeSlotId, ReservationDate, Status)
        OUTPUT INSERTED.ReservationId, INSERTED.UserId, INSERTED.EquipmentId, INSERTED.TimeSlotId,
               INSERTED.ReservationDate, INSERTED.Status, INSERTED.CreatedAt
        VALUES (@UserId, @EquipmentId, @TimeSlotId, @ReservationDate, @Status)
      `);

    await transaction.commit();
    return insertResult.recordset[0];
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function cancelOwnReservation(userId, reservationId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('UserId', sql.Int, userId)
    .input('ReservationId', sql.Int, reservationId)
    .input('ActiveStatus', sql.NVarChar(20), ACTIVE_STATUS)
    .input('CancelledStatus', sql.NVarChar(20), CANCELLED_STATUS)
    .query(`
      UPDATE Reservations
      SET Status = @CancelledStatus, CancelledAt = SYSUTCDATETIME()
      OUTPUT INSERTED.ReservationId, INSERTED.Status, INSERTED.CancelledAt
      WHERE ReservationId = @ReservationId
        AND UserId = @UserId
        AND Status = @ActiveStatus
    `);

  const reservation = result.recordset[0];

  if (!reservation) {
    throw new HttpError(404, 'Active reservation not found');
  }

  return reservation;
}

module.exports = {
  listOwnReservations,
  listAllReservations,
  createReservation,
  cancelOwnReservation,
};
