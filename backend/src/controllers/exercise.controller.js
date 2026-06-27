const exerciseService = require('../services/exercise.service');

async function listExercises(req, res) {
    const exercises = await exerciseService.listExercises();
    res.json({ exercises });
}

async function getExerciseById(req, res) {
    const exercise = await exerciseService.getExerciseById(Number(req.params.id));
    res.json({ exercise });
}

async function listExercisesByEquipment(req, res) {
    const exercises = await exerciseService.listExercisesByEquipment(
        Number(req.params.equipmentId)
    );

    res.json({ exercises });
}

module.exports = {
    listExercises,
    getExerciseById,
    listExercisesByEquipment,
};