const equipmentService = require('../services/equipment.service');

async function listEquipment(req, res) {
  res.json({ equipment: await equipmentService.listEquipment() });
}

async function getEquipmentById(req, res) {
  res.json({ equipment: await equipmentService.getEquipmentById(Number(req.params.id)) });
}

async function createEquipment(req, res) {
  const equipment = await equipmentService.createEquipment(req.body);
  res.status(201).json({ equipment });
}

async function updateEquipment(req, res) {
  const equipment = await equipmentService.updateEquipment(Number(req.params.id), req.body);
  res.json({ equipment });
}

async function getEquipmentAlternatives(req, res) {
  const alternatives = await equipmentService.getEquipmentAlternatives(
      Number(req.params.id),
      {
        date: req.query.date,
        timeSlotId: req.query.timeSlotId,
      }
  );

  res.json({ alternatives });
}

module.exports = {
  listEquipment,
  getEquipmentById,
  getEquipmentAlternatives,
  createEquipment,
  updateEquipment,
};
