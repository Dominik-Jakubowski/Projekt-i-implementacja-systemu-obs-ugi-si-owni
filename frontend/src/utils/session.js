import { buildLocalDateTime } from './calendar';

export function secondsBetween(from, to) {
  return Math.ceil((to.getTime() - from.getTime()) / 1000);
}

export function getSessionState(session, now) {
  if (session?.Status === 'cancelled') {
    return {
      status: 'cancelled',
      label: 'Sesja została odwołana',
    };
  }

  if (!session || !session.items || session.items.length === 0) {
    return {
      status: 'empty',
      label: 'Brak ćwiczeń w sesji',
    };
  }

  const sessionStart = buildLocalDateTime(session.SessionDate, session.StartTime);
  const sessionEnd = buildLocalDateTime(session.SessionDate, session.EndTime);

  if (now < sessionStart) {
    return {
      status: 'waiting',
      label: 'Trening jeszcze się nie rozpoczął',
      sessionStart,
    };
  }

  if (now >= sessionEnd) {
    return {
      status: 'finished',
      label: 'Czas rezerwacji minął',
      sessionEnd,
    };
  }

  for (const item of session.items) {
    const itemStart = buildLocalDateTime(session.SessionDate, item.PlannedStartTime);
    const itemEnd = buildLocalDateTime(session.SessionDate, item.PlannedEndTime);

    if (now >= itemStart && now < itemEnd) {
      const elapsedSeconds = Math.floor((now.getTime() - itemStart.getTime()) / 1000);
      const remainingSeconds = secondsBetween(now, itemEnd);

      return {
        status: 'active',
        label: 'Aktywne ćwiczenie',
        item,
        elapsedSeconds,
        remainingSeconds,
        itemStart,
        itemEnd,
      };
    }
  }

  return {
    status: 'active',
    label: 'Trening w toku',
  };
}

export function getExercisePhase(item, elapsedSeconds) {
  if (!item) {
    return null;
  }

  if (item.ExerciseType === 'cardio') {
    const exerciseSeconds = Number(item.DurationSeconds || item.StoredDurationSeconds || 0);
    const restSeconds = Number(item.EffectiveRestSeconds || 0);

    if (elapsedSeconds < exerciseSeconds) {
      return {
        name: 'Ćwiczenie cardio',
        detail: 'Wykonuj ćwiczenie zgodnie z planem.',
        remainingSeconds: exerciseSeconds - elapsedSeconds,
      };
    }

    return {
      name: 'Przerwa / przejście',
      detail: 'Zakończ ćwiczenie i przygotuj się do kolejnego stanowiska.',
      remainingSeconds: Math.max(0, exerciseSeconds + restSeconds - elapsedSeconds),
    };
  }

  const sets = Number(item.Sets || 1);
  const seriesSeconds = Number(item.SeriesDurationSeconds || 60);
  const restSeconds = Number(item.EffectiveRestSeconds || item.RestSeconds || 0);
  const cycleSeconds = seriesSeconds + restSeconds;

  if (cycleSeconds <= 0) {
    return null;
  }

  const currentSetIndex = Math.floor(elapsedSeconds / cycleSeconds);
  const currentSet = Math.min(currentSetIndex + 1, sets);
  const elapsedInCycle = elapsedSeconds % cycleSeconds;

  if (currentSetIndex >= sets) {
    return {
      name: 'Zakończ ćwiczenie',
      detail: 'Czas przeznaczony na to ćwiczenie dobiega końca.',
      remainingSeconds: 0,
    };
  }

  if (elapsedInCycle < seriesSeconds) {
    return {
      name: `Seria ${currentSet} z ${sets}`,
      detail: `Wykonaj ${item.Repetitions || ''} powtórzeń.`,
      remainingSeconds: seriesSeconds - elapsedInCycle,
    };
  }

  return {
    name: `Przerwa po serii ${currentSet}`,
    detail: 'Odpocznij albo przygotuj się do następnej serii.',
    remainingSeconds: cycleSeconds - elapsedInCycle,
  };
}
