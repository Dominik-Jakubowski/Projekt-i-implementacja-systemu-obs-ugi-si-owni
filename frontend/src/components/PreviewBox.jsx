import { translateUnavailableReason } from '../utils/translations';

export default function PreviewBox({
                      preview,
                      onReserveOriginal,
                      onConfirmAdjusted,
                      onUseSuggestedTime,
                      loading,
                    }) {
  if (!preview) {
    return null;
  }

  return (
      <div className="reservation-box">
        <h3>Podgląd dostępności</h3>

        <p>
          Planowany czas: {preview.startTime}–{preview.endTime}
        </p>

        {preview.canReserveOriginalPlan ? (
            <p className="success">
              Oryginalny plan jest dostępny w wybranym terminie.
            </p>
        ) : (
            <p className="error">
              Oryginalny plan wymaga korekty, ponieważ część sprzętu jest niedostępna.
            </p>
        )}

        <div className="timeline">
          {preview.items.map((item) => (
              <div key={item.workoutPlanItemId} className="timeline-item">
                <strong>
                  {item.plannedStartTime}–{item.plannedEndTime}
                </strong>

                <span>
              Ćwiczenie: {item.exerciseName}
            </span>

                <small>
                  Wymagany sprzęt: {item.equipmentName}
                </small>

                <small>
                  Dostępność: {item.available ? 'dostępne' : 'niedostępne'}
                </small>

                {!item.available && item.unavailableReason && (
                    <small>
                      Powód: {translateUnavailableReason(item.unavailableReason)}
                    </small>
                )}

                {item.suggestedReplacement ? (
                    <>
                      <small>
                        Proponowane ćwiczenie zastępcze: {item.suggestedReplacement.exerciseName}
                      </small>
                      <small>
                        Sprzęt zastępczy: {item.suggestedReplacement.equipmentName}
                      </small>
                    </>
                ) : (
                    !item.available && (
                        <small>
                          Brak dostępnego zamiennika dla tej pozycji.
                        </small>
                    )
                )}
              </div>
          ))}
        </div>

        {preview.tooManyChanges && (
            <div className="reservation-box">
              <h3>Proponowane inne terminy</h3>

              <p className="hint">
                System wykrył, że plan wymaga dużej liczby zmian:{' '}
                {preview.changedItemsCount} z {preview.totalItemsCount} ćwiczeń{' '}
                ({preview.changePercentage}%).
                Zamiast mocno zmieniać plan, możesz wybrać jeden z najbliższych dostępnych terminów.
              </p>

              {preview.suggestedAlternativeStartTimes?.length > 0 ? (
                  <div className="buttons">
                    {preview.suggestedAlternativeStartTimes.map((term) => (
                        <button
                            key={`${term.sessionDate}-${term.startTime}`}
                            type="button"
                            className="secondary"
                            onClick={() => onUseSuggestedTime(term)}
                        >
                          {String(term.startTime).slice(0, 5)}–{String(term.endTime).slice(0, 5)}
                        </button>
                    ))}
                  </div>
              ) : (
                  <p className="error">
                    Nie znaleziono trzech kolejnych dostępnych terminów w tym dniu.
                  </p>
              )}
            </div>
        )}

        {preview.canReserveOriginalPlan ? (
            <button onClick={onReserveOriginal} disabled={loading}>
              {loading ? 'Rezerwowanie...' : 'Zarezerwuj'}
            </button>
        ) : (
            <button
                onClick={onConfirmAdjusted}
                disabled={loading || !preview.hasSuggestedCorrection}
            >
              {loading
                  ? 'Zatwierdzanie...'
                  : preview.hasSuggestedCorrection
                      ? 'Zatwierdź skorygowany plan'
                      : 'Brak możliwej korekty'}
            </button>
        )}
      </div>
  );
}
