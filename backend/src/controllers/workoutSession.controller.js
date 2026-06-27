const workoutSessionService = require('../services/workoutSession.service');
const { HttpError } = require('../utils/httpError');

function getAuthenticatedUserId(req) {
    const userId = Number(
        req.user?.UserId ||
        req.user?.userId ||
        req.user?.id ||
        req.user?.sub
    );

    if (!userId) {
        throw new HttpError(401, 'Authenticated user id not found');
    }

    return userId;
}

async function listWorkoutSessions(req, res) {
    const userId = getAuthenticatedUserId(req);
    const workoutSessions = await workoutSessionService.listWorkoutSessions(userId);

    res.json({ workoutSessions });
}

async function getWorkoutSessionById(req, res) {
    const userId = getAuthenticatedUserId(req);
    const workoutSession = await workoutSessionService.getWorkoutSessionById(
        userId,
        Number(req.params.id)
    );

    res.json({ workoutSession });
}

async function createWorkoutSession(req, res) {
    const userId = getAuthenticatedUserId(req);
    const workoutSession = await workoutSessionService.createWorkoutSession(
        userId,
        req.body
    );

    res.status(201).json({ workoutSession });
}

async function previewWorkoutSession(req, res) {
    const preview = await workoutSessionService.previewWorkoutSession(
        req.user.userId,
        req.body
    );

    res.json({ preview });
}

async function confirmAdjustedWorkoutSession(req, res) {
    const result = await workoutSessionService.confirmAdjustedWorkoutSession(
        req.user.userId,
        req.body
    );

    res.status(201).json(result);
}

async function cancelWorkoutSession(req, res) {
    const result = await workoutSessionService.cancelWorkoutSession(
        req.user.userId,
        Number(req.params.id)
    );

    res.json(result);
}

module.exports = {
    listWorkoutSessions,
    getWorkoutSessionById,
    createWorkoutSession,
    previewWorkoutSession,
    confirmAdjustedWorkoutSession,
    cancelWorkoutSession,
};