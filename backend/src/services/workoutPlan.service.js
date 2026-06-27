const { sql, getPool } = require('../db/pool');
const { HttpError } = require('../utils/httpError');

async function updateEstimatedDuration(request, workoutPlanId) {
    await request
        .input('EstimatedWorkoutPlanId', sql.Int, workoutPlanId)
        .query(`
            UPDATE wp
            SET 
                EstimatedDurationSeconds =
                    CASE
                        WHEN ISNULL(calc.TotalSeconds, 0) < 1 THEN 1
                        ELSE calc.TotalSeconds
                    END,
                UpdatedAt = SYSUTCDATETIME()
            FROM dbo.WorkoutPlans wp
            OUTER APPLY (
                SELECT SUM(
                    CASE
                        WHEN wpi.ExerciseType = 'cardio' THEN
                            ISNULL(wpi.DurationSeconds, 0) + rest.EffectiveRestSeconds
                        ELSE
                            ISNULL(wpi.Sets, 1) * (
                                ISNULL(wpi.SeriesDurationSeconds, 60) + rest.EffectiveRestSeconds
                            )
                    END
                ) AS TotalSeconds
                FROM dbo.WorkoutPlanItems wpi
                CROSS APPLY (
                    SELECT CASE wp.Goal
                        WHEN 'strength' THEN 300
                        WHEN 'hypertrophy' THEN 120
                        WHEN 'endurance' THEN 30
                        ELSE 60
                    END AS EffectiveRestSeconds
                ) rest
                WHERE wpi.WorkoutPlanId = wp.WorkoutPlanId
                  AND wpi.IsActive = 1
            ) calc
            WHERE wp.WorkoutPlanId = @EstimatedWorkoutPlanId
        `);
}

async function listWorkoutPlans(userId) {
    const pool = await getPool();

    const result = await pool.request()
        .input('UserId', sql.Int, userId)
        .query(`
            SELECT
                WorkoutPlanId,
                UserId,
                Name,
                Description,
                Goal,
                DifficultyLevel,
                EstimatedDurationSeconds,
                IsTemplate,
                IsActive,
                CreatedAt,
                UpdatedAt
            FROM dbo.WorkoutPlans
            WHERE UserId = @UserId
              AND IsActive = 1
              AND IsTemplate = 0
              AND ISNULL(IsSystemGenerated, 0) = 0
            ORDER BY CreatedAt DESC
        `);

    return result.recordset;
}

async function listWorkoutPlanTemplates() {
    const pool = await getPool();

    const result = await pool.request()
        .query(`
            SELECT
                WorkoutPlanId,
                UserId,
                Name,
                Description,
                Goal,
                DifficultyLevel,
                EstimatedDurationSeconds,
                IsTemplate,
                IsActive,
                CreatedAt,
                UpdatedAt
            FROM dbo.WorkoutPlans
            WHERE IsActive = 1
              AND IsTemplate = 1
            ORDER BY Name
        `);

    return result.recordset;
}

async function getWorkoutPlanById(userId, workoutPlanId) {
    const pool = await getPool();

    const planResult = await pool.request()
        .input('UserId', sql.Int, userId)
        .input('WorkoutPlanId', sql.Int, workoutPlanId)
        .query(`
            SELECT
                WorkoutPlanId,
                UserId,
                Name,
                Description,
                Goal,
                DifficultyLevel,
                EstimatedDurationSeconds,
                IsTemplate,
                IsActive,
                CreatedAt,
                UpdatedAt
            FROM dbo.WorkoutPlans
            WHERE WorkoutPlanId = @WorkoutPlanId
              AND IsActive = 1
              AND (
                UserId = @UserId
                OR IsTemplate = 1
              )
        `);

    const plan = planResult.recordset[0];

    if (!plan) {
        throw new HttpError(404, 'Workout plan not found');
    }

    const itemsResult = await pool.request()
        .input('WorkoutPlanId', sql.Int, workoutPlanId)
        .query(`
            SELECT
                wpi.WorkoutPlanItemId,
                wpi.WorkoutPlanId,
                wpi.ExerciseId,
                wpi.EquipmentId,
                e.Name AS EquipmentName,
                e.Category AS EquipmentCategory,
                wpi.ExerciseName,
                wpi.OrderNumber,
                wpi.Sets,
                wpi.Repetitions,
                wpi.DurationSeconds,
                wpi.RestSeconds,
                wpi.ExerciseType,
                wpi.TimerMode,
                wpi.AutoAdvance,
                wpi.WeightKg,
                wpi.DistanceMeters,
                wpi.Rpe,
                wpi.Notes,
                wpi.SeriesDurationSeconds,
                wpi.IsActive,
                wpi.CreatedAt,
                wpi.UpdatedAt
            FROM dbo.WorkoutPlanItems wpi
            JOIN dbo.Equipment e ON e.EquipmentId = wpi.EquipmentId
            WHERE wpi.WorkoutPlanId = @WorkoutPlanId
              AND wpi.IsActive = 1
            ORDER BY wpi.OrderNumber
        `);

    return {
        ...plan,
        items: itemsResult.recordset,
    };
}

async function createWorkoutPlan(userId, data) {
    const { name, description, goal, difficultyLevel } = data;

    if (!name || !String(name).trim()) {
        throw new HttpError(400, 'Plan name is required');
    }

    const pool = await getPool();

    const result = await pool.request()
        .input('UserId', sql.Int, userId)
        .input('Name', sql.NVarChar(150), String(name).trim())
        .input('Description', sql.NVarChar(sql.MAX), description || null)
        .input('Goal', sql.NVarChar(50), goal || 'general')
        .input('DifficultyLevel', sql.NVarChar(50), difficultyLevel || 'beginner')
        .input('EstimatedDurationSeconds', sql.Int, 1)
        .query(`
            INSERT INTO dbo.WorkoutPlans (
                UserId,
                Name,
                Description,
                Goal,
                DifficultyLevel,
                EstimatedDurationSeconds,
                IsTemplate,
                IsActive,
                IsSystemGenerated
            )
            OUTPUT
                INSERTED.WorkoutPlanId,
                INSERTED.UserId,
                INSERTED.Name,
                INSERTED.Description,
                INSERTED.Goal,
                INSERTED.DifficultyLevel,
                INSERTED.EstimatedDurationSeconds,
                INSERTED.IsTemplate,
                INSERTED.IsActive,
                INSERTED.IsSystemGenerated,
                INSERTED.CreatedAt
            VALUES (
                       @UserId,
                       @Name,
                       @Description,
                       @Goal,
                       @DifficultyLevel,
                       @EstimatedDurationSeconds,
                       0,
                       1,
                       0
                   )
        `);

    return result.recordset[0];
}

async function createWorkoutPlanTemplate(adminUserId, data) {
    const pool = await getPool();

    const result = await pool.request()
        .input('UserId', sql.Int, adminUserId)
        .input('Name', sql.NVarChar(150), data.name)
        .input('Description', sql.NVarChar(sql.MAX), data.description || null)
        .input('Goal', sql.NVarChar(50), data.goal || 'general')
        .input('DifficultyLevel', sql.NVarChar(50), data.difficultyLevel || 'beginner')
        .query(`
            INSERT INTO dbo.WorkoutPlans (
                UserId,
                Name,
                Description,
                Goal,
                DifficultyLevel,
                EstimatedDurationSeconds,
                IsTemplate,
                IsActive
            )
            OUTPUT INSERTED.WorkoutPlanId
            VALUES (
                @UserId,
                @Name,
                @Description,
                @Goal,
                @DifficultyLevel,
                1,
                1,
                1
            )
        `);

    return getWorkoutPlanById(adminUserId, result.recordset[0].WorkoutPlanId);
}

async function addWorkoutPlanItem(userId, workoutPlanId, data) {
    const pool = await getPool();

    const exerciseId = data.exerciseId === null || data.exerciseId === undefined
        ? null
        : Number(data.exerciseId);

    const equipmentId = Number(data.equipmentId);
    const orderNumber = Number(data.orderNumber);

    if (!equipmentId) {
        throw new HttpError(400, 'equipmentId is required');
    }

    if (!orderNumber) {
        throw new HttpError(400, 'orderNumber is required');
    }

    const planResult = await pool.request()
        .input('UserId', sql.Int, userId)
        .input('WorkoutPlanId', sql.Int, workoutPlanId)
        .query(`
            SELECT WorkoutPlanId, UserId, IsTemplate
            FROM dbo.WorkoutPlans
            WHERE WorkoutPlanId = @WorkoutPlanId
              AND UserId = @UserId
              AND IsActive = 1
              AND IsTemplate = 0
        `);

    const plan = planResult.recordset[0];

    if (!plan) {
        throw new HttpError(404, 'Workout plan not found');
    }

    const equipmentResult = await pool.request()
        .input('EquipmentId', sql.Int, equipmentId)
        .query(`
            SELECT EquipmentId
            FROM dbo.Equipment
            WHERE EquipmentId = @EquipmentId
              AND IsActive = 1
        `);

    if (!equipmentResult.recordset[0]) {
        throw new HttpError(404, 'Equipment not found');
    }

    let exercise = null;

    if (exerciseId) {
        const exerciseResult = await pool.request()
            .input('ExerciseId', sql.Int, exerciseId)
            .input('EquipmentId', sql.Int, equipmentId)
            .query(`
                SELECT
                    ex.ExerciseId,
                    ex.Name,
                    ex.ExerciseType,
                    ex.TimerMode,
                    ex.DefaultSets,
                    ex.DefaultRepetitions,
                    ex.DefaultDurationSeconds,
                    ex.DefaultRestSeconds,
                    ex.DefaultSeriesDurationSeconds
                FROM dbo.Exercises ex
                JOIN dbo.EquipmentExercises ee ON ee.ExerciseId = ex.ExerciseId
                WHERE ex.ExerciseId = @ExerciseId
                  AND ee.EquipmentId = @EquipmentId
                  AND ex.IsActive = 1
            `);

        exercise = exerciseResult.recordset[0];

        if (!exercise) {
            throw new HttpError(
                400,
                'Selected exercise is not available for this equipment'
            );
        }
    }

    const orderResult = await pool.request()
        .input('WorkoutPlanId', sql.Int, workoutPlanId)
        .input('OrderNumber', sql.Int, orderNumber)
        .query(`
            SELECT WorkoutPlanItemId
            FROM dbo.WorkoutPlanItems
            WHERE WorkoutPlanId = @WorkoutPlanId
              AND OrderNumber = @OrderNumber
              AND IsActive = 1
        `);

    if (orderResult.recordset.length > 0) {
        throw new HttpError(409, 'Workout plan item with this order number already exists');
    }

    const exerciseName = data.exerciseName || exercise?.Name;
    const exerciseType = data.exerciseType || exercise?.ExerciseType || 'strength';
    const timerMode = data.timerMode || exercise?.TimerMode || 'sets_reps';

    if (!exerciseName) {
        throw new HttpError(400, 'exerciseName or exerciseId is required');
    }

    const sets = data.sets === null || data.sets === undefined
        ? exercise?.DefaultSets ?? null
        : Number(data.sets);

    const repetitions = data.repetitions === null || data.repetitions === undefined
        ? exercise?.DefaultRepetitions ?? null
        : Number(data.repetitions);

    const restSeconds = data.restSeconds === null || data.restSeconds === undefined
        ? exercise?.DefaultRestSeconds ?? 0
        : Number(data.restSeconds);

    const seriesDurationSeconds = data.seriesDurationSeconds === null || data.seriesDurationSeconds === undefined
        ? exercise?.DefaultSeriesDurationSeconds ?? 60
        : Number(data.seriesDurationSeconds);

    let durationSeconds = data.durationSeconds === null || data.durationSeconds === undefined
        ? exercise?.DefaultDurationSeconds ?? null
        : Number(data.durationSeconds);

    if (durationSeconds === null || durationSeconds === undefined) {
        const safeSets = sets || 1;
        const safeSeriesDurationSeconds = seriesDurationSeconds || 60;
        const safeRestSeconds = restSeconds || 0;

        durationSeconds = safeSets * (safeSeriesDurationSeconds + safeRestSeconds);
    }

    await pool.request()
        .input('WorkoutPlanId', sql.Int, workoutPlanId)
        .input('ExerciseId', sql.Int, exerciseId)
        .input('EquipmentId', sql.Int, equipmentId)
        .input('ExerciseName', sql.NVarChar(150), exerciseName)
        .input('OrderNumber', sql.Int, orderNumber)
        .input('Sets', sql.Int, sets)
        .input('Repetitions', sql.Int, repetitions)
        .input('DurationSeconds', sql.Int, durationSeconds)
        .input('RestSeconds', sql.Int, restSeconds)
        .input('ExerciseType', sql.NVarChar(50), exerciseType)
        .input('TimerMode', sql.NVarChar(50), timerMode)
        .input('AutoAdvance', sql.Bit, data.autoAdvance === undefined ? true : Boolean(data.autoAdvance))
        .input('WeightKg', sql.Decimal(6, 2), data.weightKg === null || data.weightKg === undefined ? null : Number(data.weightKg))
        .input('DistanceMeters', sql.Decimal(10, 2), data.distanceMeters === null || data.distanceMeters === undefined ? null : Number(data.distanceMeters))
        .input('Rpe', sql.Decimal(3, 1), data.rpe === null || data.rpe === undefined ? null : Number(data.rpe))
        .input('Notes', sql.NVarChar(sql.MAX), data.notes || null)
        .input('SeriesDurationSeconds', sql.Int, seriesDurationSeconds)
        .query(`
            INSERT INTO dbo.WorkoutPlanItems (
                WorkoutPlanId,
                ExerciseId,
                EquipmentId,
                ExerciseName,
                OrderNumber,
                Sets,
                Repetitions,
                DurationSeconds,
                RestSeconds,
                ExerciseType,
                TimerMode,
                AutoAdvance,
                WeightKg,
                DistanceMeters,
                Rpe,
                Notes,
                SeriesDurationSeconds,
                IsActive
            )
            VALUES (
                @WorkoutPlanId,
                @ExerciseId,
                @EquipmentId,
                @ExerciseName,
                @OrderNumber,
                @Sets,
                @Repetitions,
                @DurationSeconds,
                @RestSeconds,
                @ExerciseType,
                @TimerMode,
                @AutoAdvance,
                @WeightKg,
                @DistanceMeters,
                @Rpe,
                @Notes,
                @SeriesDurationSeconds,
                1
            )
        `);

    await updateEstimatedDuration(pool.request(), workoutPlanId);

    return getWorkoutPlanById(userId, workoutPlanId);
}

async function copyWorkoutPlanTemplate(userId, templateWorkoutPlanId, data = {}) {
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        const templateResult = await new sql.Request(transaction)
            .input('TemplateWorkoutPlanId', sql.Int, templateWorkoutPlanId)
            .query(`
                SELECT
                    WorkoutPlanId,
                    Name,
                    Description,
                    Goal,
                    DifficultyLevel,
                    EstimatedDurationSeconds
                FROM dbo.WorkoutPlans
                WHERE WorkoutPlanId = @TemplateWorkoutPlanId
                  AND IsTemplate = 1
                  AND IsActive = 1
            `);

        const template = templateResult.recordset[0];

        if (!template) {
            throw new HttpError(404, 'Workout plan template not found');
        }

        const estimatedDurationSeconds = Math.max(
            Number(template.EstimatedDurationSeconds || 1),
            1
        );

        const newPlanResult = await new sql.Request(transaction)
            .input('UserId', sql.Int, userId)
            .input('Name', sql.NVarChar(150), data.name || template.Name)
            .input('Description', sql.NVarChar(sql.MAX), data.description || template.Description)
            .input('Goal', sql.NVarChar(50), template.Goal)
            .input('DifficultyLevel', sql.NVarChar(50), template.DifficultyLevel)
            .input('EstimatedDurationSeconds', sql.Int, estimatedDurationSeconds)
            .query(`
                INSERT INTO dbo.WorkoutPlans (
                    UserId,
                    Name,
                    Description,
                    Goal,
                    DifficultyLevel,
                    EstimatedDurationSeconds,
                    IsTemplate,
                    IsActive
                )
                OUTPUT INSERTED.WorkoutPlanId
                VALUES (
                    @UserId,
                    @Name,
                    @Description,
                    @Goal,
                    @DifficultyLevel,
                    @EstimatedDurationSeconds,
                    0,
                    1
                )
            `);

        const newWorkoutPlanId = newPlanResult.recordset[0].WorkoutPlanId;

        await new sql.Request(transaction)
            .input('TemplateWorkoutPlanId', sql.Int, templateWorkoutPlanId)
            .input('NewWorkoutPlanId', sql.Int, newWorkoutPlanId)
            .query(`
                INSERT INTO dbo.WorkoutPlanItems (
                    WorkoutPlanId,
                    ExerciseId,
                    EquipmentId,
                    ExerciseName,
                    OrderNumber,
                    Sets,
                    Repetitions,
                    DurationSeconds,
                    RestSeconds,
                    ExerciseType,
                    TimerMode,
                    AutoAdvance,
                    WeightKg,
                    DistanceMeters,
                    Rpe,
                    Notes,
                    SeriesDurationSeconds,
                    IsActive
                )
                SELECT
                    @NewWorkoutPlanId,
                    ExerciseId,
                    EquipmentId,
                    ExerciseName,
                    OrderNumber,
                    Sets,
                    Repetitions,
                    DurationSeconds,
                    RestSeconds,
                    ExerciseType,
                    TimerMode,
                    AutoAdvance,
                    WeightKg,
                    DistanceMeters,
                    Rpe,
                    Notes,
                    SeriesDurationSeconds,
                    1
                FROM dbo.WorkoutPlanItems
                WHERE WorkoutPlanId = @TemplateWorkoutPlanId
                  AND IsActive = 1
            `);

        await updateEstimatedDuration(new sql.Request(transaction), newWorkoutPlanId);

        await transaction.commit();

        return getWorkoutPlanById(userId, newWorkoutPlanId);
    } catch (error) {
        try {
            await transaction.rollback();
        } catch (_) {
            // ignore rollback error
        }

        throw error;
    }
}

async function deleteWorkoutPlan(userId, workoutPlanId) {
    const pool = await getPool();

    const result = await pool.request()
        .input('UserId', sql.Int, userId)
        .input('WorkoutPlanId', sql.Int, workoutPlanId)
        .query(`
            UPDATE dbo.WorkoutPlans
            SET IsActive = 0,
                UpdatedAt = SYSUTCDATETIME()
            OUTPUT INSERTED.WorkoutPlanId
            WHERE WorkoutPlanId = @WorkoutPlanId
              AND UserId = @UserId
              AND IsActive = 1
              AND IsTemplate = 0
        `);

    if (result.recordset.length === 0) {
        throw new HttpError(404, 'Workout plan not found');
    }

    await pool.request()
        .input('WorkoutPlanId', sql.Int, workoutPlanId)
        .query(`
            UPDATE dbo.WorkoutPlanItems
            SET IsActive = 0,
                UpdatedAt = SYSUTCDATETIME()
            WHERE WorkoutPlanId = @WorkoutPlanId
              AND IsActive = 1
        `);

    return {
        message: 'Workout plan deleted',
        workoutPlanId,
    };
}

module.exports = {
    listWorkoutPlans,
    listWorkoutPlanTemplates,
    getWorkoutPlanById,
    createWorkoutPlan,
    createWorkoutPlanTemplate,
    addWorkoutPlanItem,
    copyWorkoutPlanTemplate,
    deleteWorkoutPlan,
};