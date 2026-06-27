import PreviewBox from '../components/PreviewBox';
import { formatTime } from '../utils/formatters';
import { translateDifficultyLevel, translateGoal } from '../utils/translations';

export default function MyPlansView({
                       plans,
                       sessionDate,
                       startTime,
                       previewByPlanId,
                       loadingPlanId,
                       onPreview,
                       onReserveOriginal,
                       onConfirmAdjusted,
                       onUseSuggestedTime,
                       onDeletePlan,
                     }) {
  return (
      <div className="card">
        <h2>Moje plany treningowe</h2>

        {plans.length === 0 && <p>Brak prywatnych planów treningowych.</p>}

        {plans.map((plan) => (
            <div key={plan.WorkoutPlanId} className="plan">
              <h3>{plan.Name}</h3>
              <p>{plan.Description}</p>
              <p>Cel: {translateGoal(plan.Goal)}</p>
              <p>Poziom: {translateDifficultyLevel(plan.DifficultyLevel)}</p>
              <p>Szacowany czas treningu: {formatTime(plan.EstimatedDurationSeconds || 0)}</p>

              <div className="buttons">
                <button
                    onClick={() => onPreview(plan.WorkoutPlanId)}
                    disabled={loadingPlanId === plan.WorkoutPlanId}
                >
                  {loadingPlanId === plan.WorkoutPlanId
                      ? 'Sprawdzanie...'
                      : 'Sprawdź dostępność'}
                </button>

                <button
                    className="danger"
                    onClick={() => onDeletePlan(plan.WorkoutPlanId)}
                    disabled={loadingPlanId === plan.WorkoutPlanId}
                >
                  Usuń plan
                </button>
              </div>

              <PreviewBox
                  preview={previewByPlanId[plan.WorkoutPlanId]}
                  loading={loadingPlanId === plan.WorkoutPlanId}
                  onReserveOriginal={() => onReserveOriginal(plan.WorkoutPlanId)}
                  onConfirmAdjusted={() => onConfirmAdjusted(plan.WorkoutPlanId)}
                  onUseSuggestedTime={onUseSuggestedTime}
              />
            </div>
        ))}

        <p className="hint">
          Wybrany termin dla sprawdzania dostępności: {sessionDate}, godzina {startTime}.
        </p>
      </div>
  );
}
