import { describe, it, expect, beforeEach } from 'vitest';
import { appState } from '../src/state/appState.js';

describe('AppState Core Business Logic & Rules', () => {
  const getRelativeDateStr = (daysOffset) => {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    return appState.formatDate(d);
  };

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('coffeering_check_ins', JSON.stringify([]));
    appState.checkIns = [];
    appState.dashboardWeekOffset = 0;
    appState.habits = [
      {
        id: 'h1_water',
        name: 'Drink Water',
        type: 'number',
        category: 'health',
        weeklyTarget: 5,
        minGoal: 2,
        maxGoal: 4,
        unit: 'liters',
        days: null,
        createdAt: '2026-07-01T00:00:00.000Z'
      },
      {
        id: 'h2_gym',
        name: 'Gym Workout',
        type: 'checkbox',
        category: 'health',
        weeklyTarget: 3,
        days: ['Mon', 'Wed', 'Fri'],
        createdAt: '2026-07-01T00:00:00.000Z'
      }
    ];
    appState.selectedDate = getRelativeDateStr(0);
  });

  describe('1. Decoupled Ticking & Numeric Value Logging', () => {
    it('should log a numeric metric value without auto-ticking the habit', () => {
      appState.logCheckIn('h1_water', 3, [], '', false);

      const log = appState.getLogForHabit('h1_water');
      expect(log).not.toBeNull();
      expect(log.value).toBe(3);
      expect(log.completed).toBe(false);

      expect(appState.isHabitCompleted('h1_water')).toBe(false);
    });

    it('should mark habit as completed when explicitly completed = true', () => {
      appState.logCheckIn('h1_water', 3, ['Hydration'], 'Drank 3L', true);

      const log = appState.getLogForHabit('h1_water');
      expect(log).not.toBeNull();
      expect(log.value).toBe(3);
      expect(log.completed).toBe(true);
      expect(appState.isHabitCompleted('h1_water')).toBe(true);
    });

    it('should preserve completion status when clearing numeric value', () => {
      appState.logCheckIn('h1_water', 3, [], '', true);
      expect(appState.isHabitCompleted('h1_water')).toBe(true);

      appState.logCheckIn('h1_water', null, [], '', true);
      const log = appState.getLogForHabit('h1_water');
      expect(log.value).toBeNull();
      expect(log.completed).toBe(true);
      expect(appState.isHabitCompleted('h1_water')).toBe(true);
    });

    it('should remove check-in record when unticked and no value/tags/note exist', () => {
      appState.logCheckIn('h1_water', null, [], '', false);
      expect(appState.getLogForHabit('h1_water')).toBeNull();
    });
  });

  describe('2. Weekly Target Progress & Completion Rates', () => {
    it('should count only completed (ticked) logs for weekly targets', () => {
      appState.selectedDate = getRelativeDateStr(0);

      appState.logCheckIn('h1_water', 3, [], '', false);
      expect(appState.getWeeklyCount('h1_water')).toBe(0);

      appState.logCheckIn('h1_water', 3, [], '', true);
      expect(appState.getWeeklyCount('h1_water')).toBe(1);
    });
  });

  describe('3. Value Trend Calculation (getNumberStats)', () => {
    it('should calculate Trending Up when 7-day average improves over baseline', () => {
      appState.selectedDate = getRelativeDateStr(-10);
      appState.logCheckIn('h1_water', 2, [], '', false);

      appState.selectedDate = getRelativeDateStr(-2);
      appState.logCheckIn('h1_water', 5, [], '', false);

      const stats = appState.getNumberStats('h1_water');
      expect(stats.trend).toBe('Trending Up');
      expect(stats.avg30).toBeGreaterThan(0);
    });

    it('should calculate Trending Down when 7-day average drops by > 5%', () => {
      appState.selectedDate = getRelativeDateStr(-10);
      appState.logCheckIn('h1_water', 10, [], '', true);

      appState.selectedDate = getRelativeDateStr(-2);
      appState.logCheckIn('h1_water', 2, [], '', true);

      const stats = appState.getNumberStats('h1_water');
      expect(stats.trend).toBe('Trending Down');
    });
  });

  describe('4. Daily Streak Rules (Strict Calendar Checking)', () => {
    it('should calculate current daily streak correctly', () => {
      appState.selectedDate = getRelativeDateStr(0);
      appState.logCheckIn('h2_gym', 1, [], '', true);

      appState.selectedDate = getRelativeDateStr(-1);
      appState.logCheckIn('h2_gym', 1, [], '', true);

      appState.selectedDate = getRelativeDateStr(-2);
      appState.logCheckIn('h2_gym', 1, [], '', true);

      expect(appState.getDailyStreak('h2_gym')).toBe(3);
    });

    it('should break daily streak if any calendar day is missed', () => {
      appState.selectedDate = getRelativeDateStr(0);
      appState.logCheckIn('h2_gym', 1, [], '', true);

      appState.selectedDate = getRelativeDateStr(-2);
      appState.logCheckIn('h2_gym', 1, [], '', true);

      expect(appState.getDailyStreak('h2_gym')).toBe(1);
    });
  });
});
