const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { sql, getPool } = require('../db/pool');
const { HttpError } = require('../utils/HttpError');
const { isUniqueConstraintError } = require('../utils/sqlErrors');

function generateTemporaryPassword() {
    return crypto.randomBytes(6).toString('base64') + 'A1!';
}

async function listUsers() {
    const pool = await getPool();

    const result = await pool.request().query(`
        SELECT
            u.UserId,
            u.Email,
            u.FullName,
            u.IsActive,
            u.MustChangePassword,
            u.CreatedAt,
            r.Name AS RoleName
        FROM dbo.Users u
        JOIN dbo.Roles r
            ON r.RoleId = u.RoleId
        ORDER BY u.CreatedAt DESC
    `);

    return {
        users: result.recordset,
    };
}

async function createUser(data) {
    const {
        email,
        fullName,
        roleName = 'user',
    } = data;

    if (!email || !fullName) {
        throw new HttpError(400, 'Email and full name are required');
    }

    const pool = await getPool();

    const existingUser = await pool.request()
        .input('Email', sql.NVarChar(255), email)
        .query(`
            SELECT UserId
            FROM dbo.Users
            WHERE Email = @Email
        `);

    if (existingUser.recordset.length > 0) {
        throw new HttpError(409, 'User with this email already exists');
    }

    const roleResult = await pool.request()
        .input('RoleName', sql.NVarChar(50), roleName)
        .query(`
            SELECT RoleId, Name
            FROM dbo.Roles
            WHERE Name = @RoleName
        `);

    if (roleResult.recordset.length === 0) {
        throw new HttpError(400, 'Invalid role');
    }

    const role = roleResult.recordset[0];
    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);

    const result = await pool.request()
        .input('RoleId', sql.Int, role.RoleId)
        .input('Email', sql.NVarChar(255), email)
        .input('PasswordHash', sql.NVarChar(255), passwordHash)
        .input('FullName', sql.NVarChar(255), fullName)
        .query(`
            INSERT INTO dbo.Users (
                RoleId,
                Email,
                PasswordHash,
                FullName,
                IsActive,
                MustChangePassword,
                CreatedAt
            )
            OUTPUT
                INSERTED.UserId,
                INSERTED.Email,
                INSERTED.FullName,
                INSERTED.IsActive,
                INSERTED.MustChangePassword,
                INSERTED.CreatedAt
            VALUES (
                @RoleId,
                @Email,
                @PasswordHash,
                @FullName,
                1,
                1,
                SYSUTCDATETIME()
            )
        `);

    return {
        user: {
            ...result.recordset[0],
            RoleName: role.Name,
        },
        temporaryPassword,
    };
}

async function deactivateUser(userId) {
    const pool = await getPool();

    const result = await pool.request()
        .input('UserId', sql.Int, userId)
        .query(`
            UPDATE dbo.Users
            SET IsActive = 0
            OUTPUT
                INSERTED.UserId,
                INSERTED.Email,
                INSERTED.FullName,
                INSERTED.IsActive
            WHERE UserId = @UserId
              AND IsActive = 1
        `);

    if (result.recordset.length === 0) {
        throw new HttpError(404, 'User not found');
    }

    return {
        message: 'User deactivated',
        user: result.recordset[0],
    };
}

function validateMuscleItem(item) {
    const muscleId = Number(item.muscleId);
    const role = item.role || 'primary';
    const activationLevel = Number(item.activationLevel ?? 3);

    if (!Number.isInteger(muscleId) || muscleId < 1) {
        throw new HttpError(400, 'muscleId must be a positive integer');
    }

    if (!['primary', 'secondary', 'stabilizer'].includes(role)) {
        throw new HttpError(400, 'muscle role must be primary, secondary or stabilizer');
    }

    if (!Number.isInteger(activationLevel) || activationLevel < 1 || activationLevel > 5) {
        throw new HttpError(400, 'activationLevel must be between 1 and 5');
    }

    return {
        muscleId,
        role,
        activationLevel,
        notes: item.notes || null,
    };
}

function validateExerciseItem(item, fallbackMuscles) {
    if (!item.name) {
        throw new HttpError(400, 'exercise name is required');
    }

    const exerciseType = item.exerciseType || 'strength';
    const timerMode = item.timerMode || 'sets_reps';
    const difficultyLevel = item.difficultyLevel || 'beginner';

    if (!['strength', 'cardio', 'warmup', 'cooldown', 'stretching', 'mobility'].includes(exerciseType)) {
        throw new HttpError(400, 'invalid exerciseType');
    }

    if (!['sets_reps', 'duration', 'manual'].includes(timerMode)) {
        throw new HttpError(400, 'invalid timerMode');
    }

    if (!['beginner', 'intermediate', 'advanced'].includes(difficultyLevel)) {
        throw new HttpError(400, 'invalid difficultyLevel');
    }

    const musclesSource = Array.isArray(item.muscles) && item.muscles.length > 0
        ? item.muscles
        : fallbackMuscles;

    const muscles = musclesSource.map(validateMuscleItem);

    return {
        name: item.name,
        description: item.description || null,
        exerciseType,
        timerMode,
        defaultSets: item.defaultSets == null ? 3 : Number(item.defaultSets),
        defaultRepetitions: item.defaultRepetitions == null ? 12 : Number(item.defaultRepetitions),
        defaultDurationSeconds: item.defaultDurationSeconds == null
            ? null
            : Number(item.defaultDurationSeconds),
        defaultRestSeconds: item.defaultRestSeconds == null ? 60 : Number(item.defaultRestSeconds),
        defaultSeriesDurationSeconds: item.defaultSeriesDurationSeconds == null
            ? 45
            : Number(item.defaultSeriesDurationSeconds),
        difficultyLevel,
        muscles,
    };
}

async function listMuscles() {
    const pool = await getPool();

    const result = await pool.request().query(`
    SELECT
      MuscleId,
      Name,
      MuscleGroup,
      LatinName,
      BodyPart,
      IsActive
    FROM dbo.Muscles
    WHERE IsActive = 1
    ORDER BY MuscleGroup, Name
  `);

    return result.recordset;
}

async function createFullEquipment(data) {
    const {
        name,
        description,
        quantity,
        category,
        muscles,
        exercises,
    } = data;

    if (!name || !String(name).trim()) {
        throw new HttpError(400, 'equipment name is required');
    }

    const parsedQuantity = Number(quantity);

    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1) {
        throw new HttpError(400, 'quantity must be a positive integer');
    }

    if (!Array.isArray(muscles) || muscles.length === 0) {
        throw new HttpError(400, 'at least one equipment muscle is required');
    }

    if (!Array.isArray(exercises) || exercises.length === 0) {
        throw new HttpError(400, 'at least one exercise is required');
    }

    const parsedMuscles = muscles.map(validateMuscleItem);
    const parsedExercises = exercises.map((exercise) =>
        validateExerciseItem(exercise, parsedMuscles)
    );

    const pool = await getPool();
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        const duplicateEquipmentResult = await transaction.request()
            .input('Name', sql.NVarChar(150), name)
            .query(`
          SELECT EquipmentId
          FROM dbo.Equipment
          WHERE Name = @Name
        `);

        if (duplicateEquipmentResult.recordset.length > 0) {
            throw new HttpError(409, 'Equipment with this name already exists');
        }

        for (const exercise of parsedExercises) {
            const duplicateExerciseResult = await transaction.request()
                .input('Name', sql.NVarChar(150), exercise.name)
                .query(`
            SELECT ExerciseId
            FROM dbo.Exercises
            WHERE Name = @Name
          `);

            if (duplicateExerciseResult.recordset.length > 0) {
                throw new HttpError(409, `Exercise with name "${exercise.name}" already exists`);
            }
        }

        const equipmentResult = await transaction.request()
            .input('Name', sql.NVarChar(150), name)
            .input('Description', sql.NVarChar(sql.MAX), description || null)
            .input('Quantity', sql.Int, parsedQuantity)
            .input('Category', sql.NVarChar(50), category || 'strength')
            .query(`
          INSERT INTO dbo.Equipment (
            Name,
            Description,
            Quantity,
            Category,
            IsActive,
            CreatedAt
          )
          OUTPUT
            INSERTED.EquipmentId,
            INSERTED.Name,
            INSERTED.Description,
            INSERTED.Quantity,
            INSERTED.Category,
            INSERTED.IsActive
          VALUES (
            @Name,
            @Description,
            @Quantity,
            @Category,
            1,
            SYSUTCDATETIME()
          )
        `);

        const equipment = equipmentResult.recordset[0];

        for (const muscle of parsedMuscles) {
            await transaction.request()
                .input('EquipmentId', sql.Int, equipment.EquipmentId)
                .input('MuscleId', sql.Int, muscle.muscleId)
                .input('Role', sql.NVarChar(30), muscle.role)
                .input('ActivationLevel', sql.TinyInt, muscle.activationLevel)
                .input('Notes', sql.NVarChar(sql.MAX), muscle.notes)
                .query(`
            INSERT INTO dbo.EquipmentMuscles (
              EquipmentId,
              MuscleId,
              Role,
              ActivationLevel,
              Notes,
              SourceName,
              SourceUrl,
              CreatedAt
            )
            VALUES (
              @EquipmentId,
              @MuscleId,
              @Role,
              @ActivationLevel,
              @Notes,
              'admin-panel',
              NULL,
              SYSUTCDATETIME()
            )
          `);
        }

        const createdExercises = [];

        for (const exercise of parsedExercises) {
            const exerciseResult = await transaction.request()
                .input('Name', sql.NVarChar(150), exercise.name)
                .input('Description', sql.NVarChar(sql.MAX), exercise.description)
                .input('ExerciseType', sql.NVarChar(50), exercise.exerciseType)
                .input('TimerMode', sql.NVarChar(50), exercise.timerMode)
                .input('DefaultSets', sql.Int, exercise.defaultSets)
                .input('DefaultRepetitions', sql.Int, exercise.defaultRepetitions)
                .input('DefaultDurationSeconds', sql.Int, exercise.defaultDurationSeconds)
                .input('DefaultRestSeconds', sql.Int, exercise.defaultRestSeconds)
                .input('DefaultSeriesDurationSeconds', sql.Int, exercise.defaultSeriesDurationSeconds)
                .input('DifficultyLevel', sql.NVarChar(50), exercise.difficultyLevel)
                .query(`
            INSERT INTO dbo.Exercises (
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
              CreatedAt
            )
            OUTPUT
              INSERTED.ExerciseId,
              INSERTED.Name,
              INSERTED.ExerciseType,
              INSERTED.TimerMode,
              INSERTED.DifficultyLevel
            VALUES (
              @Name,
              @Description,
              @ExerciseType,
              @TimerMode,
              @DefaultSets,
              @DefaultRepetitions,
              @DefaultDurationSeconds,
              @DefaultRestSeconds,
              @DefaultSeriesDurationSeconds,
              @DifficultyLevel,
              1,
              SYSUTCDATETIME()
            )
          `);

            const createdExercise = exerciseResult.recordset[0];
            createdExercises.push(createdExercise);

            await transaction.request()
                .input('EquipmentId', sql.Int, equipment.EquipmentId)
                .input('ExerciseId', sql.Int, createdExercise.ExerciseId)
                .query(`
            INSERT INTO dbo.EquipmentExercises (
              EquipmentId,
              ExerciseId,
              IsDefault,
              Notes,
              CreatedAt
            )
            VALUES (
              @EquipmentId,
              @ExerciseId,
              1,
              'Ćwiczenie dodane razem z urządzeniem przez panel administratora',
              SYSUTCDATETIME()
            )
          `);

            for (const muscle of exercise.muscles) {
                await transaction.request()
                    .input('ExerciseId', sql.Int, createdExercise.ExerciseId)
                    .input('MuscleId', sql.Int, muscle.muscleId)
                    .input('Role', sql.NVarChar(50), muscle.role)
                    .input('ActivationLevel', sql.TinyInt, muscle.activationLevel)
                    .input('Notes', sql.NVarChar(sql.MAX), muscle.notes)
                    .query(`
              INSERT INTO dbo.ExerciseMuscles (
                ExerciseId,
                MuscleId,
                Role,
                ActivationLevel,
                Notes,
                SourceName,
                SourceUrl,
                CreatedAt
              )
              VALUES (
                @ExerciseId,
                @MuscleId,
                @Role,
                @ActivationLevel,
                @Notes,
                'admin-panel',
                NULL,
                SYSUTCDATETIME()
              )
            `);
            }
        }

        await transaction.commit();

        return {
            equipment,
            exercises: createdExercises,
        };
    } catch (error) {
        try {
            await transaction.rollback();
        } catch {
            // transakcja mogła zostać już przerwana
        }

        if (error instanceof HttpError) {
            throw error;
        }

        if (isUniqueConstraintError(error)) {
            throw new HttpError(409, 'Equipment or exercise with this name already exists');
        }

        throw error;
    }
}

module.exports = {
    listUsers,
    createUser,
    deactivateUser,
    listMuscles,
    createFullEquipment,
};