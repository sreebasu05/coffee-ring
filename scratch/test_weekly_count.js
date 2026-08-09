import { appState } from '../src/state/appState.js';

// Setup habit
appState.habits = [{
  id: 'habit_gym',
  name: 'Gym Workout',
  weeklyTarget: 3
}];

// Log 1: Saturday Aug 8
appState.selectedDate = '2026-08-08';
appState.logCheckIn('habit_gym', null, [], '', true);

console.log('Count after Sat tick:', appState.getWeeklyCount('habit_gym'));

// Log 2: Sunday Aug 9 (Today)
appState.selectedDate = '2026-08-09';
console.log('Count before Sun tick:', appState.getWeeklyCount('habit_gym'));

appState.logCheckIn('habit_gym', null, [], '', true);
console.log('Count after Sun tick:', appState.getWeeklyCount('habit_gym'));
