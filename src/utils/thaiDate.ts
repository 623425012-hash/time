// Thai Date Formatting Utilities

export const THAI_MONTHS_FULL = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
];

export const THAI_MONTHS_SHORT = [
  'ม.ค.',
  'ก.พ.',
  'มี.ค.',
  'เม.ย.',
  'พ.ค.',
  'มิ.ย.',
  'ก.ค.',
  'ส.ค.',
  'ก.ย.',
  'ต.ค.',
  'พ.ย.',
  'ธ.ค.',
];

export const THAI_DAYS_FULL = [
  'วันอาทิตย์',
  'วันจันทร์',
  'วันอังคาร',
  'วันพุธ',
  'วันพฤหัสบดี',
  'วันศุกร์',
  'วันเสาร์',
];

export const THAI_DAYS_SHORT = [
  'อา.',
  'จ.',
  'อ.',
  'พ.',
  'พฤ.',
  'ศ.',
  'ส.',
];

/**
 * Format a YYYY-MM-DD string into Thai date representation
 * Example output:
 * - default: "15 ส.ค. 69" (if format='short')
 * - "15 สิงหาคม 2569" (if format='medium')
 * - "วันเสาร์ที่ 15 สิงหาคม 2569" (if format='full')
 * - "เสาร์ 15 ส.ค. 2569" (if format='short-day')
 */
export function formatThaiDate(
  dateInput?: string | Date | null,
  options?: {
    format?: 'short' | 'medium' | 'full' | 'short-day' | 'short-year-only';
    includeDay?: boolean;
    shortYear?: boolean;
  }
): string {
  if (!dateInput) return '-';

  try {
    let year: number;
    let month: number;
    let day: number;
    let dayOfWeek: number;

    if (typeof dateInput === 'string') {
      const parts = dateInput.split('T')[0].split('-');
      if (parts.length < 3) return dateInput;
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      day = parseInt(parts[2], 10);
      const d = new Date(year, month - 1, day);
      dayOfWeek = d.getDay();
    } else {
      year = dateInput.getFullYear();
      month = dateInput.getMonth() + 1;
      day = dateInput.getDate();
      dayOfWeek = dateInput.getDay();
    }

    if (isNaN(year) || isNaN(month) || isNaN(day)) return String(dateInput);

    const thaiYearFull = year + 543;
    const thaiYearShort = String(thaiYearFull).slice(-2);
    const monthIndex = Math.max(0, Math.min(11, month - 1));

    const fmt = options?.format || 'short';

    switch (fmt) {
      case 'short':
        // e.g. "15 ส.ค. 69" or "15 ส.ค. 2569"
        return `${day} ${THAI_MONTHS_SHORT[monthIndex]} ${options?.shortYear === false ? thaiYearFull : thaiYearShort}`;

      case 'short-day':
        // e.g. "ส. 15 ส.ค. 69"
        return `${THAI_DAYS_SHORT[dayOfWeek]} ${day} ${THAI_MONTHS_SHORT[monthIndex]} ${thaiYearShort}`;

      case 'medium':
        // e.g. "15 สิงหาคม 2569"
        return `${day} ${THAI_MONTHS_FULL[monthIndex]} ${thaiYearFull}`;

      case 'full':
        // e.g. "วันเสาร์ที่ 15 สิงหาคม 2569"
        return `${THAI_DAYS_FULL[dayOfWeek]}ที่ ${day} ${THAI_MONTHS_FULL[monthIndex]} ${thaiYearFull}`;

      case 'short-year-only':
        return `${day} ${THAI_MONTHS_SHORT[monthIndex]} ${thaiYearShort}`;

      default:
        return `${day} ${THAI_MONTHS_SHORT[monthIndex]} ${thaiYearShort}`;
    }
  } catch {
    return String(dateInput);
  }
}

/**
 * Format a date range in Thai
 * e.g. "15 - 18 ส.ค. 69" or "15 ส.ค. - 2 ก.ย. 69"
 */
export function formatThaiDateRange(
  startDateStr?: string | null,
  endDateStr?: string | null,
  options?: { shortYear?: boolean }
): string {
  if (!startDateStr && !endDateStr) return '-';
  if (!startDateStr) return formatThaiDate(endDateStr, { format: 'short', shortYear: options?.shortYear ?? true });
  if (!endDateStr || startDateStr === endDateStr) {
    return formatThaiDate(startDateStr, { format: 'short', shortYear: options?.shortYear ?? true });
  }

  try {
    const [sY, sM, sD] = startDateStr.split('-').map(Number);
    const [eY, eM, eD] = endDateStr.split('-').map(Number);
    const sThaiY = sY + 543;
    const eThaiY = eY + 543;
    const sThaiYShort = String(sThaiY).slice(-2);
    const eThaiYShort = String(eThaiY).slice(-2);

    const yearSuffix = options?.shortYear === false ? eThaiY : eThaiYShort;

    if (sY === eY && sM === eM) {
      // Same month & year: "15 - 18 ส.ค. 69"
      return `${sD} - ${eD} ${THAI_MONTHS_SHORT[sM - 1]} ${yearSuffix}`;
    } else if (sY === eY) {
      // Same year: "28 ส.ค. - 2 ก.ย. 69"
      return `${sD} ${THAI_MONTHS_SHORT[sM - 1]} - ${eD} ${THAI_MONTHS_SHORT[eM - 1]} ${yearSuffix}`;
    } else {
      // Different years: "28 ธ.ค. 68 - 3 ม.ค. 69"
      const sYearSuffix = options?.shortYear === false ? sThaiY : sThaiYShort;
      return `${sD} ${THAI_MONTHS_SHORT[sM - 1]} ${sYearSuffix} - ${eD} ${THAI_MONTHS_SHORT[eM - 1]} ${yearSuffix}`;
    }
  } catch {
    return `${startDateStr} - ${endDateStr}`;
  }
}

/**
 * Get Thai day name for a date
 */
export function getThaiDayOfWeek(dateStr?: string | null, short = false): string {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('T')[0].split('-');
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    return short ? THAI_DAYS_SHORT[d.getDay()] : THAI_DAYS_FULL[d.getDay()];
  } catch {
    return '';
  }
}

export const formatThaiDayOfWeek = getThaiDayOfWeek;

/**
 * Returns current Date and formatted strings in Bangkok (UTC+7) timezone
 */
export function getBangkokDateTime(): {
  now: Date;
  year: number;
  month: string;
  day: string;
  dateStr: string;
  hours: string;
  minutes: string;
  timeStr: string;
  fullDateTimeStr: string;
  timestamp: number;
} {
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

    return {
      now: d,
      year,
      month,
      day,
      dateStr,
      hours,
      minutes,
      timeStr,
      fullDateTimeStr: `${dateStr} ${timeStr}:${seconds}`,
      timestamp: d.getTime(),
    };
  } catch {
    const bkk = new Date(d.getTime() + 7 * 60 * 60 * 1000);
    const year = bkk.getUTCFullYear();
    const month = String(bkk.getUTCMonth() + 1).padStart(2, '0');
    const day = String(bkk.getUTCDate()).padStart(2, '0');
    const hours = String(bkk.getUTCHours()).padStart(2, '0');
    const minutes = String(bkk.getUTCMinutes()).padStart(2, '0');
    const seconds = String(bkk.getUTCSeconds()).padStart(2, '0');
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
      timeStr,
      fullDateTimeStr: `${dateStr} ${timeStr}:${seconds}`,
      timestamp: d.getTime(),
    };
  }
}

