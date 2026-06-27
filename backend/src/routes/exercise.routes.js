const express = require('express');
const exerciseController = require('../controllers/exercise.controller');
const { authenticate } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/asyncHandler');

const router = express.Router();

router.get(
    '/',
    authenticate,
    asyncHandler(exerciseController.listExercises)
);

router.get(
    '/by-equipment/:equipmentId',
    authenticate,
    asyncHandler(exerciseController.listExercisesByEquipment)
);

router.get(
    '/:id',
    authenticate,
    asyncHandler(exerciseController.getExerciseById)
);

module.exports = router;