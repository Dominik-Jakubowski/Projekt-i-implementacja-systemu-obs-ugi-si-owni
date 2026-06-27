import { useEffect, useState } from 'react';
import api from '../api';
import { translateStatus } from '../utils/translations';

export default function AdminReservationsPanel() {
  const [reservations, setReservations] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  function formatReservationDate(value) {
    if (!value) {
      return '-';
    }

    return String(value).slice(0, 10);
  }

  function formatReservationTime(value) {
    if (!value) {
      return '-';
    }

    return String(value).slice(0, 5);
  }

  async function loadReservations() {
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await api.get('/api/reservations');
      setReservations(response.data.reservations || response.data || []);
      setMessage('Lista rezerwacji została odświeżona');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Nie udało się pobrać rezerwacji');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReservations();
  }, []);

  const filteredReservations = reservations.filter((reservation) => {
    const status = reservation.Status || reservation.status;

    if (statusFilter === 'all') {
      return true;
    }

    return status === statusFilter;
  });

  return (
      <div className="card">
        <h2>Panel administratora — rezerwacje</h2>

        <p className="hint">
          Widok pokazuje rezerwacje wszystkich użytkowników. Administrator może sprawdzić,
          kto zarezerwował dane urządzenie, na jaki termin i jaki jest status rezerwacji.
        </p>

        <div className="reservation-box">
          <div className="section-heading">
            <h3>Filtry</h3>

            <button
                className="secondary"
                type="button"
                onClick={loadReservations}
                disabled={loading}
            >
              {loading ? 'Odświeżanie...' : 'Odśwież'}
            </button>
          </div>

          <label>Status rezerwacji</label>
          <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Wszystkie</option>
            <option value="active">Aktywne</option>
            <option value="cancelled">Odwołane</option>
            <option value="completed">Zakończone</option>
          </select>
        </div>

        <div className="reservation-box">
          <h3>Lista rezerwacji</h3>

          {filteredReservations.length === 0 && (
              <p>Brak rezerwacji do wyświetlenia.</p>
          )}

          <div className="timeline">
            {filteredReservations.map((reservation) => {
              const reservationId =
                  reservation.ReservationId ||
                  reservation.id ||
                  reservation.reservationId;

              const userName =
                  reservation.FullName ||
                  reservation.UserFullName ||
                  reservation.userFullName ||
                  reservation.UserName ||
                  reservation.userName ||
                  '-';

              const userEmail =
                  reservation.Email ||
                  reservation.UserEmail ||
                  reservation.userEmail ||
                  reservation.email ||
                  '-';

              const equipmentName =
                  reservation.EquipmentName ||
                  reservation.Name ||
                  reservation.equipmentName ||
                  '-';

              const reservationDate =
                  reservation.ReservationDate ||
                  reservation.reservationDate ||
                  reservation.SessionDate ||
                  reservation.sessionDate;

              const startTime =
                  reservation.StartTime ||
                  reservation.startTime;

              const endTime =
                  reservation.EndTime ||
                  reservation.endTime;

              const status =
                  reservation.Status ||
                  reservation.status ||
                  '-';

              const createdAt =
                  reservation.CreatedAt ||
                  reservation.createdAt;

              return (
                  <div key={reservationId} className="timeline-item">
                    <strong>
                      Rezerwacja #{reservationId}
                    </strong>

                    <span>
                      Użytkownik: {userName}
                    </span>

                    <small>
                      Email:
                      {' '}
                      {userEmail}
                    </small>

                    <small>
                      Sprzęt:
                      {' '}
                      {equipmentName}
                    </small>

                    <small>
                      Termin:
                      {' '}
                      {formatReservationDate(reservationDate)}
                      {' '}
                      {formatReservationTime(startTime)}
                      –
                      {formatReservationTime(endTime)}
                    </small>

                    <small>
                      Status:
                      {' '}
                      {translateStatus(status)}
                      {' '}
                      ({status})
                    </small>

                    {createdAt && (
                        <small>
                          Utworzono:
                          {' '}
                          {String(createdAt).replace('T', ' ').slice(0, 19)}
                        </small>
                    )}
                  </div>
              );
            })}
          </div>
        </div>

        {message && <p className="success">{message}</p>}
        {error && <p className="error">{error}</p>}
      </div>
  );
}
