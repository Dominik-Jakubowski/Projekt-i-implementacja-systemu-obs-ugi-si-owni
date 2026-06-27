require('dotenv').config();

const bcrypt = require('bcryptjs');
const request = require('supertest');
const mssql = require('mssql');

const app = require('../src/app');
const { sql, getPool } = require('../src/db/pool');

jest.setTimeout(60000);

const runId = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
const password = 'TestPass123!';

let pool;
let adminToken;
let userToken;
let mustChangeToken;
let adminUser;
let normalUser;
let mustChangeUser;
let muscleId;
let simpleEquipmentId;
let fullEquipment;
let fullExercise;
let workoutPlanId;
let reservationDate;

function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

function tomorrowDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

async function ensureRole(roleName) {
  const result = await pool.request()
    .input('Name', sql.NVarChar(50), roleName)
    .query('SELECT RoleId FROM dbo.Roles WHERE Name = @Name');

  if (result.recordset[0]) {
    return result.recordset[0].RoleId;
  }

  const insertResult = await pool.request()
    .input('Name', sql.NVarChar(50), roleName)
    .query(`
      INSERT INTO dbo.Roles (Name)
      OUTPUT INSERTED.RoleId
      VALUES (@Name)
    `);

  return insertResult.recordset[0].RoleId;
}

async function createDbUser({ roleName, email, fullName, mustChangePassword }) {
  const roleId = await ensureRole(roleName);
  const passwordHash = await bcrypt.hash(password, 10);

  const result = await pool.request()
    .input('RoleId', sql.Int, roleId)
    .input('Email', sql.NVarChar(255), email)
    .input('PasswordHash', sql.NVarChar(255), passwordHash)
    .input('FullName', sql.NVarChar(255), fullName)
    .input('MustChangePassword', sql.Bit, mustChangePassword)
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
      OUTPUT INSERTED.UserId, INSERTED.Email, INSERTED.FullName
      VALUES (
        @RoleId,
        @Email,
        @PasswordHash,
        @FullName,
        1,
        @MustChangePassword,
        SYSUTCDATETIME()
      )
    `);

  return result.recordset[0];
}

async function login(email, loginPassword = password) {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email, password: loginPassword });

  expect(response.status).toBe(200);
  expect(response.body.token).toEqual(expect.any(String));

  return response.body;
}

async function ensureTestMuscle() {
  const existing = await pool.request().query(`
    SELECT TOP 1 MuscleId
    FROM dbo.Muscles
    WHERE IsActive = 1
    ORDER BY MuscleId
  `);

  if (existing.recordset[0]) {
    return existing.recordset[0].MuscleId;
  }

  const result = await pool.request()
    .input('Name', sql.NVarChar(100), `Test muscle ${runId}`)
    .input('MuscleGroup', sql.NVarChar(100), 'Test')
    .query(`
      INSERT INTO dbo.Muscles (
        Name,
        MuscleGroup,
        IsActive,
        CreatedAt
      )
      OUTPUT INSERTED.MuscleId
      VALUES (
        @Name,
        @MuscleGroup,
        1,
        SYSUTCDATETIME()
      )
    `);

  return result.recordset[0].MuscleId;
}

async function ensureMinuteSlot(startTime, endTime) {
  const existing = await pool.request()
    .input('StartTime', sql.VarChar(8), startTime)
    .input('EndTime', sql.VarChar(8), endTime)
    .query(`
      SELECT TimeSlotId
      FROM dbo.TimeSlots
      WHERE StartTime = CAST(@StartTime AS time)
        AND EndTime = CAST(@EndTime AS time)
    `);

  if (existing.recordset[0]) {
    return existing.recordset[0].TimeSlotId;
  }

  const result = await pool.request()
    .input('StartTime', sql.VarChar(8), startTime)
    .input('EndTime', sql.VarChar(8), endTime)
    .query(`
      INSERT INTO dbo.TimeSlots (StartTime, EndTime, IsActive)
      OUTPUT INSERTED.TimeSlotId
      VALUES (CAST(@StartTime AS time), CAST(@EndTime AS time), 1)
    `);

  return result.recordset[0].TimeSlotId;
}

function fullEquipmentPayload(namePrefix = 'Full equipment') {
  return {
    name: `${namePrefix} ${runId}`,
    description: 'Equipment created by automated integration tests',
    quantity: 1,
    category: 'strength',
    muscles: [
      {
        muscleId,
        role: 'primary',
        activationLevel: 5,
        notes: 'Test muscle relation',
      },
    ],
    exercises: [
      {
        name: `${namePrefix} exercise ${runId}`,
        description: 'Exercise created by automated integration tests',
        exerciseType: 'strength',
        timerMode: 'sets_reps',
        defaultSets: 1,
        defaultRepetitions: 1,
        defaultDurationSeconds: null,
        defaultRestSeconds: 0,
        defaultSeriesDurationSeconds: 1,
        difficultyLevel: 'beginner',
        muscles: [
          {
            muscleId,
            role: 'primary',
            activationLevel: 5,
          },
        ],
      },
    ],
  };
}

async function createFullEquipmentFixture(namePrefix = 'Fixture equipment') {
  const response = await request(app)
    .post('/api/admin/equipment/full')
    .set(auth(adminToken))
    .send(fullEquipmentPayload(namePrefix));

  expect(response.status).toBe(201);
  expect(response.body.equipment.EquipmentId).toEqual(expect.any(Number));
  expect(response.body.exercises[0].ExerciseId).toEqual(expect.any(Number));

  return response.body;
}

beforeAll(async () => {
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'test-secret';
  }

  pool = await getPool();
  reservationDate = tomorrowDate();

  await ensureRole('user');
  await ensureRole('admin');
  muscleId = await ensureTestMuscle();
  await ensureMinuteSlot('08:00:00', '08:01:00');

  adminUser = await createDbUser({
    roleName: 'admin',
    email: `admin.${runId}@test.local`,
    fullName: 'Integration Admin',
    mustChangePassword: false,
  });

  normalUser = await createDbUser({
    roleName: 'user',
    email: `user.${runId}@test.local`,
    fullName: 'Integration User',
    mustChangePassword: false,
  });

  mustChangeUser = await createDbUser({
    roleName: 'user',
    email: `must-change.${runId}@test.local`,
    fullName: 'Must Change User',
    mustChangePassword: true,
  });

  adminToken = (await login(adminUser.Email)).token;
  userToken = (await login(normalUser.Email)).token;
  mustChangeToken = (await login(mustChangeUser.Email)).token;
});

afterAll(async () => {
  await mssql.close();
});

describe('Auth API', () => {
  test('POST /api/auth/login returns token and mustChangePassword for valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: normalUser.Email, password });

    expect(response.status).toBe(200);
    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.mustChangePassword).toBe(false);
    expect(response.body.user.roleName).toBe('user');
  });

  test('POST /api/auth/login returns 401 for invalid password', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: normalUser.Email, password: 'wrong-password' });

    expect(response.status).toBe(401);
  });

  test('POST /api/auth/change-initial-password requires authentication and MustChangePassword = 1', async () => {
    const withoutToken = await request(app)
      .post('/api/auth/change-initial-password')
      .send({ newPassword: 'Changed123!' });

    expect(withoutToken.status).toBe(401);

    const notRequired = await request(app)
      .post('/api/auth/change-initial-password')
      .set(auth(userToken))
      .send({ newPassword: 'Changed123!' });

    expect(notRequired.status).toBe(409);

    const changed = await request(app)
      .post('/api/auth/change-initial-password')
      .set(auth(mustChangeToken))
      .send({ newPassword: 'Changed123!' });

    expect(changed.status).toBe(200);
    expect(changed.body.message).toBe('Password changed successfully');
  });
});

describe('Admin users API', () => {
  test('admin endpoints require JWT and reject regular users', async () => {
    const withoutToken = await request(app).get('/api/admin/users');
    expect(withoutToken.status).toBe(401);

    const regularUser = await request(app)
      .get('/api/admin/users')
      .set(auth(userToken));

    expect(regularUser.status).toBe(403);
  });

  test('admin can list, create and deactivate users', async () => {
    const list = await request(app)
      .get('/api/admin/users')
      .set(auth(adminToken));

    expect(list.status).toBe(200);
    expect(Array.isArray(list.body.users)).toBe(true);

    const create = await request(app)
      .post('/api/admin/users')
      .set(auth(adminToken))
      .send({
        email: `created-by-admin.${runId}@test.local`,
        fullName: 'Created By Admin',
        roleName: 'user',
      });

    expect(create.status).toBe(201);
    expect(create.body.user.Email).toBe(`created-by-admin.${runId}@test.local`);
    expect(create.body.user.MustChangePassword).toBe(true);
    expect(create.body.temporaryPassword).toEqual(expect.any(String));

    const deactivate = await request(app)
      .patch(`/api/admin/users/${create.body.user.UserId}/deactivate`)
      .set(auth(adminToken));

    expect(deactivate.status).toBe(200);
    expect(deactivate.body.user.IsActive).toBe(false);
  });
});

describe('Equipment API', () => {
  test('GET /api/equipment returns equipment list', async () => {
    const response = await request(app)
      .get('/api/equipment')
      .set(auth(userToken));

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.equipment)).toBe(true);
  });

  test('admin can update Quantity and IsActive, regular user cannot edit equipment', async () => {
    const create = await request(app)
      .post('/api/equipment')
      .set(auth(adminToken))
      .send({
        name: `Simple equipment ${runId}`,
        description: 'Simple test equipment',
        quantity: 1,
      });

    expect(create.status).toBe(201);
    simpleEquipmentId = create.body.equipment.EquipmentId;

    const regularPatch = await request(app)
      .patch(`/api/equipment/${simpleEquipmentId}`)
      .set(auth(userToken))
      .send({ quantity: 2 });

    expect(regularPatch.status).toBe(403);

    const quantityPatch = await request(app)
      .patch(`/api/equipment/${simpleEquipmentId}`)
      .set(auth(adminToken))
      .send({ quantity: 2 });

    expect(quantityPatch.status).toBe(200);
    expect(quantityPatch.body.equipment.Quantity).toBe(2);

    const activePatch = await request(app)
      .patch(`/api/equipment/${simpleEquipmentId}`)
      .set(auth(adminToken))
      .send({ isActive: false });

    expect(activePatch.status).toBe(200);
    expect(activePatch.body.equipment.IsActive).toBe(false);
  });
});

describe('Admin full equipment API', () => {
  test('GET /api/admin/muscles returns muscles for admin', async () => {
    const response = await request(app)
      .get('/api/admin/muscles')
      .set(auth(adminToken));

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.muscles)).toBe(true);
    expect(response.body.muscles.length).toBeGreaterThan(0);
  });

  test('POST /api/admin/equipment/full validates payload and creates full equipment transactionally', async () => {
    const missingMuscles = await request(app)
      .post('/api/admin/equipment/full')
      .set(auth(adminToken))
      .send({
        ...fullEquipmentPayload('Missing muscles equipment'),
        muscles: [],
      });

    expect(missingMuscles.status).toBe(400);

    const missingExercises = await request(app)
      .post('/api/admin/equipment/full')
      .set(auth(adminToken))
      .send({
        ...fullEquipmentPayload('Missing exercises equipment'),
        exercises: [],
      });

    expect(missingExercises.status).toBe(400);

    const response = await createFullEquipmentFixture('Admin full equipment');
    fullEquipment = response.equipment;
    fullExercise = response.exercises[0];

    expect(fullEquipment.Name).toContain('Admin full equipment');
    expect(fullExercise.Name).toContain('Admin full equipment exercise');
  });

  test('POST /api/admin/equipment/full returns 409 for duplicate equipment name', async () => {
    const duplicateName = `Duplicate equipment ${runId}`;
    const firstPayload = fullEquipmentPayload('Duplicate equipment');
    firstPayload.name = duplicateName;

    const first = await request(app)
      .post('/api/admin/equipment/full')
      .set(auth(adminToken))
      .send(firstPayload);

    expect(first.status).toBe(201);

    const secondPayload = fullEquipmentPayload('Duplicate equipment second');
    secondPayload.name = duplicateName;

    const second = await request(app)
      .post('/api/admin/equipment/full')
      .set(auth(adminToken))
      .send(secondPayload);

    expect(second.status).toBe(409);
  });
});

describe('Workout plans API', () => {
  test('user can create own plan and add exercise item', async () => {
    if (!fullEquipment || !fullExercise) {
      const fixture = await createFullEquipmentFixture('Workout plan equipment');
      fullEquipment = fixture.equipment;
      fullExercise = fixture.exercises[0];
    }

    const createPlan = await request(app)
      .post('/api/workout-plans')
      .set(auth(userToken))
      .send({
        name: `Workout plan ${runId}`,
        description: 'Plan created by integration tests',
        goal: 'endurance',
        difficultyLevel: 'beginner',
      });

    expect(createPlan.status).toBe(201);
    expect(createPlan.body.workoutPlan.IsTemplate).toBe(false);
    expect(createPlan.body.workoutPlan.IsActive).toBe(true);
    expect(createPlan.body.workoutPlan.IsSystemGenerated).toBe(false);
    expect(createPlan.body.workoutPlan.EstimatedDurationSeconds).toBeGreaterThanOrEqual(1);

    workoutPlanId = createPlan.body.workoutPlan.WorkoutPlanId;

    const addItem = await request(app)
      .post(`/api/workout-plans/${workoutPlanId}/items`)
      .set(auth(userToken))
      .send({
        exerciseId: fullExercise.ExerciseId,
        equipmentId: fullEquipment.EquipmentId,
        orderNumber: 1,
      });

    expect(addItem.status).toBe(201);
    expect(addItem.body.workoutPlan.items).toHaveLength(1);
    expect(addItem.body.workoutPlan.items[0].ExerciseId).toBe(fullExercise.ExerciseId);
  });
});

describe('Reservations and workout sessions API', () => {
  test('user can preview and create workout session, conflicting session returns error, admin can list reservations', async () => {
    if (!workoutPlanId) {
      throw new Error('Workout plan fixture was not created');
    }

    const preview = await request(app)
      .post('/api/workout-sessions/preview')
      .set(auth(userToken))
      .send({
        workoutPlanId,
        sessionDate: reservationDate,
        startTime: '08:00',
      });

    expect(preview.status).toBe(200);
    expect(preview.body.preview.canReserveOriginalPlan).toBe(true);

    const createSession = await request(app)
      .post('/api/workout-sessions')
      .set(auth(userToken))
      .send({
        workoutPlanId,
        sessionDate: reservationDate,
        startTime: '08:00',
      });

    expect(createSession.status).toBe(201);
    expect(createSession.body.workoutSession.WorkoutSessionId).toEqual(expect.any(Number));

    const conflict = await request(app)
      .post('/api/workout-sessions')
      .set(auth(userToken))
      .send({
        workoutPlanId,
        sessionDate: reservationDate,
        startTime: '08:00',
      });

    expect([400, 409]).toContain(conflict.status);

    const reservations = await request(app)
      .get('/api/reservations')
      .set(auth(adminToken));

    expect(reservations.status).toBe(200);
    expect(Array.isArray(reservations.body.reservations)).toBe(true);
    expect(reservations.body.reservations.length).toBeGreaterThan(0);
  });
});
