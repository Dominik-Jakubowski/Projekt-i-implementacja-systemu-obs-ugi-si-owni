const express = require('express');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/asyncHandler');

const router = express.Router();

router.post(
    '/register',
    asyncHandler(authController.register)
);

router.post(
    '/login',
    asyncHandler(authController.login)
);

router.post(
    '/change-initial-password',
    authenticate,
    asyncHandler(authController.changeInitialPassword)
);

module.exports = router;