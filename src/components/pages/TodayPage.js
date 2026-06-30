import { Greeting } from '../ui/Greeting.js';
import { HabitCard } from '../ui/HabitCard.js';

export const TodayPage = {
  render(state) {
    const greetingHtml = Greeting.render(state);
    
    // List active habits (exclude paused)
    const activeHabits = state.habits.filter(h => !h.paused);
    const habitsHtml = activeHabits.length > 0 
      ? activeHabits.map(habit => HabitCard.render(habit, state)).join('')
      : `
        <div class="flex flex-col items-center justify-center py-12 text-center border border-dashed border-slate-200 rounded-2xl p-6 bg-white shadow-sm animate-fade-in">
          <span class="w-12 h-12 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 mb-3">
            <i data-lucide="check-circle" class="w-6 h-6"></i>
          </span>
          <h3 class="font-bold text-slate-700 text-sm">No Habits Tracked Yet</h3>
          <p class="text-xs text-slate-400 max-w-[200px] mt-1">Tap the plus button below to setup your very first habit.</p>
        </div>
      `;

    return `
      <div id="today-page-view" class="flex flex-col min-h-full">
        ${greetingHtml}
        
        <div class="flex flex-col gap-4 flex-grow">
          <div class="flex justify-between items-center mb-1">
            <h2 class="text-label-muted">Active Habits</h2>
            <span class="text-[10px] text-slate-400 italic">Tap card to log values/notes</span>
          </div>
          ${habitsHtml}
        </div>

        <!-- Dynamic database seed reset option -->
        <div class="mt-12 mb-6 text-center">
          <button 
            id="reset-db-btn" 
            class="text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-wider bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3.5 py-2 rounded-xl"
          >
            Reset coffee ring
          </button>
        </div>
      </div>
    `;
  },

  bindEvents(state, onNavigateToInsights) {
    Greeting.bindEvents(state);
    HabitCard.bindEvents(state, onNavigateToInsights);

    // Bind Database reset click trigger
    const resetBtn = document.getElementById('reset-db-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm("Are you sure you want to reset all data? This will permanently erase all habits, history, and profile settings, returning you to the setup screen.")) {
          state.resetData();
        }
      });
    }
  }
};
