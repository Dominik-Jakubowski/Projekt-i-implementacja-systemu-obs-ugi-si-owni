const timeSlotService = require('../services/timeSlot.service');

async function listTimeSlots(req, res) {
  res.json({ timeSlots: await timeSlotService.listTimeSlots() });
}

async function createTimeSlot(req, res) {
  const timeSlot = await timeSlotService.createTimeSlot(req.body);
  res.status(201).json({ timeSlot });
}

async function updateTimeSlot(req, res) {
  const timeSlot = await timeSlotService.updateTimeSlot(Number(req.params.id), req.body);
  res.json({ timeSlot });
}

module.exports = {
  listTimeSlots,
  createTimeSlot,
  updateTimeSlot,
};
