const express = require('express');
const timeSlotController = require('../controllers/timeSlot.controller');
const { asyncHandler } = require('../middleware/asyncHandler');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, asyncHandler(timeSlotController.listTimeSlots));
router.post('/', authenticate, requireRole('admin'), asyncHandler(timeSlotController.createTimeSlot));
router.patch('/:id', authenticate, requireRole('admin'), asyncHandler(timeSlotController.updateTimeSlot));

module.exports = router;
