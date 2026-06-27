const reservationService = require('../services/reservation.service');

async function listOwnReservations(req, res) {
  const reservations = await reservationService.listOwnReservations(req.user.userId);
  res.json({ reservations });
}

async function listAllReservations(req, res) {
  const reservations = await reservationService.listAllReservations();
  res.json({ reservations });
}

async function createReservation(req, res) {
  const reservation = await reservationService.createReservation(req.user.userId, req.body);
  res.status(201).json({ reservation });
}

async function cancelOwnReservation(req, res) {
  const reservation = await reservationService.cancelOwnReservation(
    req.user.userId,
    Number(req.params.id)
  );
  res.json({ reservation });
}

module.exports = {
  listOwnReservations,
  listAllReservations,
  createReservation,
  cancelOwnReservation,
};
