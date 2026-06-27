const express = require('express');
const workoutSessionController = require('../controllers/workoutSession.controller');
const { asyncHandler } = require('../middleware/asyncHandler');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, asyncHandler(workoutSessionController.listWorkoutSessions));
router.post('/preview', authenticate, asyncHandler(workoutSessionController.previewWorkoutSession));
router.post(
    '/confirm-adjusted',
    authenticate,
    asyncHandler(workoutSessionController.confirmAdjustedWorkoutSession)
);
router.post('/', authenticate, asyncHandler(workoutSessionController.createWorkoutSession));
router.patch(
    '/:id/cancel',
    authenticate,
    asyncHandler(workoutSessionController.cancelWorkoutSession)
);
router.get('/:id', authenticate, asyncHandler(workoutSessionController.getWorkoutSessionById));

module.exports = router;