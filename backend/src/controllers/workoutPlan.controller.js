const workoutPlanService = require('../services/workoutPlan.service');

async function listWorkoutPlans(req, res) {
    const workoutPlans = await workoutPlanService.listWorkoutPlans(req.user.userId);
    res.json({ workoutPlans });
}

async function listWorkoutPlanTemplates(req, res) {
    const workoutPlanTemplates = await workoutPlanService.listWorkoutPlanTemplates();
    res.json({ workoutPlanTemplates });
}

async function getWorkoutPlanById(req, res) {
    const workoutPlan = await workoutPlanService.getWorkoutPlanById(
        req.user.userId,
        Number(req.params.id)
    );

    res.json({ workoutPlan });
}

async function createWorkoutPlan(req, res) {
    const workoutPlan = await workoutPlanService.createWorkoutPlan(
        req.user.userId,
        req.body
    );

    res.status(201).json({ workoutPlan });
}

async function createWorkoutPlanTemplate(req, res) {
    const workoutPlan = await workoutPlanService.createWorkoutPlanTemplate(
        req.user.userId,
        req.body
    );

    res.status(201).json({ workoutPlan });
}

async function addWorkoutPlanItem(req, res) {
    const workoutPlan = await workoutPlanService.addWorkoutPlanItem(
        req.user.userId,
        Number(req.params.id),
        req.body
    );

    res.status(201).json({ workoutPlan });
}

async function copyWorkoutPlanTemplate(req, res) {
    const workoutPlan = await workoutPlanService.copyWorkoutPlanTemplate(
        req.user.userId,
        Number(req.params.id),
        req.body
    );

    res.status(201).json({ workoutPlan });
}
async function deleteWorkoutPlan(req, res) {
    const result = await workoutPlanService.deleteWorkoutPlan(
        req.user.userId,
        Number(req.params.id)
    );

    res.json(result);
}

module.exports = {
    listWorkoutPlans,
    listWorkoutPlanTemplates,
    getWorkoutPlanById,
    createWorkoutPlan,
    createWorkoutPlanTemplate,
    addWorkoutPlanItem,
    copyWorkoutPlanTemplate,
    deleteWorkoutPlan,
};