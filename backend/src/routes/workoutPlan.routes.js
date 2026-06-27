const express = require('express');
const workoutPlanController = require('../controllers/workoutPlan.controller');
const { authenticate, requireRole } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/asyncHandler');

const router = express.Router();

// Proponowane plany treningowe od admina
router.get(
    '/templates',
    authenticate,
    asyncHandler(workoutPlanController.listWorkoutPlanTemplates)
);

router.post(
    '/templates',
    authenticate,
    requireRole('admin'),
    asyncHandler(workoutPlanController.createWorkoutPlanTemplate)
);

// Prywatne plany aktualnie zalogowanego użytkownika
router.get(
    '/',
    authenticate,
    asyncHandler(workoutPlanController.listWorkoutPlans)
);

router.post(
    '/',
    authenticate,
    asyncHandler(workoutPlanController.createWorkoutPlan)
);

// Kopiowanie szablonu do prywatnych planów użytkownika
router.post(
    '/:id/copy',
    authenticate,
    asyncHandler(workoutPlanController.copyWorkoutPlanTemplate)
);

// Dodawanie ćwiczenia do prywatnego planu użytkownika
router.post(
    '/:id/items',
    authenticate,
    asyncHandler(workoutPlanController.addWorkoutPlanItem)
);

// Pobieranie konkretnego planu — musi być po /templates
router.get(
    '/:id',
    authenticate,
    asyncHandler(workoutPlanController.getWorkoutPlanById)
);

router.delete('/:id', authenticate, asyncHandler(workoutPlanController.deleteWorkoutPlan));

module.exports = router;