/**
 * Bangkok (Thailand - UTC+7) Time Utilities for Server
 */

export interface BangkokTimeInfo {
  now: Date;
  year: number;
  month: string; // '01'-'12'
  day: string; // '01'-'31'
  dateStr: string; // 'YYYY-MM-DD'
  hours: string; // '00'-'23'
  minutes: string; // '00'-'59'
  seconds: string; // '00'-'59'
  timeStr: string; // 'HH:mm'
  fullDateTimeStr: string; // 'YYYY-MM-DD HH:mm:ss'
  timestamp: number;
}

export function getBangkokNow(): BangkokTimeInfo {
  const d = new Date();
  
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    const parts = formatter.formatToParts(d);
    const getPart = (type: string) => parts.find((p) => p.type === type)?.value || '00';

    const year = parseInt(getPart('year'), 10) || d.getUTCFullYear();
    const month = getPart('month').padStart(2, '0');
    const day = getPart('day').padStart(2, '0');
    let hours = getPart('hour').padStart(2, '0');
    if (hours === '24') hours = '00';
    const minutes = getPart('minute').padStart(2, '0');
    const seconds = getPart('second').padStart(2, '0');

    const dateStr = `${year}-${month}-${day}`;
    const timeStr = `${hours}:${minutes}`;
    const fullDateTimeStr = `${dateStr} ${timeStr}:${seconds}`;

    return {
      now: d,
      year,
      month,
      day,
      dateStr,
      hours,
      minutes,
      seconds,
      timeStr,
      fullDateTimeStr,
      timestamp: d.getTime(),
    };
  } catch (err) {
    // Fallback: manual UTC+7 offset
    const bangkokTime = new Date(d.getTime() + 7 * 60 * 60 * 1000);
    const year = bangkokTime.getUTCFullYear();
    const month = String(bangkokTime.getUTCMonth() + 1).padStart(2, '0');
    const day = String(bangkokTime.getUTCDate()).padStart(2, '0');
    const hours = String(bangkokTime.getUTCHours()).padStart(2, '0');
    const minutes = String(bangkokTime.getUTCMinutes()).padStart(2, '0');
    const seconds = String(bangkokTime.getUTCSeconds()).padStart(2, '0');

    const dateStr = `${year}-${month}-${day}`;
    const timeStr = `${hours}:${minutes}`;

    return {
      now: d,
      year,
      month,
      day,
      dateStr,
      hours,
      minutes,
      seconds,
      timeStr,
      fullDateTimeStr: `${dateStr} ${timeStr}:${seconds}`,
      timestamp: d.getTime(),
    };
  }
}

/**
 * Calculates epoch timestamp for a given Bangkok date (YYYY-MM-DD) and time (HH:mm)
 */
export function getBangkokTimestamp(dateStr: string, timeStr = '00:00'): number {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);
    const formatted = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hours || 0).padStart(2, '0')}:${String(minutes || 0).padStart(2, '0')}:00+07:00`;
    return new Date(formatted).getTime();
  } catch {
    return 0;
  }
}
