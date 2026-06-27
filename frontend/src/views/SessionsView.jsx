import { translateStatus } from '../utils/translations';

export default function SessionsView({ sessions, loadingSessionId, onOpenSession, onCancelSession }) {
  return (
      <div className="card">
        <h2>Moje sesje</h2>

        {sessions.length === 0 && <p>Brak zaplanowanych sesji.</p>}

        {sessions.map((session) => (
            <div key={session.WorkoutSessionId} className="plan">
              <h3>{session.WorkoutPlanName}</h3>
              <p>
                Data: {String(session.SessionDate).slice(0, 10)}, godzina:{' '}
                {session.StartTime}–{session.EndTime}
              </p>
              <p>Status: {translateStatus(session.Status)}</p>

              <div className="buttons">
                <button
                    onClick={() => onOpenSession(session.WorkoutSessionId)}
                    disabled={loadingSessionId === session.WorkoutSessionId}
                >
                  {loadingSessionId === session.WorkoutSessionId
                      ? 'Otwieranie...'
                      : 'Otwórz sesję'}
                </button>

                {session.Status === 'scheduled' && (
                    <button
                        className="danger"
                        onClick={() => onCancelSession(session.WorkoutSessionId)}
                        disabled={loadingSessionId === session.WorkoutSessionId}
                    >
                      Odwołaj sesję
                    </button>
                )}
              </div>
            </div>
        ))}
      </div>
  );
}
