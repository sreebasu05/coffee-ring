import { describe, it, expect } from 'vitest';
import { appState } from '../src/state/appState.js';

describe('Weekly Count Recovery Verification', () => {
  it('should compute current week count for legacy check-ins correctly when dashboardWeekOffset is 0', () => {
    localStorage.clear();
    appState.dashboardWeekOffset = 0;
    
    // Set selectedDate to today
    const todayStr = appState.formatDate(new Date());
    appState.selectedDate = todayStr;

    // Add 2 check-ins for the current week
    appState.checkIns = [
      { id: 'log_1', habitId: 'habit_gym', date: todayStr, completed: true }
    ];
    appState.habits = [{
      id: 'habit_gym',
      name: 'Gym Workout',
      weeklyTarget: 3
    }];

    expect(appState.getWeeklyCount('habit_gym')).toBe(1);
  });
});
