import { dateToInputValue } from './formatters';

export const MONTH_NAMES = [
  'Styczeń',
  'Luty',
  'Marzec',
  'Kwiecień',
  'Maj',
  'Czerwiec',
  'Lipiec',
  'Sierpień',
  'Wrzesień',
  'Październik',
  'Listopad',
  'Grudzień',
];

export const WEEK_DAYS = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd'];

export function buildLocalDateTime(sessionDate, time) {
  const datePart = String(sessionDate).slice(0, 10);
  return new Date(`${datePart}T${time}`);
}

export function getCalendarDays(year, month) {
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const firstWeekDay = (firstDayOfMonth.getDay() + 6) % 7;
  const days = [];

  for (let i = 0; i < firstWeekDay; i += 1) {
    days.push(null);
  }

  for (let day = 1; day <= lastDayOfMonth.getDate(); day += 1) {
    days.push(new Date(year, month, day));
  }

  return days;
}

export function buildTimeOptions() {
  const options = [];

  for (let hour = 8; hour <= 21; hour += 1) {
    for (const minute of [0, 15, 30, 45]) {
      options.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
    }
  }

  return options;
}

export function getDefaultReservationDateTime() {
  const now = new Date();
  const next = new Date(now);

  next.setSeconds(0);
  next.setMilliseconds(0);

  const roundedMinutes = Math.ceil(next.getMinutes() / 15) * 15;

  if (roundedMinutes === 60) {
    next.setHours(next.getHours() + 1);
    next.setMinutes(0);
  } else {
    next.setMinutes(roundedMinutes);
  }

  const hour = next.getHours();
  const minute = next.getMinutes();

  if (hour < 8) {
    next.setHours(8);
    next.setMinutes(0);

    return {
      sessionDate: dateToInputValue(next),
      startTime: '08:00',
    };
  }

  if (hour > 21 || (hour === 21 && minute > 45)) {
    next.setDate(next.getDate() + 1);
    next.setHours(8);
    next.setMinutes(0);

    return {
      sessionDate: dateToInputValue(next),
      startTime: '08:00',
    };
  }

  return {
    sessionDate: dateToInputValue(next),
    startTime: `${String(next.getHours()).padStart(2, '0')}:${String(next.getMinutes()).padStart(2, '0')}`,
  };
}
