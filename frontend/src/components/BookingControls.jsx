import { useEffect, useState } from 'react';
import { dateToInputValue, inputValueToDate } from '../utils/formatters';
import { buildLocalDateTime, buildTimeOptions, getCalendarDays, MONTH_NAMES, WEEK_DAYS } from '../utils/calendar';

export default function BookingControls({ sessionDate, setSessionDate, startTime, setStartTime, onRefresh }) {
  const selectedDate = inputValueToDate(sessionDate);
  const [visibleMonth, setVisibleMonth] = useState(
      new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
  );

  const today = new Date();
  const todayValue = dateToInputValue(today);
  const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const calendarDays = getCalendarDays(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth()
  );

  const timeOptions = buildTimeOptions();

  const selectedDateLabel = new Intl.DateTimeFormat('pl-PL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(selectedDate);

  const previousMonthDisabled = visibleMonth <= currentMonth;

  function goToPreviousMonth() {
    setVisibleMonth((previous) =>
        new Date(previous.getFullYear(), previous.getMonth() - 1, 1)
    );
  }

  function goToNextMonth() {
    setVisibleMonth((previous) =>
        new Date(previous.getFullYear(), previous.getMonth() + 1, 1)
    );
  }

  function selectDate(date) {
    setSessionDate(dateToInputValue(date));
  }

  function isTimeInPast(time) {
    return buildLocalDateTime(sessionDate, time) <= new Date();
  }

  useEffect(() => {
    const selectedDateTime = buildLocalDateTime(sessionDate, startTime);

    if (selectedDateTime > new Date()) {
      return;
    }

    const nextAvailableTime = buildTimeOptions().find(
        (time) => buildLocalDateTime(sessionDate, time) > new Date()
    );

    if (nextAvailableTime) {
      setStartTime(nextAvailableTime);
    }
  }, [sessionDate, startTime, setStartTime]);

  return (
      <div className="card booking-card">
        <div className="section-heading">
          <span className="eyebrow">Rezerwacja</span>
          <h2>Termin treningu</h2>
          <p>
            Wybierz dzień i godzinę rozpoczęcia. Dostępność sprzętu zostanie sprawdzona
            dla konkretnego planu treningowego.
          </p>
        </div>

        <div className="booking-layout">
          <section className="reservation-box calendar-panel">
            <div className="calendar-header">
              <button
                  type="button"
                  className="secondary"
                  onClick={goToPreviousMonth}
                  disabled={previousMonthDisabled}
                  aria-label="Poprzedni miesiąc"
              >
                ←
              </button>

              <h3>
                {MONTH_NAMES[visibleMonth.getMonth()]} {visibleMonth.getFullYear()}
              </h3>

              <button
                  type="button"
                  className="secondary"
                  onClick={goToNextMonth}
                  aria-label="Następny miesiąc"
              >
                →
              </button>
            </div>

            <div className="calendar-grid calendar-weekdays">
              {WEEK_DAYS.map((day) => (
                  <div key={day} className="calendar-weekday">
                    {day}
                  </div>
              ))}
            </div>

            <div className="calendar-grid">
              {calendarDays.map((date, index) => {
                if (!date) {
                  return <div key={`empty-${index}`} className="calendar-empty" />;
                }

                const value = dateToInputValue(date);
                const isSelected = value === sessionDate;
                const isPast = value < todayValue;
                const isToday = value === todayValue;

                return (
                    <button
                        key={value}
                        type="button"
                        className={[
                          'calendar-day',
                          isSelected ? 'selected' : '',
                          isToday ? 'today' : '',
                        ].join(' ')}
                        onClick={() => selectDate(date)}
                        disabled={isPast}
                    >
                      {date.getDate()}
                    </button>
                );
              })}
            </div>

            <div className="time-section">
              <div>
                <label>Godzina startu</label>
                <p className="hint">Sloty dostępne są co 15 minut.</p>
              </div>

              <div className="time-slots">
                {timeOptions.map((time) => {
                  const disabled = isTimeInPast(time);
                  const selected = time === startTime;

                  return (
                      <button
                          key={time}
                          type="button"
                          className={`time-slot ${selected ? 'selected' : ''}`}
                          onClick={() => setStartTime(time)}
                          disabled={disabled}
                          aria-pressed={selected}
                      >
                        {time}
                      </button>
                  );
                })}
              </div>
            </div>
          </section>

          <aside className="booking-summary">
            <div className="summary-icon">🏋️</div>

            <h3>Wybrany termin</h3>

            <div className="summary-row">
              <span>Data</span>
              <strong>{selectedDateLabel}</strong>
            </div>

            <div className="summary-row">
              <span>Godzina</span>
              <strong>{startTime}</strong>
            </div>

            <div className="summary-note">
              <strong>Co dalej?</strong>
              <p>
                Po wybraniu terminu przejdź do listy planów i kliknij „Sprawdź dostępność”.
                System sprawdzi zajętość urządzeń dla tej godziny i zaproponuje ewentualne
                zmiany w planie.
              </p>
            </div>

            <button className="secondary refresh-button" onClick={onRefresh}>
              Odśwież dane
            </button>
          </aside>
        </div>
      </div>
  );
}
