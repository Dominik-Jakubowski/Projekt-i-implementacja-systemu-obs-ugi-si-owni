export function translateGoal(goal) {
  switch (goal) {
    case 'strength':
      return 'Siła';
    case 'hypertrophy':
      return 'Masa mięśniowa';
    case 'endurance':
      return 'Wytrzymałość';
    default:
      return 'Ogólny';
  }
}

export function translateExerciseType(type) {
  switch (type) {
    case 'strength':
      return 'ćwiczenie siłowe';
    case 'cardio':
      return 'cardio';
    case 'warmup':
      return 'rozgrzewka';
    case 'cooldown':
      return 'schłodzenie';
    case 'stretching':
      return 'rozciąganie';
    case 'mobility':
      return 'mobilność';
    default:
      return 'ćwiczenie';
  }
}

export function translateDifficultyLevel(level) {
  switch (level) {
    case 'beginner':
      return 'początkujący';
    case 'intermediate':
      return 'średniozaawansowany';
    case 'advanced':
      return 'zaawansowany';
    default:
      return 'nieokreślony';
  }
}

export function translateStatus(status) {
  switch (status) {
    case 'scheduled':
      return 'zaplanowana';
    case 'cancelled':
      return 'odwołana';
    case 'completed':
      return 'zakończona';
    default:
      return status || 'nieznany';
  }
}

export function translateUnavailableReason(reason) {
  switch (reason) {
    case 'Selected time is outside available time slots':
      return 'Wybrana godzina znajduje się poza godzinami dostępności siłowni';
    case 'Equipment is not available in selected time':
      return 'Sprzęt jest zajęty w wybranym terminie';
    case 'User already has an active reservation in selected time':
      return 'Masz już aktywną rezerwację w tym terminie';
    case 'Equipment not found':
      return 'Nie znaleziono wybranego sprzętu';
    default:
      return reason || 'Brak dostępności';
  }
}

