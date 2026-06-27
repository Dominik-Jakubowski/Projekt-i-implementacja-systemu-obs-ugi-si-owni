const { sql, getPool } = require('../db/pool');
const { HttpError } = require('../utils/httpError');

async function listExercises() {
    const pool = await getPool();

    const result = await pool.request().query(`
      SELECT
        ExerciseId,
        Name,
        Description,
        ExerciseType,
        TimerMode,
        DefaultSets,
        DefaultRepetitions,
        DefaultDurationSeconds,
        DefaultRestSeconds,
        DefaultSeriesDurationSeconds,
        DifficultyLevel,
        IsActive,
        CreatedAt,
        UpdatedAt
      FROM dbo.Exercises
      WHERE IsActive = 1
      ORDER BY Name
    `);

    return result.recordset;
}

async function getExerciseById(exerciseId) {
    const pool = await getPool();

    const exerciseResult = await pool.request()
        .input('ExerciseId', sql.Int, exerciseId)
        .query(`
      SELECT
        ExerciseId,
        Name,
        Description,
        ExerciseType,
        TimerMode,
        DefaultSets,
        DefaultRepetitions,
        DefaultDurationSeconds,
        DefaultRestSeconds,
        DefaultSeriesDurationSeconds,
        DifficultyLevel,
        IsActive,
        CreatedAt,
        UpdatedAt
      FROM dbo.Exercises
      WHERE ExerciseId = @ExerciseId
        AND IsActive = 1
    `);

    const exercise = exerciseResult.recordset[0];

    if (!exercise) {
        throw new HttpError(404, 'Exercise not found');
    }

    const musclesResult = await pool.request()
        .input('ExerciseId', sql.Int, exerciseId)
        .query(`
      SELECT
        m.MuscleId,
        m.Name,
        m.MuscleGroup,
        m.LatinName,
        m.BodyPart,
        em.Role,
        em.ActivationLevel,
        em.Notes
      FROM dbo.ExerciseMuscles em
      JOIN dbo.Muscles m ON m.MuscleId = em.MuscleId
      WHERE em.ExerciseId = @ExerciseId
        AND m.IsActive = 1
      ORDER BY em.ActivationLevel DESC, m.Name
    `);

    const equipmentResult = await pool.request()
        .input('ExerciseId', sql.Int, exerciseId)
        .query(`
      SELECT
        e.EquipmentId,
        e.Name,
        e.Description,
        e.Category,
        e.Quantity,
        ee.IsDefault,
        ee.Notes
      FROM dbo.EquipmentExercises ee
      JOIN dbo.Equipment e ON e.EquipmentId = ee.EquipmentId
      WHERE ee.ExerciseId = @ExerciseId
        AND e.IsActive = 1
      ORDER BY ee.IsDefault DESC, e.Name
    `);

    return {
        ...exercise,
        muscles: musclesResult.recordset,
        equipment: equipmentResult.recordset,
    };
}

async function listExercisesByEquipment(equipmentId) {
    const pool = await getPool();

    const result = await pool.request()
        .input('EquipmentId', sql.Int, equipmentId)
        .query(`
      SELECT
        ex.ExerciseId,
        ex.Name,
        ex.Description,
        ex.ExerciseType,
        ex.TimerMode,
        ex.DefaultSets,
        ex.DefaultRepetitions,
        ex.DefaultDurationSeconds,
        ex.DefaultRestSeconds,
        ex.DefaultSeriesDurationSeconds,
        ex.DifficultyLevel,
        ee.IsDefault,
        ee.Notes
      FROM dbo.EquipmentExercises ee
      JOIN dbo.Exercises ex ON ex.ExerciseId = ee.ExerciseId
      JOIN dbo.Equipment e ON e.EquipmentId = ee.EquipmentId
      WHERE ee.EquipmentId = @EquipmentId
        AND ex.IsActive = 1
        AND e.IsActive = 1
      ORDER BY ee.IsDefault DESC, ex.Name
    `);

    return result.recordset;
}

module.exports = {
    listExercises,
    getExerciseById,
    listExercisesByEquipment,
};