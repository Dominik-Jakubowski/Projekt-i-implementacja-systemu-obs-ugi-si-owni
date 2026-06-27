const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sql, getPool } = require('../db/pool');
const { HttpError } = require('../utils/httpError');
const { isUniqueConstraintError } = require('../utils/sqlErrors');

const DEFAULT_ROLE = 'user';

async function register({ email, password, fullName }) {
  if (!email || !password || !fullName) {
    throw new HttpError(400, 'email, password and fullName are required');
  }

  const pool = await getPool();
  const passwordHash = await bcrypt.hash(password, 12);

  let result;

  try {
    result = await pool.request()
        .input('Email', sql.NVarChar(255), email)
        .input('PasswordHash', sql.NVarChar(255), passwordHash)
        .input('FullName', sql.NVarChar(255), fullName)
        .input('RoleName', sql.NVarChar(50), DEFAULT_ROLE)
        .query(`
          INSERT INTO Users (
            Email,
            PasswordHash,
            FullName,
            RoleId,
            MustChangePassword
          )
            OUTPUT INSERTED.UserId, INSERTED.Email, INSERTED.FullName
          SELECT
            @Email,
            @PasswordHash,
            @FullName,
            RoleId,
            0
          FROM Roles
          WHERE Name = @RoleName
        `);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new HttpError(409, 'Email is already registered');
    }

    throw error;
  }

  if (result.recordset.length === 0) {
    throw new HttpError(500, 'Default user role is not configured');
  }

  return result.recordset[0];
}

async function login({ email, password }) {
  if (!email || !password) {
    throw new HttpError(400, 'email and password are required');
  }

  const pool = await getPool();
  const result = await pool.request()
      .input('Email', sql.NVarChar(255), email)
      .query(`
        SELECT
          u.UserId,
          u.Email,
          u.PasswordHash,
          u.FullName,
          u.MustChangePassword,
          r.Name AS RoleName
        FROM Users u
               JOIN Roles r ON r.RoleId = u.RoleId
        WHERE u.Email = @Email
          AND u.IsActive = 1
      `);

  const user = result.recordset[0];

  if (!user || !(await bcrypt.compare(password, user.PasswordHash))) {
    throw new HttpError(401, 'Invalid credentials');
  }

  const token = jwt.sign(
      {
        userId: user.UserId,
        email: user.Email,
        roleName: user.RoleName,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );

  return {
    token,
    mustChangePassword: Boolean(user.MustChangePassword),
    user: {
      id: user.UserId,
      email: user.Email,
      fullName: user.FullName,
      roleName: user.RoleName,
    },
  };
}

async function changeInitialPassword(userId, { newPassword }) {
  if (!newPassword || newPassword.length < 8) {
    throw new HttpError(400, 'Password must have at least 8 characters');
  }

  const pool = await getPool();

  const result = await pool.request()
      .input('UserId', sql.Int, userId)
      .query(`
      SELECT
        UserId,
        MustChangePassword
      FROM Users
      WHERE UserId = @UserId
        AND IsActive = 1
    `);

  const user = result.recordset[0];

  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  if (!user.MustChangePassword) {
    throw new HttpError(409, 'Password change is not required');
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await pool.request()
      .input('UserId', sql.Int, userId)
      .input('PasswordHash', sql.NVarChar(255), passwordHash)
      .query(`
      UPDATE Users
      SET PasswordHash = @PasswordHash,
          MustChangePassword = 0
      WHERE UserId = @UserId
    `);

  return {
    message: 'Password changed successfully',
  };
}

module.exports = {
  register,
  login,
  changeInitialPassword,
};