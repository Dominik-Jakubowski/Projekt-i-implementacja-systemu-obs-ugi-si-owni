const { sql, getPool } = require('../db/pool');
const { HttpError } = require('../utils/httpError');

function normalizeTime(time) {
    if (!time) {
        return null;
    }

    const parts = String(time).split(':');
    const hours = parts[0]?.padStart(2, '0');
    const minutes = parts[1]?.padStart(2, '0');

    if (!hours || !minutes) {
        return null;
    }

    return `${hours}:${minutes}:00`;
}

function getRestSecondsForGoal(goal) {
    switch (goal) {
        case 'strength':
            return 300; // 5 minut
        case 'hypertrophy':
            return 120; // 2 minuty
        case 'endurance':
            return 30; // 30 sekund
        default:
            return 60; // trening ogólny
    }
}

function resolveItemTiming(planGoal, item) {
    const effectiveRestSeconds = getRestSecondsForGoal(planGoal);
    const exerciseType = item.ExerciseType || item.exerciseType || 'strength';

    const storedDurationSeconds = Number(
        item.DurationSeconds ??
        item.StoredDurationSeconds ??
        item.durationSeconds ??
        0
    );

    const sets = Number(
        item.Sets ??
        item.sets ??
        1
    );

    const seriesDurationSeconds = Number(
        item.SeriesDurationSeconds ??
        item.seriesDurationSeconds ??
        60
    );

    if (exerciseType === 'cardio') {
        const calculatedDurationSeconds = storedDurationSeconds + effectiveRestSeconds;

        return {
            effectiveRestSeconds,
            calculatedDurationSeconds,
            calculatedDurationMinutes: Math.ceil(calculatedDurationSeconds / 60),
        };
    }

    const calculatedDurationSeconds = sets * (
        seriesDurationSeconds + effectiveRestSeconds
    );

    return {
        effectiveRestSeconds,
        calculatedDurationSeconds,
        calculatedDurationMinutes: Math.ceil(calculatedDurationSeconds / 60),
    };
}

async function listWorkoutSessions(userId) {
    const pool = await getPool();

    const result = await pool.request()
        .input('UserId', sql.Int, userId)
        .query(`
            SELECT
                ws.WorkoutSessionId,
                ws.UserId,
                ws.WorkoutPlanId,
                wp.Name AS WorkoutPlanName,
                wp.Goal AS WorkoutPlanGoal,
                ws.SessionDate,
                CONVERT(varchar(8), ws.StartTime, 108) AS StartTime,
                CONVERT(varchar(8), ws.EndTime, 108) AS EndTime,
                ws.Status,
                ws.CreatedAt
            FROM dbo.WorkoutSessions ws
                     JOIN dbo.WorkoutPlans wp ON wp.WorkoutPlanId = ws.WorkoutPlanId
            WHERE ws.UserId = @UserId
            ORDER BY ws.SessionDate DESC, ws.StartTime DESC
        `);

    return result.recordset;
}

async function getWorkoutSessionById(userId, workoutSessionId) {
    const pool = await getPool();

    const sessionResult = await pool.request()
        .input('UserId', sql.Int, userId)
        .input('WorkoutSessionId', sql.Int, workoutSessionId)
        .query(`
            SELECT
                ws.WorkoutSessionId,
                ws.UserId,
                ws.WorkoutPlanId,
                wp.Name AS WorkoutPlanName,
                wp.Goal AS WorkoutPlanGoal,
                ws.SessionDate,
                CONVERT(varchar(8), ws.StartTime, 108) AS StartTime,
                CONVERT(varchar(8), ws.EndTime, 108) AS EndTime,
                ws.Status,
                ws.CreatedAt
            FROM dbo.WorkoutSessions ws
                     JOIN dbo.WorkoutPlans wp ON wp.WorkoutPlanId = ws.WorkoutPlanId
            WHERE ws.WorkoutSessionId = @WorkoutSessionId
              AND ws.UserId = @UserId
        `);

    const session = sessionResult.recordset[0];

    if (!session) {
        throw new HttpError(404, 'Workout session not found');
    }

    const itemsResult = await pool.request()
        .input('UserId', sql.Int, userId)
        .input('WorkoutSessionId', sql.Int, workoutSessionId)
        .query(`
            SELECT
                r.ReservationId,
                r.WorkoutSessionId,
                r.WorkoutPlanItemId,

                wp.Goal AS WorkoutPlanGoal,

                wpi.OrderNumber,
                wpi.ExerciseName,
                wpi.ExerciseType,
                wpi.Sets,
                wpi.Repetitions,
                wpi.SeriesDurationSeconds,
                wpi.RestSeconds AS StoredRestSeconds,
                wpi.DurationSeconds AS StoredDurationSeconds,
                wpi.TimerMode,
                wpi.AutoAdvance,
                wpi.WeightKg,
                wpi.DistanceMeters,
                wpi.Rpe,
                wpi.Notes,

                e.EquipmentId,
                e.Name AS EquipmentName,
                e.Category AS EquipmentCategory,

                CONVERT(varchar(8), MIN(ts.StartTime), 108) AS PlannedStartTime,
                CONVERT(varchar(8), MAX(ts.EndTime), 108) AS PlannedEndTime,
                COUNT(ts.TimeSlotId) AS ReservedMinutes
            FROM dbo.Reservations r
                     JOIN dbo.WorkoutSessions ws ON ws.WorkoutSessionId = r.WorkoutSessionId
                     JOIN dbo.WorkoutPlans wp ON wp.WorkoutPlanId = ws.WorkoutPlanId
                     JOIN dbo.WorkoutPlanItems wpi ON wpi.WorkoutPlanItemId = r.WorkoutPlanItemId
                     JOIN dbo.Equipment e ON e.EquipmentId = r.EquipmentId
                     JOIN dbo.ReservationTimeSlots rts ON rts.ReservationId = r.ReservationId
                     JOIN dbo.TimeSlots ts ON ts.TimeSlotId = rts.TimeSlotId
            WHERE r.WorkoutSessionId = @WorkoutSessionId
              AND ws.UserId = @UserId
              AND r.Status = 'active'
            GROUP BY
                r.ReservationId,
                r.WorkoutSessionId,
                r.WorkoutPlanItemId,

                wp.Goal,

                wpi.OrderNumber,
                wpi.ExerciseName,
                wpi.ExerciseType,
                wpi.Sets,
                wpi.Repetitions,
                wpi.SeriesDurationSeconds,
                wpi.RestSeconds,
                wpi.DurationSeconds,
                wpi.TimerMode,
                wpi.AutoAdvance,
                wpi.WeightKg,
                wpi.DistanceMeters,
                wpi.Rpe,
                wpi.Notes,

                e.EquipmentId,
                e.Name,
                e.Category
            ORDER BY wpi.OrderNumber
        `);

    const items = itemsResult.recordset.map((item) => {
        const timing = resolveItemTiming(item.WorkoutPlanGoal, item);

        return {
            ...item,

            // Dane zapisane w planie
            RestSeconds: item.StoredRestSeconds,
            DurationSeconds: item.StoredDurationSeconds,

            // Dane realnie użyte do rezerwacji
            EffectiveRestSeconds: timing.effectiveRestSeconds,
            CalculatedDurationSeconds: timing.calculatedDurationSeconds,
            CalculatedDurationMinutes: timing.calculatedDurationMinutes,
        };
    });

    return {
        ...session,
        items,
    };
}

async function createWorkoutSession(userId, data) {
    const workoutPlanId = Number(data.workoutPlanId);
    const sessionDate = data.sessionDate;
    const startTime = normalizeTime(data.startTime);

    if (!workoutPlanId || !sessionDate || !startTime) {
        throw new HttpError(400, 'workoutPlanId, sessionDate and startTime are required');
    }

    const pool = await getPool();

    await validateSessionDateTimeAgainstDatabase(pool, sessionDate, startTime);

    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);

        const planResult = await new sql.Request(transaction)
            .input('UserId', sql.Int, userId)
            .input('WorkoutPlanId', sql.Int, workoutPlanId)
            .query(`
                SELECT WorkoutPlanId, UserId, Name, Goal
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

        const itemsResult = await new sql.Request(transaction)
            .input('WorkoutPlanId', sql.Int, workoutPlanId)
            .query(`
                SELECT
                    wpi.WorkoutPlanItemId,
                    wpi.WorkoutPlanId,
                    wpi.EquipmentId,
                    wpi.ExerciseName,
                    wpi.OrderNumber,
                    wpi.Sets,
                    wpi.Repetitions,
                    wpi.DurationSeconds,
                    wpi.RestSeconds,
                    wpi.ExerciseType,
                    wpi.TimerMode,
                    wpi.AutoAdvance,
                    wpi.SeriesDurationSeconds,

                    e.Name AS EquipmentName,
                    e.Category AS EquipmentCategory
                FROM dbo.WorkoutPlanItems wpi
                         JOIN dbo.Equipment e ON e.EquipmentId = wpi.EquipmentId
                WHERE wpi.WorkoutPlanId = @WorkoutPlanId
                  AND wpi.IsActive = 1
                  AND e.IsActive = 1
                ORDER BY wpi.OrderNumber
            `);

        const items = itemsResult.recordset;

        if (items.length === 0) {
            throw new HttpError(400, 'Workout plan has no active items');
        }

        const sessionResult = await new sql.Request(transaction)
            .input('UserId', sql.Int, userId)
            .input('WorkoutPlanId', sql.Int, workoutPlanId)
            .input('SessionDate', sql.Date, sessionDate)
            .input('StartTime', sql.VarChar(8), startTime)
            .query(`
                INSERT INTO dbo.WorkoutSessions (
                    UserId,
                    WorkoutPlanId,
                    SessionDate,
                    StartTime,
                    Status
                )
                    OUTPUT INSERTED.WorkoutSessionId
                VALUES (
                    @UserId,
                    @WorkoutPlanId,
                    @SessionDate,
                    CAST(@StartTime AS TIME),
                    'scheduled'
                    )
            `);

        const workoutSessionId = sessionResult.recordset[0].WorkoutSessionId;
        let currentStartTime = startTime;

        for (const item of items) {
            const timing = resolveItemTiming(plan.Goal, item);
            const durationMinutes = timing.calculatedDurationMinutes;

            if (!durationMinutes || durationMinutes < 1) {
                throw new HttpError(
                    400,
                    `Invalid duration for exercise: ${item.ExerciseName}`
                );
            }

            const slotsResult = await new sql.Request(transaction)
                .input('CurrentStartTime', sql.VarChar(8), currentStartTime)
                .input('DurationMinutes', sql.Int, durationMinutes)
                .query(`
                    DECLARE @StartTime TIME = CAST(@CurrentStartTime AS TIME);
                    DECLARE @EndTime TIME = CAST(
                            DATEADD(MINUTE, @DurationMinutes, CAST(@StartTime AS DATETIME2))
                        AS TIME
                                            );

                    SELECT
                        TimeSlotId,
                        CONVERT(varchar(8), StartTime, 108) AS StartTime,
                        CONVERT(varchar(8), EndTime, 108) AS EndTime
                    FROM dbo.TimeSlots
                    WHERE StartTime >= @StartTime
                      AND EndTime <= @EndTime
                      AND IsActive = 1
                    ORDER BY StartTime
                `);

            const slots = slotsResult.recordset;

            if (slots.length !== durationMinutes) {
                throw new HttpError(
                    409,
                    `Not enough time slots for exercise: ${item.ExerciseName}`
                );
            }

            for (const slot of slots) {
                const lockName = `equipment:${item.EquipmentId}:date:${sessionDate}:slot:${slot.TimeSlotId}`;

                const lockResult = await new sql.Request(transaction)
                    .input('Resource', sql.NVarChar(255), lockName)
                    .query(`
                        DECLARE @result INT;

                        EXEC @result = sp_getapplock
                                       @Resource = @Resource,
                                       @LockMode = 'Exclusive',
                                       @LockOwner = 'Transaction',
                                       @LockTimeout = 5000;

                        SELECT @result AS LockResult;
                    `);

                if (lockResult.recordset[0].LockResult < 0) {
                    throw new HttpError(409, 'Could not lock requested time slot');
                }

                const availabilityResult = await new sql.Request(transaction)
                    .input('EquipmentId', sql.Int, item.EquipmentId)
                    .input('ReservationDate', sql.Date, sessionDate)
                    .input('TimeSlotId', sql.Int, slot.TimeSlotId)
                    .query(`
                        SELECT
                            e.Quantity,
                            COUNT(rts.TimeSlotId) AS ActiveReservationCount
                        FROM dbo.Equipment e
                                 LEFT JOIN dbo.Reservations r
                                           ON r.EquipmentId = e.EquipmentId
                                               AND r.ReservationDate = @ReservationDate
                                               AND r.Status = 'active'
                                 LEFT JOIN dbo.ReservationTimeSlots rts
                                           ON rts.ReservationId = r.ReservationId
                                               AND rts.TimeSlotId = @TimeSlotId
                        WHERE e.EquipmentId = @EquipmentId
                          AND e.IsActive = 1
                        GROUP BY e.Quantity
                    `);

                const availability = availabilityResult.recordset[0];

                if (!availability) {
                    throw new HttpError(404, `Equipment not found: ${item.EquipmentId}`);
                }

                if (availability.ActiveReservationCount >= availability.Quantity) {
                    throw new HttpError(
                        409,
                        `Equipment "${item.EquipmentName}" is not available at ${slot.StartTime}`
                    );
                }
                const duplicateUserReservationResult = await new sql.Request(transaction)
                    .input('UserId', sql.Int, userId)
                    .input('EquipmentId', sql.Int, item.EquipmentId)
                    .input('ReservationDate', sql.Date, sessionDate)
                    .input('TimeSlotId', sql.Int, slot.TimeSlotId)
                    .query(`
        SELECT TOP 1 r.ReservationId
        FROM dbo.Reservations r
        JOIN dbo.ReservationTimeSlots rts 
          ON rts.ReservationId = r.ReservationId
        WHERE r.UserId = @UserId
          AND r.EquipmentId = @EquipmentId
          AND r.ReservationDate = @ReservationDate
          AND r.Status = 'active'
          AND rts.TimeSlotId = @TimeSlotId
    `);

                if (duplicateUserReservationResult.recordset.length > 0) {
                    throw new HttpError(
                        409,
                        `User already has an active reservation for "${item.EquipmentName}" at ${slot.StartTime}`
                    );
                }
            }

            const firstSlot = slots[0];
            const lastSlot = slots[slots.length - 1];

            const reservationResult = await new sql.Request(transaction)
                .input('UserId', sql.Int, userId)
                .input('EquipmentId', sql.Int, item.EquipmentId)
                .input('TimeSlotId', sql.Int, firstSlot.TimeSlotId)
                .input('ReservationDate', sql.Date, sessionDate)
                .input('WorkoutSessionId', sql.Int, workoutSessionId)
                .input('WorkoutPlanItemId', sql.Int, item.WorkoutPlanItemId)
                .query(`
                    INSERT INTO dbo.Reservations (
                        UserId,
                        EquipmentId,
                        TimeSlotId,
                        ReservationDate,
                        Status,
                        WorkoutSessionId,
                        WorkoutPlanItemId
                    )
                        OUTPUT INSERTED.ReservationId
                    VALUES (
                        @UserId,
                        @EquipmentId,
                        @TimeSlotId,
                        @ReservationDate,
                        'active',
                        @WorkoutSessionId,
                        @WorkoutPlanItemId
                        )
                `);

            const reservationId = reservationResult.recordset[0].ReservationId;

            for (const slot of slots) {
                await new sql.Request(transaction)
                    .input('ReservationId', sql.Int, reservationId)
                    .input('TimeSlotId', sql.Int, slot.TimeSlotId)
                    .query(`
                        INSERT INTO dbo.ReservationTimeSlots (
                            ReservationId,
                            TimeSlotId
                        )
                        VALUES (
                                   @ReservationId,
                                   @TimeSlotId
                               )
                    `);
            }

            currentStartTime = lastSlot.EndTime;
        }

        await new sql.Request(transaction)
            .input('WorkoutSessionId', sql.Int, workoutSessionId)
            .input('EndTime', sql.VarChar(8), currentStartTime)
            .query(`
                UPDATE dbo.WorkoutSessions
                SET EndTime = CAST(@EndTime AS TIME)
                WHERE WorkoutSessionId = @WorkoutSessionId
            `);

        await transaction.commit();

        return getWorkoutSessionById(userId, workoutSessionId);
    } catch (error) {
        try {
            await transaction.rollback();
        } catch (_) {
            // ignore rollback error
        }

        if (error.number === 2601 || error.number === 2627) {
            throw new HttpError(
                409,
                'Reservation conflict. Selected time slot is already reserved.'
            );
        }

        throw error;
    }
}

function timeToSeconds(value) {
    const text = String(value).slice(0, 8);
    const parts = text.split(':').map(Number);

    const hours = parts[0] || 0;
    const minutes = parts[1] || 0;
    const seconds = parts[2] || 0;

    return hours * 3600 + minutes * 60 + seconds;
}

function secondsToTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [
        String(hours).padStart(2, '0'),
        String(minutes).padStart(2, '0'),
        String(seconds).padStart(2, '0'),
    ].join(':');
}

function addSecondsToTime(time, seconds) {
    return secondsToTime(timeToSeconds(time) + seconds);
}

function normalizePreviewTime(value) {
    if (!value) {
        return null;
    }

    const text = String(value);

    if (/^\d{2}:\d{2}$/.test(text)) {
        return `${text}:00`;
    }

    if (/^\d{2}:\d{2}:\d{2}$/.test(text)) {
        return text;
    }

    return null;
}

async function checkEquipmentAvailability(pool, {
    userId,
    equipmentId,
    sessionDate,
    startTime,
    endTime,
    requiredMinutes,
}) {
    const result = await pool.request()
        .input('UserId', sql.Int, userId)
        .input('EquipmentId', sql.Int, equipmentId)
        .input('ReservationDate', sql.Date, sessionDate)
        .input('StartTime', sql.VarChar(8), startTime)
        .input('EndTime', sql.VarChar(8), endTime)
        .query(`
            SELECT
                e.EquipmentId,
                e.Name AS EquipmentName,
                e.Quantity,
                availability.SlotCount,
                availability.MaxActiveReservationCount,
                availability.UserActiveReservationCount
            FROM dbo.Equipment e
                CROSS APPLY (
                SELECT
                    COUNT(*) AS SlotCount,
                    ISNULL(MAX(slotCounts.ActiveReservationCount), 0) AS MaxActiveReservationCount,
                    ISNULL(MAX(slotCounts.UserActiveReservationCount), 0) AS UserActiveReservationCount
                FROM (
                    SELECT
                        ts.TimeSlotId,
                        COUNT(r.ReservationId) AS ActiveReservationCount,
                        SUM(CASE WHEN r.UserId = @UserId THEN 1 ELSE 0 END) AS UserActiveReservationCount
                    FROM dbo.TimeSlots ts
                    LEFT JOIN dbo.ReservationTimeSlots rts
                        ON rts.TimeSlotId = ts.TimeSlotId
                    LEFT JOIN dbo.Reservations r
                        ON r.ReservationId = rts.ReservationId
                       AND r.EquipmentId = @EquipmentId
                       AND r.ReservationDate = @ReservationDate
                       AND r.Status = 'active'
                    WHERE ts.IsActive = 1
                      AND ts.StartTime >= CONVERT(time, @StartTime)
                      AND ts.StartTime < CONVERT(time, @EndTime)
                    GROUP BY ts.TimeSlotId
                ) slotCounts
            ) availability
            WHERE e.EquipmentId = @EquipmentId
              AND e.IsActive = 1
        `);

    const row = result.recordset[0];

    if (!row) {
        return {
            available: false,
            reason: 'Equipment not found',
            slotCount: 0,
            quantity: 0,
            maxActiveReservationCount: 0,
            userActiveReservationCount: 0,
        };
    }

    const slotCount = Number(row.SlotCount || 0);
    const quantity = Number(row.Quantity || 0);
    const maxActiveReservationCount = Number(row.MaxActiveReservationCount || 0);
    const userActiveReservationCount = Number(row.UserActiveReservationCount || 0);

    if (slotCount < requiredMinutes) {
        return {
            available: false,
            reason: 'Selected time is outside available time slots',
            slotCount,
            quantity,
            maxActiveReservationCount,
            userActiveReservationCount,
        };
    }

    if (userActiveReservationCount > 0) {
        return {
            available: false,
            reason: 'User already has an active reservation in selected time',
            slotCount,
            quantity,
            maxActiveReservationCount,
            userActiveReservationCount,
        };
    }

    const available = maxActiveReservationCount < quantity;

    return {
        available,
        reason: available ? null : 'Equipment is not available in selected time',
        slotCount,
        quantity,
        maxActiveReservationCount,
        userActiveReservationCount,
    };
}

async function findAvailableAlternativeForItem(pool, {
    userId,
    item,
    sessionDate,
    startTime,
    endTime,
    requiredMinutes,
}) {
    if (!item.ExerciseId) {
        return null;
    }

    const candidatesResult = await pool.request()
        .input('ExerciseId', sql.Int, item.ExerciseId)
        .input('EquipmentId', sql.Int, item.EquipmentId)
        .input('ExerciseType', sql.NVarChar(50), item.ExerciseType)
        .query(`
            SELECT TOP 10
                ex.ExerciseId,
                ex.Name AS ExerciseName,
                ex.ExerciseType,
                ex.TimerMode,
                ee.EquipmentId,
                e.Name AS EquipmentName,
                e.Category AS EquipmentCategory,
                SUM(
                    ISNULL(originalMuscles.ActivationLevel, 1)
                    * ISNULL(candidateMuscles.ActivationLevel, 1)
                ) AS SimilarityScore
            FROM dbo.ExerciseMuscles originalMuscles
            JOIN dbo.ExerciseMuscles candidateMuscles
                ON candidateMuscles.MuscleId = originalMuscles.MuscleId
            JOIN dbo.Exercises ex
                ON ex.ExerciseId = candidateMuscles.ExerciseId
            JOIN dbo.EquipmentExercises ee
                ON ee.ExerciseId = ex.ExerciseId
            JOIN dbo.Equipment e
                ON e.EquipmentId = ee.EquipmentId
            WHERE originalMuscles.ExerciseId = @ExerciseId
              AND ex.ExerciseId <> @ExerciseId
              AND ee.EquipmentId <> @EquipmentId
              AND ex.ExerciseType = @ExerciseType
              AND ex.IsActive = 1
              AND e.IsActive = 1
            GROUP BY
                ex.ExerciseId,
                ex.Name,
                ex.ExerciseType,
                ex.TimerMode,
                ee.EquipmentId,
                e.Name,
                e.Category,
                ee.IsDefault
            ORDER BY
                SimilarityScore DESC,
                ee.IsDefault DESC,
                ex.Name
        `);

    for (const candidate of candidatesResult.recordset) {
        const availability = await checkEquipmentAvailability(pool, {
            userId,
            equipmentId: candidate.EquipmentId,
            sessionDate,
            startTime,
            endTime,
            requiredMinutes,
        });

        if (availability.available) {
            return {
                exerciseId: candidate.ExerciseId,
                exerciseName: candidate.ExerciseName,
                exerciseType: candidate.ExerciseType,
                timerMode: candidate.TimerMode,
                equipmentId: candidate.EquipmentId,
                equipmentName: candidate.EquipmentName,
                equipmentCategory: candidate.EquipmentCategory,
                similarityScore: candidate.SimilarityScore,
            };
        }
    }

    return null;
}

async function canReserveOriginalPlanAt(pool, {
    userId,
    items,
    planGoal,
    sessionDate,
    startTime,
}) {
    let currentStartTime = startTime;

    for (const item of items) {
        const timing = resolveItemTiming(planGoal, item);

        const requiredMinutes = Math.max(
            1,
            Math.ceil(timing.calculatedDurationSeconds / 60)
        );

        const plannedStartTime = currentStartTime;
        const plannedEndTime = addSecondsToTime(
            plannedStartTime,
            requiredMinutes * 60
        );

        const availability = await checkEquipmentAvailability(pool, {
            userId,
            equipmentId: item.EquipmentId,
            sessionDate,
            startTime: plannedStartTime,
            endTime: plannedEndTime,
            requiredMinutes,
        });

        if (!availability.available) {
            return {
                available: false,
                endTime: plannedEndTime,
            };
        }

        currentStartTime = plannedEndTime;
    }

    return {
        available: true,
        endTime: currentStartTime,
    };
}

async function findNextAvailableOriginalPlanTerms(pool, {
    userId,
    items,
    planGoal,
    sessionDate,
    startTime,
}) {
    const suggestions = [];
    let candidateStartTime = startTime;

    /*
      Sprawdzamy kolejne terminy co 15 minut.
      Limit 56 oznacza maksymalnie 14 godzin sprawdzania,
      czyli zakres jednej doby treningowej.
    */
    for (let i = 0; i < 56 && suggestions.length < 3; i += 1) {
        candidateStartTime = addSecondsToTime(candidateStartTime, 15 * 60);

        if (timeToSeconds(candidateStartTime) >= timeToSeconds('22:00:00')) {
            break;
        }

        const result = await canReserveOriginalPlanAt(pool, {
            userId,
            items,
            planGoal,
            sessionDate,
            startTime: candidateStartTime,
        });

        if (result.available) {
            suggestions.push({
                sessionDate,
                startTime: candidateStartTime,
                endTime: result.endTime,
            });
        }
    }

    return suggestions;
}

async function previewWorkoutSession(userId, data) {
    const workoutPlanId = Number(data.workoutPlanId);
    const sessionDate = data.sessionDate;
    const startTime = normalizePreviewTime(data.startTime);

    if (!workoutPlanId) {
        throw new HttpError(400, 'workoutPlanId is required');
    }

    if (!sessionDate) {
        throw new HttpError(400, 'sessionDate is required');
    }

    if (!startTime) {
        throw new HttpError(400, 'startTime must be in HH:mm or HH:mm:ss format');
    }

    const pool = await getPool();

    const planResult = await pool.request()
        .input('UserId', sql.Int, userId)
        .input('WorkoutPlanId', sql.Int, workoutPlanId)
        .query(`
            SELECT
                WorkoutPlanId,
                UserId,
                Name,
                Goal,
                DifficultyLevel
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
                wpi.SeriesDurationSeconds
            FROM dbo.WorkoutPlanItems wpi
            JOIN dbo.Equipment e ON e.EquipmentId = wpi.EquipmentId
            WHERE wpi.WorkoutPlanId = @WorkoutPlanId
              AND wpi.IsActive = 1
            ORDER BY wpi.OrderNumber
        `);

    const items = itemsResult.recordset;

    if (items.length === 0) {
        throw new HttpError(400, 'Workout plan has no exercises');
    }

    let currentStartTime = startTime;
    const previewItems = [];

    for (const item of items) {
        const timing = resolveItemTiming(plan.Goal, item);

        const requiredMinutes = Math.max(
            1,
            Math.ceil(timing.calculatedDurationSeconds / 60)
        );

        const plannedStartTime = currentStartTime;
        const plannedEndTime = addSecondsToTime(
            plannedStartTime,
            requiredMinutes * 60
        );

        const availability = await checkEquipmentAvailability(pool, {
            userId,
            equipmentId: item.EquipmentId,
            sessionDate,
            startTime: plannedStartTime,
            endTime: plannedEndTime,
            requiredMinutes,
        });

        let suggestedReplacement = null;

        if (!availability.available) {
            suggestedReplacement = await findAvailableAlternativeForItem(pool, {
                userId,
                item,
                sessionDate,
                startTime: plannedStartTime,
                endTime: plannedEndTime,
                requiredMinutes,
            });
        }

        previewItems.push({
            workoutPlanItemId: item.WorkoutPlanItemId,
            exerciseId: item.ExerciseId,
            exerciseName: item.ExerciseName,
            equipmentId: item.EquipmentId,
            equipmentName: item.EquipmentName,
            equipmentCategory: item.EquipmentCategory,
            orderNumber: item.OrderNumber,
            plannedStartTime,
            plannedEndTime,
            reservedMinutes: requiredMinutes,
            calculatedDurationSeconds: requiredMinutes * 60,
            available: availability.available,
            unavailableReason: availability.reason,
            equipmentQuantity: availability.quantity,
            activeReservationCount: availability.maxActiveReservationCount,
            suggestedReplacement,
        });

        currentStartTime = plannedEndTime;
    }

    const canReserveOriginalPlan = previewItems.every(item => item.available);
    const hasSuggestedCorrection = previewItems.some(item => item.suggestedReplacement);

    const totalItemsCount = previewItems.length;
    const changedItemsCount = previewItems.filter(item => !item.available).length;
    const changeRatio = totalItemsCount === 0
        ? 0
        : changedItemsCount / totalItemsCount;

    const tooManyChanges = changeRatio > 0.4;

    const suggestedAlternativeStartTimes = tooManyChanges
        ? await findNextAvailableOriginalPlanTerms(pool, {
            userId,
            items,
            planGoal: plan.Goal,
            sessionDate,
            startTime,
        })
        : [];

    return {
        workoutPlanId: plan.WorkoutPlanId,
        workoutPlanName: plan.Name,
        goal: plan.Goal,
        difficultyLevel: plan.DifficultyLevel,
        sessionDate,
        startTime,
        endTime: currentStartTime,
        canReserveOriginalPlan,
        hasSuggestedCorrection,

        totalItemsCount,
        changedItemsCount,
        changeRatio,
        changePercentage: Math.round(changeRatio * 100),
        tooManyChanges,
        suggestedAlternativeStartTimes,

        items: previewItems,
    };
}

async function confirmAdjustedWorkoutSession(userId, data) {
    const workoutPlanId = Number(data.workoutPlanId);
    const sessionDate = data.sessionDate;
    const startTime = normalizePreviewTime(data.startTime);
    const adjustments = Array.isArray(data.adjustments) ? data.adjustments : [];

    if (!workoutPlanId) {
        throw new HttpError(400, 'workoutPlanId is required');
    }

    if (!sessionDate) {
        throw new HttpError(400, 'sessionDate is required');
    }

    if (!startTime) {
        throw new HttpError(400, 'startTime must be in HH:mm or HH:mm:ss format');
    }

    if (adjustments.length === 0) {
        throw new HttpError(400, 'adjustments are required');
    }

    const pool = await getPool();
    const transaction = new sql.Transaction(pool);

    let adjustedWorkoutPlanId = null;

    try {
        await transaction.begin();

        const originalPlanResult = await new sql.Request(transaction)
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
                    EstimatedDurationSeconds
                FROM dbo.WorkoutPlans
                WHERE WorkoutPlanId = @WorkoutPlanId
                  AND UserId = @UserId
                  AND IsActive = 1
                  AND IsTemplate = 0
            `);

        const originalPlan = originalPlanResult.recordset[0];

        if (!originalPlan) {
            throw new HttpError(404, 'Workout plan not found');
        }

        const adjustedPlanResult = await new sql.Request(transaction)
            .input('UserId', sql.Int, userId)
            .input('Name', sql.NVarChar(150), originalPlan.Name)
            .input('Description', sql.NVarChar(sql.MAX), originalPlan.Description || null)
            .input('Goal', sql.NVarChar(50), originalPlan.Goal)
            .input('DifficultyLevel', sql.NVarChar(50), originalPlan.DifficultyLevel)
            .input(
                'EstimatedDurationSeconds',
                sql.Int,
                Math.max(Number(originalPlan.EstimatedDurationSeconds || 1), 1)
            )
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
                    OUTPUT INSERTED.WorkoutPlanId
                VALUES (
                    @UserId,
                    @Name,
                    @Description,
                    @Goal,
                    @DifficultyLevel,
                    @EstimatedDurationSeconds,
                    0,
                    1,
                    1
                    )
            `);

        adjustedWorkoutPlanId = adjustedPlanResult.recordset[0].WorkoutPlanId;

        const originalItemsResult = await new sql.Request(transaction)
            .input('WorkoutPlanId', sql.Int, workoutPlanId)
            .query(`
                SELECT
                    WorkoutPlanItemId,
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
                    SeriesDurationSeconds
                FROM dbo.WorkoutPlanItems
                WHERE WorkoutPlanId = @WorkoutPlanId
                  AND IsActive = 1
                ORDER BY OrderNumber
            `);

        const adjustmentByItemId = new Map();

        for (const adjustment of adjustments) {
            adjustmentByItemId.set(Number(adjustment.workoutPlanItemId), {
                exerciseId: Number(adjustment.exerciseId),
                equipmentId: Number(adjustment.equipmentId),
            });
        }

        for (const originalItem of originalItemsResult.recordset) {
            const adjustment = adjustmentByItemId.get(Number(originalItem.WorkoutPlanItemId));

            let newExerciseId = originalItem.ExerciseId;
            let newEquipmentId = originalItem.EquipmentId;
            let newExerciseName = originalItem.ExerciseName;
            let newExerciseType = originalItem.ExerciseType;
            let newTimerMode = originalItem.TimerMode;
            let newNotes = originalItem.Notes;

            if (adjustment) {
                if (!adjustment.exerciseId || !adjustment.equipmentId) {
                    throw new HttpError(400, 'Invalid adjustment data');
                }

                const replacementResult = await new sql.Request(transaction)
                    .input('ExerciseId', sql.Int, adjustment.exerciseId)
                    .input('EquipmentId', sql.Int, adjustment.equipmentId)
                    .query(`
                        SELECT
                            ex.ExerciseId,
                            ex.Name AS ExerciseName,
                            ex.ExerciseType,
                            ex.TimerMode,
                            e.EquipmentId,
                            e.Name AS EquipmentName
                        FROM dbo.Exercises ex
                        JOIN dbo.EquipmentExercises ee
                            ON ee.ExerciseId = ex.ExerciseId
                        JOIN dbo.Equipment e
                            ON e.EquipmentId = ee.EquipmentId
                        WHERE ex.ExerciseId = @ExerciseId
                          AND ee.EquipmentId = @EquipmentId
                          AND ex.IsActive = 1
                          AND e.IsActive = 1
                    `);

                const replacement = replacementResult.recordset[0];

                if (!replacement) {
                    throw new HttpError(
                        400,
                        'Selected replacement exercise is not available for selected equipment'
                    );
                }

                newExerciseId = replacement.ExerciseId;
                newEquipmentId = replacement.EquipmentId;
                newExerciseName = replacement.ExerciseName;
                newExerciseType = replacement.ExerciseType;
                newTimerMode = replacement.TimerMode;
                newNotes = `${originalItem.Notes || ''} Zamiennik systemowy za: ${originalItem.ExerciseName}.`.trim();
            }

            await new sql.Request(transaction)
                .input('WorkoutPlanId', sql.Int, adjustedWorkoutPlanId)
                .input('ExerciseId', sql.Int, newExerciseId)
                .input('EquipmentId', sql.Int, newEquipmentId)
                .input('ExerciseName', sql.NVarChar(150), newExerciseName)
                .input('OrderNumber', sql.Int, originalItem.OrderNumber)
                .input('Sets', sql.Int, originalItem.Sets)
                .input('Repetitions', sql.Int, originalItem.Repetitions)
                .input('DurationSeconds', sql.Int, originalItem.DurationSeconds)
                .input('RestSeconds', sql.Int, originalItem.RestSeconds)
                .input('ExerciseType', sql.NVarChar(50), newExerciseType)
                .input('TimerMode', sql.NVarChar(50), newTimerMode)
                .input('AutoAdvance', sql.Bit, originalItem.AutoAdvance)
                .input('WeightKg', sql.Decimal(6, 2), originalItem.WeightKg)
                .input('DistanceMeters', sql.Decimal(10, 2), originalItem.DistanceMeters)
                .input('Rpe', sql.Decimal(3, 1), originalItem.Rpe)
                .input('Notes', sql.NVarChar(sql.MAX), newNotes)
                .input('SeriesDurationSeconds', sql.Int, originalItem.SeriesDurationSeconds)
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
        }

        await transaction.commit();

        const workoutSession = await createWorkoutSession(userId, {
            workoutPlanId: adjustedWorkoutPlanId,
            sessionDate,
            startTime,
        });

        return {
            adjustedWorkoutPlanId,
            workoutSession,
        };
    } catch (error) {
        try {
            await transaction.rollback();
        } catch (_) {
            // ignore rollback error
        }

        if (adjustedWorkoutPlanId) {
            try {
                await pool.request()
                    .input('WorkoutPlanId', sql.Int, adjustedWorkoutPlanId)
                    .input('UserId', sql.Int, userId)
                    .query(`
                        UPDATE dbo.WorkoutPlans
                        SET IsActive = 0,
                            UpdatedAt = SYSUTCDATETIME()
                        WHERE WorkoutPlanId = @WorkoutPlanId
                          AND UserId = @UserId
                    `);
            } catch (_) {
                // ignore cleanup error
            }
        }

        throw error;
    }
}

async function cancelWorkoutSession(userId, workoutSessionId) {
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);

        const sessionResult = await new sql.Request(transaction)
            .input('UserId', sql.Int, userId)
            .input('WorkoutSessionId', sql.Int, workoutSessionId)
            .query(`
                SELECT
                    WorkoutSessionId,
                    UserId,
                    Status
                FROM dbo.WorkoutSessions
                WHERE WorkoutSessionId = @WorkoutSessionId
                  AND UserId = @UserId
            `);

        const session = sessionResult.recordset[0];

        if (!session) {
            throw new HttpError(404, 'Workout session not found');
        }

        if (session.Status === 'cancelled') {
            throw new HttpError(409, 'Workout session is already cancelled');
        }

        if (session.Status !== 'scheduled') {
            throw new HttpError(409, 'Only scheduled workout sessions can be cancelled');
        }

        await new sql.Request(transaction)
            .input('WorkoutSessionId', sql.Int, workoutSessionId)
            .input('UserId', sql.Int, userId)
            .query(`
                UPDATE dbo.WorkoutSessions
                SET Status = 'cancelled'
                WHERE WorkoutSessionId = @WorkoutSessionId
                  AND UserId = @UserId
            `);

        await new sql.Request(transaction)
            .input('WorkoutSessionId', sql.Int, workoutSessionId)
            .input('UserId', sql.Int, userId)
            .query(`
                UPDATE dbo.Reservations
                SET Status = 'cancelled',
                    CancelledAt = SYSUTCDATETIME()
                WHERE WorkoutSessionId = @WorkoutSessionId
                  AND UserId = @UserId
                  AND Status = 'active'
            `);

        await transaction.commit();

        return {
            message: 'Workout session cancelled',
            workoutSessionId,
        };
    } catch (error) {
        try {
            await transaction.rollback();
        } catch (_) {
            // ignore rollback error
        }

        throw error;
    }
}

async function validateSessionDateTimeAgainstDatabase(pool, sessionDate, startTime) {
    const result = await pool.request()
        .input('SessionDate', sql.Date, sessionDate)
        .input('StartTime', sql.VarChar(8), startTime)
        .query(`
            SELECT
                CASE
                    WHEN
                        DATETIME2FROMPARTS(
                            YEAR(@SessionDate),
                            MONTH(@SessionDate),
                            DAY(@SessionDate),
                            DATEPART(HOUR, CONVERT(time, @StartTime)),
                            DATEPART(MINUTE, CONVERT(time, @StartTime)),
                            0,
                            0,
                            0
                        ) <= SYSDATETIME()
                    THEN 1
                    ELSE 0
                END AS IsPast
        `);

    const isPast = result.recordset[0]?.IsPast === 1;

    if (isPast) {
        throw new HttpError(400, 'Reservation time has already passed');
    }
}

module.exports = {
    listWorkoutSessions,
    getWorkoutSessionById,
    createWorkoutSession,
    previewWorkoutSession,
    confirmAdjustedWorkoutSession,
    cancelWorkoutSession,
};