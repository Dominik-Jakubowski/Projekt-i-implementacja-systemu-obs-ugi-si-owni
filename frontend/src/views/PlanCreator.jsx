import { useEffect, useState } from 'react';
import api from '../api';
import { translateExerciseType } from '../utils/translations';

export default function PlanCreator({ onPlanCreated }) {
  const [exercises, setExercises] = useState([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState('');
  const [selectedExercises, setSelectedExercises] = useState([]);

  const [name, setName] = useState('Własny plan treningowy');
  const [description, setDescription] = useState('Plan utworzony samodzielnie z dostępnych ćwiczeń.');
  const [goal, setGoal] = useState('hypertrophy');
  const [difficultyLevel, setDifficultyLevel] = useState('beginner');

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadExercises() {
    try {
      const response = await api.get('/api/exercises');
      setExercises(response.data.exercises || []);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Nie udało się pobrać ćwiczeń');
    }
  }

  async function addExercise() {
    setError('');
    setMessage('');

    if (!selectedExerciseId) {
      setError('Wybierz ćwiczenie z listy');
      return;
    }

    try {
      const response = await api.get(`/api/exercises/${selectedExerciseId}`);
      const exercise = response.data.exercise;

      const defaultEquipment =
          exercise.equipment?.find((item) => item.IsDefault) ||
          exercise.equipment?.[0];

      if (!defaultEquipment) {
        setError('Wybrane ćwiczenie nie ma przypisanego urządzenia');
        return;
      }

      setSelectedExercises((previous) => [
        ...previous,
        {
          exerciseId: exercise.ExerciseId,
          exerciseName: exercise.Name,
          exerciseType: exercise.ExerciseType,
          equipmentId: defaultEquipment.EquipmentId,
          equipmentName: defaultEquipment.Name || defaultEquipment.EquipmentName,
          notes: '',
        },
      ]);

      setSelectedExerciseId('');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Nie udało się dodać ćwiczenia');
    }
  }

  function removeExercise(indexToRemove) {
    setSelectedExercises((previous) =>
        previous.filter((_, index) => index !== indexToRemove)
    );
  }

  function updateExerciseNotes(indexToUpdate, notes) {
    setSelectedExercises((previous) =>
        previous.map((item, index) =>
            index === indexToUpdate ? { ...item, notes } : item
        )
    );
  }

  async function createPlan(event) {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!name.trim()) {
      setError('Nazwa planu jest wymagana');
      return;
    }

    if (selectedExercises.length === 0) {
      setError('Dodaj przynajmniej jedno ćwiczenie do planu');
      return;
    }

    setLoading(true);

    try {
      const planResponse = await api.post('/api/workout-plans', {
        name,
        description,
        goal,
        difficultyLevel,
      });

      const createdPlan = planResponse.data.workoutPlan;
      const workoutPlanId = createdPlan.WorkoutPlanId;

      for (const [index, exercise] of selectedExercises.entries()) {
        await api.post(`/api/workout-plans/${workoutPlanId}/items`, {
          exerciseId: exercise.exerciseId,
          equipmentId: exercise.equipmentId,
          orderNumber: index + 1,
          notes: exercise.notes || null,
        });
      }

      setMessage(`Utworzono plan: ${name}`);
      setSelectedExercises([]);
      setName('Własny plan treningowy');
      setDescription('Plan utworzony samodzielnie z dostępnych ćwiczeń.');
      setGoal('hypertrophy');
      setDifficultyLevel('beginner');

      onPlanCreated();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Nie udało się utworzyć planu');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadExercises();
  }, []);

  return (
      <div className="card">
        <h2>Kreator własnego planu</h2>

        <form onSubmit={createPlan}>
          <label>Nazwa planu</label>
          <input value={name} onChange={(e) => setName(e.target.value)} />

          <label>Opis</label>
          <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
          />

          <label>Typ treningu</label>
          <select value={goal} onChange={(e) => setGoal(e.target.value)}>
            <option value="strength">Siła</option>
            <option value="hypertrophy">Masa mięśniowa</option>
            <option value="endurance">Wytrzymałość</option>
            <option value="general">Ogólny</option>
          </select>

          <label>Poziom</label>
          <select
              value={difficultyLevel}
              onChange={(e) => setDifficultyLevel(e.target.value)}
          >
            <option value="beginner">Początkujący</option>
            <option value="intermediate">Średniozaawansowany</option>
            <option value="advanced">Zaawansowany</option>
          </select>

          <div className="reservation-box">
            <h3>Dodaj ćwiczenie</h3>

            <select
                value={selectedExerciseId}
                onChange={(e) => setSelectedExerciseId(e.target.value)}
            >
              <option value="">-- wybierz ćwiczenie --</option>
              {exercises.map((exercise) => (
                  <option key={exercise.ExerciseId} value={exercise.ExerciseId}>
                    {exercise.Name} — {translateExerciseType(exercise.ExerciseType)}
                  </option>
              ))}
            </select>

            <button type="button" onClick={addExercise}>
              Dodaj ćwiczenie
            </button>
          </div>

          {selectedExercises.length > 0 && (
              <div className="timeline">
                <h3>Ćwiczenia w planie</h3>

                {selectedExercises.map((exercise, index) => (
                    <div key={`${exercise.exerciseId}-${index}`} className="timeline-item">
                      <strong>
                        {index + 1}. {exercise.exerciseName}
                      </strong>
                      <span>Urządzenie: {exercise.equipmentName}</span>

                      <input
                          placeholder="Notatka do ćwiczenia"
                          value={exercise.notes}
                          onChange={(e) => updateExerciseNotes(index, e.target.value)}
                      />

                      <button
                          type="button"
                          className="secondary"
                          onClick={() => removeExercise(index)}
                      >
                        Usuń
                      </button>
                    </div>
                ))}
              </div>
          )}

          <button type="submit" disabled={loading}>
            {loading ? 'Tworzenie planu...' : 'Utwórz własny plan'}
          </button>
        </form>

        {message && <p className="success">{message}</p>}
        {error && <p className="error">{error}</p>}
      </div>
  );
}
