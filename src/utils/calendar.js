// utils/calendar.js

// Your custom calendar periods
export const calendarPeriods = {
  // 2024-2025 Periods
  '2025-january': {
    id: '2025-january',
    name: 'January 2025',
    month: 'january',
    year: 2025,
    startDate: '2024-12-14',
    endDate: '2025-01-13',
    days: 31
  },
  '2025-february': {
    id: '2025-february',
    name: 'February 2025',
    month: 'february',
    year: 2025,
    startDate: '2025-01-14',
    endDate: '2025-02-12',
    days: 30
  },
  '2025-march': {
    id: '2025-march',
    name: 'March 2025',
    month: 'march',
    year: 2025,
    startDate: '2025-02-13',
    endDate: '2025-03-14',
    days: 30
  },
  '2025-april': {
    id: '2025-april',
    name: 'April 2025',
    month: 'april',
    year: 2025,
    startDate: '2025-03-14',
    endDate: '2025-04-13',
    days: 31
  },
  '2025-may': {
    id: '2025-may',
    name: 'May 2025',
    month: 'may',
    year: 2025,
    startDate: '2025-04-14',
    endDate: '2025-05-13',
    days: 30
  },
  '2025-june': {
    id: '2025-june',
    name: 'June 2025',
    month: 'june',
    year: 2025,
    startDate: '2025-05-14',
    endDate: '2025-06-12',
    days: 30
  },
  '2025-july': {
    id: '2025-july',
    name: 'July 2025',
    month: 'july',
    year: 2025,
    startDate: '2025-06-13',
    endDate: '2025-07-12',
    days: 30
  },
  '2025-august': {
    id: '2025-august',
    name: 'August 2025',
    month: 'august',
    year: 2025,
    startDate: '2025-07-13',
    endDate: '2025-08-11',
    days: 30
  },
  '2025-september': {
    id: '2025-september',
    name: 'September 2025',
    month: 'september',
    year: 2025,
    startDate: '2025-08-12',
    endDate: '2025-09-13',
    days: 33
  },
  '2025-october': {
    id: '2025-october',
    name: 'October 2025',
    month: 'october',
    year: 2025,
    startDate: '2025-09-14',
    endDate: '2025-10-15',
    days: 32
  },
  '2025-november': {
    id: '2025-november',
    name: 'November 2025',
    month: 'november',
    year: 2025,
    startDate: '2025-10-16',
    endDate: '2025-11-14',
    days: 30
  },
  '2025-december': {
    id: '2025-december',
    name: 'December 2025',
    month: 'december',
    year: 2025,
    startDate: '2025-11-15',
    endDate: '2025-12-14',
    days: 30
  },
  // 2026 Periods (continuing the pattern)
  '2026-january': {
    id: '2026-january',
    name: 'January 2026',
    month: 'january',
    year: 2026,
    startDate: '2025-12-15',
    endDate: '2026-01-13',
    days: 30
  },
  '2026-february': {
    id: '2026-february',
    name: 'February 2026',
    month: 'february',
    year: 2026,
    startDate: '2026-01-14',
    endDate: '2026-02-12',
    days: 30
  },
  '2026-march': {
    id: '2026-march',
    name: 'March 2026',
    month: 'march',
    year: 2026,
    startDate: '2026-02-13',
    endDate: '2026-03-14',
    days: 30
  },
  '2026-april': {
    id: '2026-april',
    name: 'April 2026',
    month: 'april',
    year: 2026,
    startDate: '2026-03-14',
    endDate: '2026-04-13',
    days: 31
  },
  '2026-may': {
    id: '2026-may',
    name: 'May 2026',
    month: 'may',
    year: 2026,
    startDate: '2026-04-14',
    endDate: '2026-05-13',
    days: 30
  },
  '2026-june': {
    id: '2026-june',
    name: 'June 2026',
    month: 'june',
    year: 2026,
    startDate: '2026-05-14',
    endDate: '2026-06-12',
    days: 30
  },
  '2026-july': {
    id: '2026-july',
    name: 'July 2026',
    month: 'july',
    year: 2026,
    startDate: '2026-06-13',
    endDate: '2026-07-12',
    days: 30
  },
  '2026-august': {
    id: '2026-august',
    name: 'August 2026',
    month: 'august',
    year: 2026,
    startDate: '2026-07-13',
    endDate: '2026-08-11',
    days: 30
  },
  '2026-september': {
    id: '2026-september',
    name: 'September 2026',
    month: 'september',
    year: 2026,
    startDate: '2026-08-12',
    endDate: '2026-09-13',
    days: 33
  },
  '2026-october': {
    id: '2026-october',
    name: 'October 2026',
    month: 'october',
    year: 2026,
    startDate: '2026-09-14',
    endDate: '2026-10-15',
    days: 32
  },
  '2026-november': {
    id: '2026-november',
    name: 'November 2026',
    month: 'november',
    year: 2026,
    startDate: '2026-10-16',
    endDate: '2026-11-14',
    days: 30
  },
  '2026-december': {
    id: '2026-december',
    name: 'December 2026',
    month: 'december',
    year: 2026,
    startDate: '2026-11-15',
    endDate: '2026-12-14',
    days: 30
  }
};

// Get all available periods
export const getAllPeriods = () => {
  return Object.values(calendarPeriods);
};

// Get periods for a specific year
export const getPeriodsByYear = (year) => {
  return Object.values(calendarPeriods).filter(period => period.year === year);
};

// Get period by ID
export const getPeriodById = (periodId) => {
  return calendarPeriods[periodId];
};

// Calculate pro-rated volume based on days
export const calculateProRatedVolume = (totalVolume, totalDays, actualDays) => {
  if (!totalVolume || !totalDays) return 0;
  return (totalVolume / totalDays) * actualDays;
};

// Find which period a date belongs to
export const getPeriodForDate = (date) => {
  const dateObj = new Date(date);
  const periods = getAllPeriods();
  
  for (const period of periods) {
    const start = new Date(period.startDate);
    const end = new Date(period.endDate);
    if (dateObj >= start && dateObj <= end) {
      return period;
    }
  }
  return null;
};