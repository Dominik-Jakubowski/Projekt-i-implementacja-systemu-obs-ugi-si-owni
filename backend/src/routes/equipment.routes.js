const express = require('express');
const equipmentController = require('../controllers/equipment.controller');
const { asyncHandler } = require('../middleware/asyncHandler');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, asyncHandler(equipmentController.listEquipment));
router.get('/:id/alternatives', authenticate, asyncHandler(equipmentController.getEquipmentAlternatives));
router.get('/:id', authenticate, asyncHandler(equipmentController.getEquipmentById));
router.post('/', authenticate, requireRole('admin'), asyncHandler(equipmentController.createEquipment));
router.patch('/:id', authenticate, requireRole('admin'), asyncHandler(equipmentController.updateEquipment));

module.exports = router;