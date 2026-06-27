const express = require('express');
const reservationController = require('../controllers/reservation.controller');
const { asyncHandler } = require('../middleware/asyncHandler');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/me', authenticate, asyncHandler(reservationController.listOwnReservations));
router.get('/', authenticate, requireRole('admin'), asyncHandler(reservationController.listAllReservations));
router.post('/', authenticate, asyncHandler(reservationController.createReservation));
router.patch('/:id/cancel', authenticate, asyncHandler(reservationController.cancelOwnReservation));

module.exports = router;
