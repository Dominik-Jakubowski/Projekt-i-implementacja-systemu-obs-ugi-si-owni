const { sql, getPool } = require('../db/pool');
const { HttpError } = require('../utils/httpError');

async function listEquipment() {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT EquipmentId, Name, Description, Quantity, IsActive
    FROM Equipment
    ORDER BY Name
  `);

  return result.recordset;
}

async function getEquipmentById(equipmentId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('EquipmentId', sql.Int, equipmentId)
    .query(`
      SELECT EquipmentId, Name, Description, Quantity, IsActive
      FROM Equipment
      WHERE EquipmentId = @EquipmentId
    `);

  const equipment = result.recordset[0];

  if (!equipment) {
    throw new HttpError(404, 'Equipment not found');
  }

  return equipment;
}

async function getEquipmentAlternatives(equipmentId, { date, timeSlotId }) {
  if (!equipmentId || !date || !timeSlotId) {
    throw new HttpError(400, 'equipment id, date and timeSlotId are required');
  }

  // Sprawdzenie, czy wybrane urządzenie istnieje
  await getEquipmentById(equipmentId);

  const pool = await getPool();

  const result = await pool.request()
      .input('EquipmentId', sql.Int, equipmentId)
      .input('ReservationDate', sql.Date, date)
      .input('TimeSlotId', sql.Int, Number(timeSlotId))
      .query(`
      WITH SelectedEquipment AS (
          SELECT EquipmentId, Category
          FROM dbo.Equipment
          WHERE EquipmentId = @EquipmentId
      ),
      SelectedEquipmentMuscles AS (
          SELECT 
              em.MuscleId,
              em.ActivationLevel
          FROM dbo.EquipmentMuscles em
          WHERE em.EquipmentId = @EquipmentId
      ),
      ActiveReservations AS (
          SELECT 
              EquipmentId,
              COUNT(*) AS ActiveReservationCount
          FROM dbo.Reservations
          WHERE ReservationDate = @ReservationDate
            AND TimeSlotId = @TimeSlotId
            AND Status = 'active'
          GROUP BY EquipmentId
      ),
      CandidateEquipment AS (
          SELECT
              e.EquipmentId,
              e.Name,
              e.Description,
              e.Category,
              e.Quantity,
              COUNT(DISTINCT em.MuscleId) AS MatchingMusclesCount,
              SUM(em.ActivationLevel + sem.ActivationLevel) 
                  + CASE WHEN e.Category = se.Category THEN 10 ELSE 0 END AS SimilarityScore
          FROM dbo.Equipment e
          JOIN dbo.EquipmentMuscles em 
              ON em.EquipmentId = e.EquipmentId
          JOIN SelectedEquipmentMuscles sem 
              ON sem.MuscleId = em.MuscleId
          CROSS JOIN SelectedEquipment se
          WHERE e.EquipmentId <> @EquipmentId
            AND e.IsActive = 1
          GROUP BY 
              e.EquipmentId,
              e.Name,
              e.Description,
              e.Category,
              e.Quantity,
              se.Category
      )
      SELECT 
          ce.EquipmentId,
          ce.Name,
          ce.Description,
          ce.Category,
          ce.Quantity,
          ISNULL(ar.ActiveReservationCount, 0) AS ActiveReservationCount,
          ce.Quantity - ISNULL(ar.ActiveReservationCount, 0) AS AvailableQuantity,
          ce.MatchingMusclesCount,
          ce.SimilarityScore
      FROM CandidateEquipment ce
      LEFT JOIN ActiveReservations ar 
          ON ar.EquipmentId = ce.EquipmentId
      WHERE ce.Quantity - ISNULL(ar.ActiveReservationCount, 0) > 0
      ORDER BY 
          ce.SimilarityScore DESC,
          ce.MatchingMusclesCount DESC,
          ce.Name;
    `);

  return result.recordset;
}
async function createEquipment({ name, description, quantity }) {
  if (!name || quantity == null || Number(quantity) < 1) {
    throw new HttpError(400, 'name and positive quantity are required');
  }

  const pool = await getPool();
  const result = await pool.request()
    .input('Name', sql.NVarChar(150), name)
    .input('Description', sql.NVarChar(sql.MAX), description || null)
    .input('Quantity', sql.Int, quantity)
    .query(`
      INSERT INTO Equipment (Name, Description, Quantity)
      OUTPUT INSERTED.EquipmentId, INSERTED.Name, INSERTED.Description, INSERTED.Quantity, INSERTED.IsActive
      VALUES (@Name, @Description, @Quantity)
    `);

  return result.recordset[0];
}

async function updateEquipment(equipmentId, { name, description, quantity, isActive }) {
  const pool = await getPool();
  const result = await pool.request()
    .input('EquipmentId', sql.Int, equipmentId)
    .input('Name', sql.NVarChar(150), name || null)
    .input('Description', sql.NVarChar(sql.MAX), description === undefined ? null : description)
    .input('Quantity', sql.Int, quantity == null ? null : quantity)
    .input('IsActive', sql.Bit, isActive == null ? null : isActive)
    .query(`
      UPDATE Equipment
      SET
        Name = COALESCE(@Name, Name),
        Description = CASE WHEN @Description IS NULL THEN Description ELSE @Description END,
        Quantity = COALESCE(@Quantity, Quantity),
        IsActive = COALESCE(@IsActive, IsActive)
      OUTPUT INSERTED.EquipmentId, INSERTED.Name, INSERTED.Description, INSERTED.Quantity, INSERTED.IsActive
      WHERE EquipmentId = @EquipmentId
    `);

  const equipment = result.recordset[0];

  if (!equipment) {
    throw new HttpError(404, 'Equipment not found');
  }

  return equipment;
}

module.exports = {
  listEquipment,
  getEquipmentById,
  getEquipmentAlternatives,
  createEquipment,
  updateEquipment,
};
