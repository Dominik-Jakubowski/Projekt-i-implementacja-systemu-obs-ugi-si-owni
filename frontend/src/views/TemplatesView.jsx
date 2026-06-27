import { formatTime } from '../utils/formatters';
import { translateDifficultyLevel, translateGoal } from '../utils/translations';

export default function TemplatesView({ templates, loadingTemplateId, onCopyTemplate }) {
  return (
      <div className="card">
        <h2>Proponowane plany treningowe</h2>

        {templates.length === 0 && <p>Brak proponowanych planów.</p>}

        {templates.map((template) => (
            <div key={template.WorkoutPlanId} className="plan">
              <h3>{template.Name}</h3>
              <p>{template.Description}</p>
              <p>Cel: {translateGoal(template.Goal)}</p>
              <p>Poziom: {translateDifficultyLevel(template.DifficultyLevel)}</p>
              <p>Szacowany czas: {formatTime(template.EstimatedDurationSeconds || 0)}</p>

              <button
                  onClick={() => onCopyTemplate(template.WorkoutPlanId)}
                  disabled={loadingTemplateId === template.WorkoutPlanId}
              >
                {loadingTemplateId === template.WorkoutPlanId
                    ? 'Kopiowanie...'
                    : 'Skopiuj do moich planów'}
              </button>
            </div>
        ))}
      </div>
  );
}
