import { useEffect, useState } from 'react';
import api from '../api';
import AdminEquipmentPanel from '../admin/AdminEquipmentPanel';
import AdminReservationsPanel from '../admin/AdminReservationsPanel';
import AdminUsersPanel from '../admin/AdminUsersPanel';
import BookingControls from '../components/BookingControls';
import { getDefaultReservationDateTime } from '../utils/calendar';
import MyPlansView from './MyPlansView';
import PlanCreator from './PlanCreator';
import SessionsView from './SessionsView';
import TemplatesView from './TemplatesView';

export default function Dashboard({ user, onSessionCreated }) {
  const [activeView, setActiveView] = useState('plans');
  const isAdmin = user?.roleName === 'admin';

  const [plans, setPlans] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [sessions, setSessions] = useState([]);

  const [defaultReservation] = useState(() => getDefaultReservationDateTime());

  const [sessionDate, setSessionDate] = useState(defaultReservation.sessionDate);
  const [startTime, setStartTime] = useState(defaultReservation.startTime);

  const [previewByPlanId, setPreviewByPlanId] = useState({});
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loadingPlanId, setLoadingPlanId] = useState(null);
  const [loadingTemplateId, setLoadingTemplateId] = useState(null);
  const [loadingSessionId, setLoadingSessionId] = useState(null);

  async function loadPlans() {
    const response = await api.get('/api/workout-plans');
    setPlans(response.data.workoutPlans || []);
  }

  async function loadTemplates() {
    const response = await api.get('/api/workout-plans/templates');
    setTemplates(response.data.workoutPlanTemplates || []);
  }

  async function loadSessions() {
    const response = await api.get('/api/workout-sessions');

    const activeSessions = (response.data.workoutSessions || []).filter(
        (session) => session.Status !== 'cancelled'
    );

    setSessions(activeSessions);
  }

  async function loadAll() {
    setError('');

    try {
      await Promise.all([loadPlans(), loadTemplates(), loadSessions()]);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Nie udało się pobrać danych');
    }
  }

  function validateFutureDate() {
    setError('');
    return true;
  }

  function useSuggestedTime(term) {
    setSessionDate(String(term.sessionDate).slice(0, 10));
    setStartTime(String(term.startTime).slice(0, 5));
    setPreviewByPlanId({});
    setMessage(
        `Wybrano proponowany termin: ${String(term.sessionDate).slice(0, 10)}, ` +
        `${String(term.startTime).slice(0, 5)}–${String(term.endTime).slice(0, 5)}. ` +
        'Kliknij ponownie „Sprawdź dostępność”.'
    );
    setError('');
  }

  async function copyTemplate(templateId) {
    setError('');
    setMessage('');
    setLoadingTemplateId(templateId);

    try {
      await api.post(`/api/workout-plans/${templateId}/copy`, {});
      setMessage('Szablon został skopiowany do Twoich planów');
      await loadPlans();
      setActiveView('plans');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Nie udało się skopiować szablonu');
    } finally {
      setLoadingTemplateId(null);
    }
  }

  async function deletePlan(workoutPlanId) {
    setError('');
    setMessage('');

    const confirmed = window.confirm(
        'Czy na pewno chcesz usunąć ten plan treningowy? Zaplanowane wcześniej sesje pozostaną w historii.'
    );

    if (!confirmed) {
      return;
    }

    setLoadingPlanId(workoutPlanId);

    try {
      await api.delete(`/api/workout-plans/${workoutPlanId}`);
      setMessage('Plan został usunięty');
      setPreviewByPlanId((previous) => {
        const copy = { ...previous };
        delete copy[workoutPlanId];
        return copy;
      });
      await loadPlans();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Nie udało się usunąć planu');
    } finally {
      setLoadingPlanId(null);
    }
  }

  async function previewWorkoutSession(workoutPlanId) {
    setError('');
    setMessage('');

    if (!validateFutureDate()) {
      return;
    }

    setLoadingPlanId(workoutPlanId);

    try {
      const response = await api.post('/api/workout-sessions/preview', {
        workoutPlanId,
        sessionDate,
        startTime,
      });

      setPreviewByPlanId((previous) => ({
        ...previous,
        [workoutPlanId]: response.data.preview,
      }));
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Nie udało się sprawdzić dostępności');
    } finally {
      setLoadingPlanId(null);
    }
  }

  async function reserveOriginalPlan(workoutPlanId) {
    setError('');
    setMessage('');

    if (!validateFutureDate()) {
      return;
    }

    setLoadingPlanId(workoutPlanId);

    try {
      const response = await api.post('/api/workout-sessions', {
        workoutPlanId,
        sessionDate,
        startTime,
      });

      await loadSessions();
      onSessionCreated(response.data.workoutSession);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Nie udało się zarezerwować sesji');
    } finally {
      setLoadingPlanId(null);
    }
  }

  async function confirmAdjustedPlan(workoutPlanId) {
    setError('');
    setMessage('');

    const preview = previewByPlanId[workoutPlanId];

    if (!preview) {
      setError('Najpierw sprawdź dostępność planu');
      return;
    }

    const adjustments = preview.items
        .filter((item) => item.suggestedReplacement)
        .map((item) => ({
          workoutPlanItemId: item.workoutPlanItemId,
          exerciseId: item.suggestedReplacement.exerciseId,
          equipmentId: item.suggestedReplacement.equipmentId,
        }));

    if (adjustments.length === 0) {
      setError('Brak dostępnych zamienników do zatwierdzenia');
      return;
    }

    setLoadingPlanId(workoutPlanId);

    try {
      const response = await api.post('/api/workout-sessions/confirm-adjusted', {
        workoutPlanId,
        sessionDate,
        startTime,
        adjustments,
      });

      await Promise.all([loadPlans(), loadSessions()]);
      onSessionCreated(response.data.workoutSession);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Nie udało się zatwierdzić skorygowanego planu');
    } finally {
      setLoadingPlanId(null);
    }
  }

  async function cancelSession(workoutSessionId) {
    setError('');
    setMessage('');

    const confirmed = window.confirm(
        'Czy na pewno chcesz odwołać tę sesję? Zarezerwowane urządzenia zostaną zwolnione.'
    );

    if (!confirmed) {
      return;
    }

    setLoadingSessionId(workoutSessionId);

    try {
      await api.patch(`/api/workout-sessions/${workoutSessionId}/cancel`);
      setMessage('Sesja została odwołana');

      setSessions((previous) =>
          previous.filter((session) => session.WorkoutSessionId !== workoutSessionId)
      );
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Nie udało się odwołać sesji');
    } finally {
      setLoadingSessionId(null);
    }
  }

  async function openSession(workoutSessionId) {
    setError('');
    setLoadingSessionId(workoutSessionId);

    try {
      const response = await api.get(`/api/workout-sessions/${workoutSessionId}`);
      onSessionCreated(response.data.workoutSession);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Nie udało się otworzyć sesji');
    } finally {
      setLoadingSessionId(null);
    }
  }

  async function handlePlanCreated() {
    await loadPlans();
    setActiveView('plans');
    setMessage('Plan został utworzony i dodany do Twoich planów');
  }

  useEffect(() => {
    loadAll();
  }, []);

  return (
      <>
        <div className="dashboard-menu">
          <button
              type="button"
              className={`menu-tile ${activeView === 'plans' ? 'active' : ''}`}
              onClick={() => setActiveView('plans')}
          >
            <strong>Moje plany</strong>
            <span>Sprawdzanie dostępności, rezerwacja i usuwanie planów</span>
          </button>

          <button
              type="button"
              className={`menu-tile ${activeView === 'templates' ? 'active' : ''}`}
              onClick={() => setActiveView('templates')}
          >
            <strong>Proponowane plany</strong>
            <span>Szablony przygotowane przez administratora</span>
          </button>

          <button
              type="button"
              className={`menu-tile ${activeView === 'creator' ? 'active' : ''}`}
              onClick={() => setActiveView('creator')}
          >
            <strong>Kreator planu</strong>
            <span>Utwórz własny plan z dostępnych ćwiczeń</span>
          </button>

          <button
              type="button"
              className={`menu-tile ${activeView === 'sessions' ? 'active' : ''}`}
              onClick={() => setActiveView('sessions')}
          >
            <strong>Moje sesje</strong>
            <span>Zaplanowane treningi i timer sesji</span>
          </button>

          {isAdmin && (
              <button
                  type="button"
                  className={`menu-tile ${activeView === 'admin-users' ? 'active' : ''}`}
                  onClick={() => setActiveView('admin-users')}
              >
                <strong>Panel administratora</strong>
                <span>Zarządzanie użytkownikami systemu</span>
              </button>
          )}

          {isAdmin && (
              <button
                  type="button"
                  className={`menu-tile ${activeView === 'admin-equipment' ? 'active' : ''}`}
                  onClick={() => setActiveView('admin-equipment')}
              >
                <strong>Admin: sprzęt</strong>
                <span>Ilość urządzeń i aktywność sprzętu</span>
              </button>
          )}

          {isAdmin && (
              <button
                  type="button"
                  className={`menu-tile ${activeView === 'admin-reservations' ? 'active' : ''}`}
                  onClick={() => setActiveView('admin-reservations')}
              >
                <strong>Admin: rezerwacje</strong>
                <span>Podgląd rezerwacji wszystkich użytkowników</span>
              </button>
          )}


        </div>

        {message && <p className="success global-message">{message}</p>}
        {error && <p className="error global-message">{error}</p>}

        {activeView === 'plans' && (
            <>
              <BookingControls
                  sessionDate={sessionDate}
                  setSessionDate={setSessionDate}
                  startTime={startTime}
                  setStartTime={setStartTime}
                  onRefresh={loadAll}
              />

              <MyPlansView
                  plans={plans}
                  sessionDate={sessionDate}
                  startTime={startTime}
                  previewByPlanId={previewByPlanId}
                  loadingPlanId={loadingPlanId}
                  onPreview={previewWorkoutSession}
                  onReserveOriginal={reserveOriginalPlan}
                  onConfirmAdjusted={confirmAdjustedPlan}
                  onUseSuggestedTime={useSuggestedTime}
                  onDeletePlan={deletePlan}
              />
            </>
        )}

        {activeView === 'templates' && (
            <TemplatesView
                templates={templates}
                loadingTemplateId={loadingTemplateId}
                onCopyTemplate={copyTemplate}
            />
        )}

        {activeView === 'creator' && (
            <PlanCreator onPlanCreated={handlePlanCreated} />
        )}

        {activeView === 'sessions' && (
            <SessionsView
                sessions={sessions}
                loadingSessionId={loadingSessionId}
                onOpenSession={openSession}
                onCancelSession={cancelSession}
            />
        )}

        {activeView === 'admin-users' && isAdmin && (
            <AdminUsersPanel />
        )}

        {activeView === 'admin-equipment' && isAdmin && (
            <AdminEquipmentPanel />
        )}

        {activeView === 'admin-reservations' && isAdmin && (
            <AdminReservationsPanel />
        )}

      </>
  );
}
