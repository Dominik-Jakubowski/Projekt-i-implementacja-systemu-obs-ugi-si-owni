import { useEffect, useState } from 'react';
import api from '../api';
import { translateDifficultyLevel } from '../utils/translations';

export default function AdminEquipmentPanel() {
  const [equipment, setEquipment] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [savingId, setSavingId] = useState(null);

  const [muscles, setMuscles] = useState([]);

  const [newEquipmentName, setNewEquipmentName] = useState('');
  const [newEquipmentDescription, setNewEquipmentDescription] = useState('');
  const [newEquipmentQuantity, setNewEquipmentQuantity] = useState('1');
  const [newEquipmentCategory, setNewEquipmentCategory] = useState('strength');

  const [equipmentMuscles, setEquipmentMuscles] = useState([]);
  const [equipmentMuscleId, setEquipmentMuscleId] = useState('');
  const [equipmentMuscleRole, setEquipmentMuscleRole] = useState('primary');
  const [equipmentMuscleActivation, setEquipmentMuscleActivation] = useState('5');
  const [equipmentMuscleNotes, setEquipmentMuscleNotes] = useState('');

  const [exerciseDraft, setExerciseDraft] = useState({
    name: '',
    description: '',
    exerciseType: 'strength',
    timerMode: 'sets_reps',
    defaultSets: '3',
    defaultRepetitions: '12',
    defaultDurationSeconds: '',
    defaultRestSeconds: '60',
    defaultSeriesDurationSeconds: '45',
    difficultyLevel: 'beginner',
  });

  const [newExercises, setNewExercises] = useState([]);

  const [creatingFullEquipment, setCreatingFullEquipment] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  function buildDrafts(items) {
    const nextDrafts = {};

    items.forEach((item) => {
      nextDrafts[item.EquipmentId] = {
        quantity: String(item.Quantity ?? ''),
        isActive: Boolean(item.IsActive),
      };
    });

    return nextDrafts;
  }

  function getMuscleLabel(muscleId) {
    const muscle = muscles.find((item) => Number(item.MuscleId) === Number(muscleId));

    if (!muscle) {
      return `Mięsień #${muscleId}`;
    }

    return `${muscle.Name}${muscle.MuscleGroup ? ` (${muscle.MuscleGroup})` : ''}`;
  }

  function resetNewEquipmentForm() {
    setNewEquipmentName('');
    setNewEquipmentDescription('');
    setNewEquipmentQuantity('1');
    setNewEquipmentCategory('strength');

    setEquipmentMuscles([]);
    setEquipmentMuscleId('');
    setEquipmentMuscleRole('primary');
    setEquipmentMuscleActivation('5');
    setEquipmentMuscleNotes('');

    setExerciseDraft({
      name: '',
      description: '',
      exerciseType: 'strength',
      timerMode: 'sets_reps',
      defaultSets: '3',
      defaultRepetitions: '12',
      defaultDurationSeconds: '',
      defaultRestSeconds: '60',
      defaultSeriesDurationSeconds: '45',
      difficultyLevel: 'beginner',
    });

    setNewExercises([]);
  }

  async function loadEquipment() {
    setError('');

    try {
      const response = await api.get('/api/equipment');
      const items = response.data.equipment || [];

      setEquipment(items);
      setDrafts(buildDrafts(items));
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Nie udało się pobrać sprzętu');
    }
  }

  async function loadMuscles() {
    setError('');

    try {
      const response = await api.get('/api/admin/muscles');
      setMuscles(response.data.muscles || []);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Nie udało się pobrać listy mięśni');
    }
  }

  async function loadInitialData() {
    await Promise.all([loadEquipment(), loadMuscles()]);
  }

  function updateDraft(equipmentId, field, value) {
    setDrafts((previous) => ({
      ...previous,
      [equipmentId]: {
        ...previous[equipmentId],
        [field]: value,
      },
    }));
  }

  async function saveEquipment(equipmentId) {
    setError('');
    setMessage('');

    const draft = drafts[equipmentId];

    if (!draft) {
      setError('Nie znaleziono danych formularza dla wybranego sprzętu');
      return;
    }

    const quantity = Number(draft.quantity);

    if (!Number.isInteger(quantity) || quantity < 1) {
      setError('Ilość sprzętu musi być liczbą całkowitą większą od 0');
      return;
    }

    setSavingId(equipmentId);

    try {
      await api.patch(`/api/equipment/${equipmentId}`, {
        quantity,
        isActive: Boolean(draft.isActive),
      });

      setMessage('Zapisano zmiany sprzętu');
      await loadEquipment();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Nie udało się zapisać zmian sprzętu');
    } finally {
      setSavingId(null);
    }
  }

  async function toggleEquipmentActive(item) {
    setError('');
    setMessage('');

    const equipmentId = item.EquipmentId;
    const isActive = Boolean(item.IsActive);
    const nextStatus = !isActive;

    const confirmed = window.confirm(
        nextStatus
            ? `Czy na pewno chcesz ponownie aktywować urządzenie "${item.Name}"?`
            : `Czy na pewno chcesz dezaktywować urządzenie "${item.Name}"?`
    );

    if (!confirmed) {
      return;
    }

    setSavingId(equipmentId);

    try {
      await api.patch(`/api/equipment/${equipmentId}`, {
        isActive: nextStatus,
      });

      setMessage(nextStatus ? 'Sprzęt został aktywowany' : 'Sprzęt został zdezaktywowany');
      await loadEquipment();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Nie udało się zmienić statusu sprzętu');
    } finally {
      setSavingId(null);
    }
  }

  function addEquipmentMuscle() {
    setError('');
    setMessage('');

    if (!equipmentMuscleId) {
      setError('Wybierz mięsień dla urządzenia');
      return;
    }

    const alreadyExists = equipmentMuscles.some(
        (item) => Number(item.muscleId) === Number(equipmentMuscleId)
    );

    if (alreadyExists) {
      setError('Ten mięsień został już dodany do urządzenia');
      return;
    }

    setEquipmentMuscles((previous) => [
      ...previous,
      {
        muscleId: Number(equipmentMuscleId),
        role: equipmentMuscleRole,
        activationLevel: Number(equipmentMuscleActivation),
        notes: equipmentMuscleNotes || null,
      },
    ]);

    setEquipmentMuscleId('');
    setEquipmentMuscleRole('primary');
    setEquipmentMuscleActivation('5');
    setEquipmentMuscleNotes('');
  }

  function removeEquipmentMuscle(muscleId) {
    setEquipmentMuscles((previous) =>
        previous.filter((item) => Number(item.muscleId) !== Number(muscleId))
    );
  }

  function updateExerciseDraft(field, value) {
    setExerciseDraft((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function addExerciseToNewEquipment() {
    setError('');
    setMessage('');

    if (!exerciseDraft.name.trim()) {
      setError('Nazwa ćwiczenia jest wymagana');
      return;
    }

    if (equipmentMuscles.length === 0) {
      setError('Najpierw dodaj przynajmniej jeden mięsień do urządzenia');
      return;
    }

    const alreadyExists = newExercises.some(
        (item) => item.name.trim().toLowerCase() === exerciseDraft.name.trim().toLowerCase()
    );

    if (alreadyExists) {
      setError('Ćwiczenie o takiej nazwie zostało już dodane do tego urządzenia');
      return;
    }

    setNewExercises((previous) => [
      ...previous,
      {
        ...exerciseDraft,
        name: exerciseDraft.name.trim(),
        description: exerciseDraft.description.trim(),
        muscles: equipmentMuscles,
      },
    ]);

    setExerciseDraft({
      name: '',
      description: '',
      exerciseType: 'strength',
      timerMode: 'sets_reps',
      defaultSets: '3',
      defaultRepetitions: '12',
      defaultDurationSeconds: '',
      defaultRestSeconds: '60',
      defaultSeriesDurationSeconds: '45',
      difficultyLevel: 'beginner',
    });
  }

  function removeExerciseFromNewEquipment(indexToRemove) {
    setNewExercises((previous) =>
        previous.filter((_, index) => index !== indexToRemove)
    );
  }

  function parseOptionalNumber(value) {
    if (value === '' || value == null) {
      return null;
    }

    return Number(value);
  }

  async function createFullEquipment(event) {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!newEquipmentName.trim()) {
      setError('Nazwa urządzenia jest wymagana');
      return;
    }

    const quantity = Number(newEquipmentQuantity);

    if (!Number.isInteger(quantity) || quantity < 1) {
      setError('Ilość urządzeń musi być liczbą całkowitą większą od 0');
      return;
    }

    if (equipmentMuscles.length === 0) {
      setError('Dodaj przynajmniej jeden mięsień powiązany z urządzeniem');
      return;
    }

    if (newExercises.length === 0) {
      setError('Dodaj przynajmniej jedno ćwiczenie dla urządzenia');
      return;
    }

    setCreatingFullEquipment(true);

    try {
      const payload = {
        name: newEquipmentName.trim(),
        description: newEquipmentDescription.trim() || null,
        quantity,
        category: newEquipmentCategory,
        muscles: equipmentMuscles,
        exercises: newExercises.map((exercise) => ({
          name: exercise.name,
          description: exercise.description || null,
          exerciseType: exercise.exerciseType,
          timerMode: exercise.timerMode,
          defaultSets: Number(exercise.defaultSets),
          defaultRepetitions: Number(exercise.defaultRepetitions),
          defaultDurationSeconds: parseOptionalNumber(exercise.defaultDurationSeconds),
          defaultRestSeconds: Number(exercise.defaultRestSeconds),
          defaultSeriesDurationSeconds: Number(exercise.defaultSeriesDurationSeconds),
          difficultyLevel: exercise.difficultyLevel,
          muscles: exercise.muscles,
        })),
      };

      const response = await api.post('/api/admin/equipment/full', payload);

      setMessage(
          `Dodano urządzenie: ${response.data.equipment?.Name || payload.name}`
      );

      resetNewEquipmentForm();
      await loadEquipment();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Nie udało się dodać urządzenia');
    } finally {
      setCreatingFullEquipment(false);
    }
  }

  useEffect(() => {
    loadInitialData();
  }, []);

  return (
      <div className="card">
        <h2>Panel administratora — sprzęt</h2>

        <p className="hint">
          Zmiana ilości odpowiada dodaniu lub usunięciu egzemplarzy istniejącego urządzenia.
          Dezaktywacja ukrywa sprzęt logicznie bez usuwania historii rezerwacji.
        </p>

        <div className="reservation-box">
          <h3>Dodaj nowe urządzenie</h3>

          <form onSubmit={createFullEquipment}>
            <label>Nazwa urządzenia</label>
            <input
                value={newEquipmentName}
                onChange={(e) => setNewEquipmentName(e.target.value)}
            />

            <label>Opis urządzenia</label>
            <textarea
                value={newEquipmentDescription}
                onChange={(e) => setNewEquipmentDescription(e.target.value)}
            />

            <label>Ilość egzemplarzy</label>
            <input
                type="number"
                min="1"
                value={newEquipmentQuantity}
                onChange={(e) => setNewEquipmentQuantity(e.target.value)}
            />

            <label>Kategoria</label>
            <select
                value={newEquipmentCategory}
                onChange={(e) => setNewEquipmentCategory(e.target.value)}
            >
              <option value="strength">Siłowe</option>
              <option value="cardio">Cardio</option>
              <option value="functional">Funkcjonalne</option>
              <option value="mobility">Mobilność</option>
            </select>

            <div className="reservation-box">
              <h3>Mięśnie urządzenia</h3>

              <label>Mięsień</label>
              <select
                  value={equipmentMuscleId}
                  onChange={(e) => setEquipmentMuscleId(e.target.value)}
              >
                <option value="">-- wybierz mięsień --</option>
                {muscles.map((muscle) => (
                    <option key={muscle.MuscleId} value={muscle.MuscleId}>
                      {muscle.Name}
                      {muscle.MuscleGroup ? ` (${muscle.MuscleGroup})` : ''}
                    </option>
                ))}
              </select>

              <label>Rola mięśnia</label>
              <select
                  value={equipmentMuscleRole}
                  onChange={(e) => setEquipmentMuscleRole(e.target.value)}
              >
                <option value="primary">Główna</option>
                <option value="secondary">Pomocnicza</option>
                <option value="stabilizer">Stabilizująca</option>
              </select>

              <label>Poziom aktywacji</label>
              <select
                  value={equipmentMuscleActivation}
                  onChange={(e) => setEquipmentMuscleActivation(e.target.value)}
              >
                <option value="1">1 — niski</option>
                <option value="2">2</option>
                <option value="3">3 — średni</option>
                <option value="4">4</option>
                <option value="5">5 — wysoki</option>
              </select>

              <label>Notatka</label>
              <input
                  value={equipmentMuscleNotes}
                  onChange={(e) => setEquipmentMuscleNotes(e.target.value)}
                  placeholder="Opcjonalna notatka"
              />

              <button type="button" className="secondary" onClick={addEquipmentMuscle}>
                Dodaj mięsień do urządzenia
              </button>

              {equipmentMuscles.length > 0 && (
                  <div className="timeline">
                    {equipmentMuscles.map((item) => (
                        <div key={item.muscleId} className="timeline-item">
                          <strong>{getMuscleLabel(item.muscleId)}</strong>
                          <small>Rola: {item.role}</small>
                          <small>Aktywacja: {item.activationLevel}/5</small>
                          {item.notes && <small>Notatka: {item.notes}</small>}

                          <button
                              type="button"
                              className="secondary"
                              onClick={() => removeEquipmentMuscle(item.muscleId)}
                          >
                            Usuń
                          </button>
                        </div>
                    ))}
                  </div>
              )}
            </div>

            <div className="reservation-box">
              <h3>Ćwiczenia dla urządzenia</h3>

              <p className="hint">
                Ćwiczenie automatycznie otrzyma mięśnie przypisane do urządzenia.
              </p>

              <label>Nazwa ćwiczenia</label>
              <input
                  value={exerciseDraft.name}
                  onChange={(e) => updateExerciseDraft('name', e.target.value)}
              />

              <label>Opis ćwiczenia</label>
              <textarea
                  value={exerciseDraft.description}
                  onChange={(e) => updateExerciseDraft('description', e.target.value)}
              />

              <label>Typ ćwiczenia</label>
              <select
                  value={exerciseDraft.exerciseType}
                  onChange={(e) => updateExerciseDraft('exerciseType', e.target.value)}
              >
                <option value="strength">Siłowe</option>
                <option value="cardio">Cardio</option>
                <option value="warmup">Rozgrzewka</option>
                <option value="cooldown">Schłodzenie</option>
                <option value="stretching">Rozciąganie</option>
                <option value="mobility">Mobilność</option>
              </select>

              <label>Tryb timera</label>
              <select
                  value={exerciseDraft.timerMode}
                  onChange={(e) => updateExerciseDraft('timerMode', e.target.value)}
              >
                <option value="sets_reps">Serie i powtórzenia</option>
                <option value="duration">Czas trwania</option>
                <option value="manual">Manualny</option>
              </select>

              <label>Domyślna liczba serii</label>
              <input
                  type="number"
                  min="1"
                  value={exerciseDraft.defaultSets}
                  onChange={(e) => updateExerciseDraft('defaultSets', e.target.value)}
              />

              <label>Domyślna liczba powtórzeń</label>
              <input
                  type="number"
                  min="1"
                  value={exerciseDraft.defaultRepetitions}
                  onChange={(e) => updateExerciseDraft('defaultRepetitions', e.target.value)}
              />

              <label>Czas ćwiczenia w sekundach, opcjonalnie</label>
              <input
                  type="number"
                  min="1"
                  value={exerciseDraft.defaultDurationSeconds}
                  onChange={(e) => updateExerciseDraft('defaultDurationSeconds', e.target.value)}
                  placeholder="Np. 600 dla cardio"
              />

              <label>Przerwa w sekundach</label>
              <input
                  type="number"
                  min="0"
                  value={exerciseDraft.defaultRestSeconds}
                  onChange={(e) => updateExerciseDraft('defaultRestSeconds', e.target.value)}
              />

              <label>Czas serii w sekundach</label>
              <input
                  type="number"
                  min="1"
                  value={exerciseDraft.defaultSeriesDurationSeconds}
                  onChange={(e) =>
                      updateExerciseDraft('defaultSeriesDurationSeconds', e.target.value)
                  }
              />

              <label>Poziom trudności</label>
              <select
                  value={exerciseDraft.difficultyLevel}
                  onChange={(e) => updateExerciseDraft('difficultyLevel', e.target.value)}
              >
                <option value="beginner">Początkujący</option>
                <option value="intermediate">Średniozaawansowany</option>
                <option value="advanced">Zaawansowany</option>
              </select>

              <button type="button" className="secondary" onClick={addExerciseToNewEquipment}>
                Dodaj ćwiczenie do urządzenia
              </button>

              {newExercises.length > 0 && (
                  <div className="timeline">
                    <h4>Ćwiczenia przygotowane do zapisania</h4>

                    {newExercises.map((exercise, index) => (
                        <div key={`${exercise.name}-${index}`} className="timeline-item">
                          <strong>{exercise.name}</strong>
                          <span>{exercise.description || 'Brak opisu'}</span>
                          <small>Typ: {exercise.exerciseType}</small>
                          <small>Timer: {exercise.timerMode}</small>
                          <small>Poziom: {translateDifficultyLevel(exercise.difficultyLevel)}</small>
                          <small>Liczba mięśni: {exercise.muscles.length}</small>

                          <button
                              type="button"
                              className="secondary"
                              onClick={() => removeExerciseFromNewEquipment(index)}
                          >
                            Usuń ćwiczenie
                          </button>
                        </div>
                    ))}
                  </div>
              )}
            </div>

            <button type="submit" disabled={creatingFullEquipment}>
              {creatingFullEquipment ? 'Dodawanie urządzenia...' : 'Dodaj nowe urządzenie'}
            </button>
          </form>
        </div>

        <div className="reservation-box">
          <div className="section-heading">
            <h3>Lista sprzętu</h3>

            <button className="secondary" type="button" onClick={loadEquipment}>
              Odśwież
            </button>
          </div>

          {equipment.length === 0 && <p>Brak sprzętu do wyświetlenia.</p>}

          <div className="timeline">
            {equipment.map((item) => {
              const draft = drafts[item.EquipmentId] || {
                quantity: String(item.Quantity ?? ''),
                isActive: Boolean(item.IsActive),
              };

              return (
                  <div key={item.EquipmentId} className="timeline-item">
                    <strong>{item.Name}</strong>

                    <span>
                      {item.Description || 'Brak opisu'}
                    </span>

                    <small>
                      Kategoria:
                      {' '}
                      {item.Category || 'brak'}
                    </small>

                    <small>
                      Aktualna ilość w bazie:
                      {' '}
                      {item.Quantity}
                    </small>

                    <small>
                      Status:
                      {' '}
                      {item.IsActive ? 'aktywny' : 'nieaktywny'}
                    </small>

                    <label>Ilość urządzeń</label>
                    <input
                        type="number"
                        min="1"
                        value={draft.quantity}
                        onChange={(e) =>
                            updateDraft(item.EquipmentId, 'quantity', e.target.value)
                        }
                    />

                    <label>
                      <input
                          type="checkbox"
                          checked={draft.isActive}
                          onChange={(e) =>
                              updateDraft(item.EquipmentId, 'isActive', e.target.checked)
                          }
                      />
                      {' '}
                      Sprzęt aktywny
                    </label>

                    <div className="buttons">
                      <button
                          type="button"
                          onClick={() => saveEquipment(item.EquipmentId)}
                          disabled={savingId === item.EquipmentId}
                      >
                        {savingId === item.EquipmentId ? 'Zapisywanie...' : 'Zapisz zmiany'}
                      </button>

                      <button
                          type="button"
                          className={item.IsActive ? 'danger' : 'secondary'}
                          onClick={() => toggleEquipmentActive(item)}
                          disabled={savingId === item.EquipmentId}
                      >
                        {item.IsActive ? 'Dezaktywuj' : 'Aktywuj'}
                      </button>
                    </div>
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
