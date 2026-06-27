import { useEffect, useState } from 'react';
import api from '../api';
import { formatTime } from '../utils/formatters';
import { getExercisePhase, getSessionState } from '../utils/session';
import { translateStatus } from '../utils/translations';

export default function WorkoutSession({ initialSession, onBack }) {
  const [session, setSession] = useState(initialSession);
  const [now, setNow] = useState(new Date());
  const [error, setError] = useState('');

  async function refreshSession() {
    try {
      const response = await api.get(`/api/workout-sessions/${session.WorkoutSessionId}`);
      setSession(response.data.workoutSession);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Nie udało się odświeżyć sesji');
    }
  }

  useEffect(() => {
    const intervalId = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  if (!session) {
    return <div className="card">Ładowanie sesji...</div>;
  }

  const state = getSessionState(session, now);
  const phase = state.item ? getExercisePhase(state.item, state.elapsedSeconds) : null;
  const nextItem = state.item
      ? session.items.find((item) => item.OrderNumber === state.item.OrderNumber + 1)
      : null;

  return (
      <div className="card session">
        <button className="secondary" onClick={onBack}>
          ← Wróć do panelu
        </button>

        <h2>{session.WorkoutPlanName}</h2>

        <p>Status sesji: {translateStatus(session.Status)}</p>
        <p>Cel treningu: {session.WorkoutPlanGoal}</p>
        <p>
          Rezerwacja: {session.StartTime}–{session.EndTime}, data:{' '}
          {String(session.SessionDate).slice(0, 10)}
        </p>

        {error && <p className="error">{error}</p>}

        {state.status === 'cancelled' && (
            <>
              <h3>{state.label}</h3>
              <p>
                Ta sesja została odwołana, a zarezerwowane urządzenia zostały zwolnione.
              </p>
            </>
        )}

        {state.status === 'waiting' && (
            <>
              <h3>{state.label}</h3>
              <p>
                Sesja rozpocznie się o godzinie {session.StartTime}.
                Timer ćwiczeń i przerw pojawi się dopiero po rozpoczęciu treningu.
              </p>
            </>
        )}

        {state.status === 'empty' && (
            <>
              <h3>{state.label}</h3>
              <p>Ta sesja nie ma aktywnych ćwiczeń do wyświetlenia.</p>
            </>
        )}

        {state.status === 'finished' && (
            <>
              <h3>{state.label}</h3>
              <p>Sesja była zarezerwowana do godziny {session.EndTime}.</p>
            </>
        )}

        {state.status === 'active' && state.item && (
            <>
              <h3>{state.label}</h3>

              <h2>{state.item.ExerciseName}</h2>
              <p>Urządzenie: {state.item.EquipmentName}</p>
              <p>
                Zarezerwowany czas: {state.item.PlannedStartTime}–{state.item.PlannedEndTime}
              </p>
              <p>Liczba zarezerwowanych minut: {state.item.ReservedMinutes}</p>

              {phase ? (
                  <div className="phase">
                    <h3>{phase.name}</h3>
                    <div className="timer">{formatTime(phase.remainingSeconds)}</div>
                    <p>{phase.detail}</p>
                  </div>
              ) : (
                  <div className="timer">{formatTime(state.remainingSeconds)}</div>
              )}

              <p className="hint">
                Pozostało do końca aktualnego stanowiska: {formatTime(state.remainingSeconds)}
              </p>

              {nextItem && (
                  <p className="next">
                    Następne ćwiczenie: {nextItem.ExerciseName} na urządzeniu {nextItem.EquipmentName}
                  </p>
              )}
            </>
        )}

        <div className="timeline">
          <h3>Harmonogram sesji</h3>

          {session.items.map((item) => (
              <div key={item.ReservationId} className="timeline-item">
                <strong>
                  {item.PlannedStartTime}–{item.PlannedEndTime}
                </strong>
                <span>{item.ExerciseName}</span>
                <small>
                  Sprzęt: {item.EquipmentName}, czas: {item.ReservedMinutes} min
                </small>
              </div>
          ))}
        </div>

        <div className="buttons">
          <button onClick={refreshSession}>Odśwież sesję</button>
        </div>
      </div>
  );
}
