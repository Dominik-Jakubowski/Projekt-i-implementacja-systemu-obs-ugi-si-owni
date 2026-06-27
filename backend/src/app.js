const adminRoutes = require('./routes/admin.routes');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./routes/auth.routes');
const equipmentRoutes = require('./routes/equipment.routes');
const timeSlotRoutes = require('./routes/timeSlot.routes');
const reservationRoutes = require('./routes/reservation.routes');
const workoutPlanRoutes = require('./routes/workoutPlan.routes');
const workoutSessionRoutes = require('./routes/workoutSession.routes');
const exerciseRoutes = require('./routes/exercise.routes');
const { errorHandler } = require('./middleware/errorHandler');
const { notFoundHandler } = require('./middleware/notFoundHandler');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/time-slots', timeSlotRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/workout-plans', workoutPlanRoutes);
app.use('/api/workout-sessions', workoutSessionRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
