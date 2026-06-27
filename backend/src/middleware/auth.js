const jwt = require('jsonwebtoken');
const { HttpError } = require('../utils/httpError');

function authenticate(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    throw new HttpError(401, 'Missing bearer token');
  }

  try {
    req.user = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    return next();
  } catch (error) {
    throw new HttpError(401, 'Invalid or expired token');
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.roleName)) {
      throw new HttpError(403, 'Insufficient permissions');
    }

    return next();
  };
}

module.exports = {
  authenticate,
  requireRole,
};
