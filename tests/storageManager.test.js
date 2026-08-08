import { describe, it, expect, beforeEach } from 'vitest';
import { StorageManager } from '../src/storage/storageManager.js';

describe('StorageManager Safeguards & Persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should save a check-in and merge values safely without data corruption', () => {
    const log1 = {
      id: 'log_101',
      habitId: 'habit_1',
      date: '2026-08-09',
      value: 5,
      completed: true,
      tags: ['Health'],
      note: 'Morning workout'
    };

    StorageManager.saveCheckIn(log1);
    let checkIns = StorageManager.getCheckIns();
    expect(checkIns.length).toBe(1);
    expect(checkIns[0].value).toBe(5);

    // Save updated tag without overwriting value to null
    const log2 = {
      id: 'log_101',
      habitId: 'habit_1',
      date: '2026-08-09',
      tags: ['Health', 'Gym']
    };

    StorageManager.saveCheckIn(log2);
    checkIns = StorageManager.getCheckIns();
    expect(checkIns.length).toBe(1);
    expect(checkIns[0].value).toBe(5); // Preserved!
    expect(checkIns[0].tags).toEqual(['Health', 'Gym']);
  });

  it('should remove check-in cleanly when removeCheckIn is called', () => {
    const log = {
      id: 'log_102',
      habitId: 'habit_2',
      date: '2026-08-09',
      value: 1,
      completed: true
    };

    StorageManager.saveCheckIn(log);
    expect(StorageManager.getCheckIns().length).toBe(1);

    StorageManager.removeCheckIn('habit_2', '2026-08-09');
    expect(StorageManager.getCheckIns().length).toBe(0);
  });
});
