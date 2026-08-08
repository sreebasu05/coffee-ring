import { describe, it, expect, beforeEach } from 'vitest';
import { appState } from '../src/state/appState.js';

describe('AppState Core Business Logic & Behavioral Rules', () => {
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
        weeklyTargetHistory: [
          { date: '2026-07-01', target: 3 },
          { date: '2026-08-01', target: 5 }
        ],
        minGoal: 2,
        maxGoal: 4,
        unit: 'liters',
        days: null,
        paused: false,
        pauseHistory: [],
        createdAt: '2026-07-01T00:00:00.000Z'
      },
      {
        id: 'h2_gym',
        name: 'Gym Workout',
        type: 'checkbox',
        category: 'health',
        weeklyTarget: 3,
        days: ['Mon', 'Wed', 'Fri'],
        paused: false,
        pauseHistory: [],
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

  describe('2. Streaks Logic (Daily & Weekly Target Streaks)', () => {
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

    it('should calculate best daily streak across past days', () => {
      appState.selectedDate = getRelativeDateStr(-10);
      appState.logCheckIn('h2_gym', 1, [], '', true);

      appState.selectedDate = getRelativeDateStr(-9);
      appState.logCheckIn('h2_gym', 1, [], '', true);

      appState.selectedDate = getRelativeDateStr(-8);
      appState.logCheckIn('h2_gym', 1, [], '', true);

      appState.selectedDate = getRelativeDateStr(-7);
      appState.logCheckIn('h2_gym', 1, [], '', true);

      expect(appState.getBestDailyStreak('h2_gym')).toBeGreaterThanOrEqual(4);
    });
  });

  describe('3. Historical Weekly Targets & Pause Intervals', () => {
    it('should resolve historic weekly targets correctly from target history', () => {
      expect(appState.getWeeklyTargetForDate('h1_water', '2026-07-15')).toBe(3);
      expect(appState.getWeeklyTargetForDate('h1_water', '2026-08-05')).toBe(5);
    });

    it('should respect date pauses when checking if a date is paused', () => {
      const habit = appState.habits[0];
      habit.pauseHistory = [
        { pausedAt: '2026-08-01', resumedAt: '2026-08-05' }
      ];

      expect(appState.isDatePaused(habit, '2026-08-03')).toBe(true);
      expect(appState.isDatePaused(habit, '2026-08-08')).toBe(false);
    });
  });

  describe('4. Tags, Notes & Category Focus Breakdown', () => {
    it('should return tag frequency sorted by usage count', () => {
      appState.selectedDate = getRelativeDateStr(0);
      appState.logCheckIn('h1_water', 3, ['Hydration', 'Morning'], '', true);

      appState.selectedDate = getRelativeDateStr(-1);
      appState.logCheckIn('h1_water', 3, ['Hydration'], '', true);

      const topTags = appState.getTagFrequency('h1_water');
      expect(topTags.length).toBe(2);
      expect(topTags[0].name).toBe('Hydration');
      expect(topTags[0].count).toBe(2);
    });

    it('should return recent notes excluding empty strings', () => {
      appState.selectedDate = getRelativeDateStr(0);
      appState.logCheckIn('h1_water', 3, [], 'Felt great today', true);

      const notes = appState.getRecentNotes('h1_water');
      expect(notes.length).toBe(1);
      expect(notes[0].note).toBe('Felt great today');
    });

    it('should calculate category focus and habit rankings correctly', () => {
      const focus = appState.getCategoryFocus();
      expect(focus).not.toBeNull();
      expect(typeof focus.isLocked).toBe('boolean');

      const rankings = appState.getHabitRankings();
      expect(Array.isArray(rankings)).toBe(true);
      expect(rankings.length).toBe(2);
    });
  });
});
