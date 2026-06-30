import { Greeting } from '../ui/Greeting.js';
import { HabitCard } from '../ui/HabitCard.js';

export const TodayPage = {
  render(state) {
    const greetingHtml = Greeting.render(state);
    
    // Detect today's weekday
    const today = new Date();
    const dayIdx = today.getDay();
    const abbrs = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const todayAbbr = abbrs[dayIdx];

    // List active habits (exclude paused)
    const activeHabits = state.habits.filter(h => !h.paused);
    
    // Group habits
    const focusHabits = activeHabits.filter(h => !h.days || h.days.length === 0 || h.days.includes(todayAbbr));
    const extraHabits = activeHabits.filter(h => h.days && h.days.length > 0 && !h.days.includes(todayAbbr));

    const focusHabitsHtml = focusHabits.length > 0
      ? focusHabits.map(habit => HabitCard.render(habit, state)).join('')
      : `
        <div class="flex flex-col items-center justify-center py-10 text-center border border-dashed border-slate-200 rounded-2xl p-6 bg-white shadow-sm animate-fade-in">
          <span class="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 mb-2.5">
            <i data-lucide="check" class="w-5 h-5"></i>
          </span>
          <h3 class="font-bold text-slate-700 text-xs">All Caught Up</h3>
          <p class="text-[10px] text-slate-400 max-w-[200px] mt-0.5">No habits scheduled for today.</p>
        </div>
      `;

    const extrasHtml = extraHabits.length > 0
      ? `
        <div class="flex flex-col gap-4 mt-4 border-t border-slate-150/40 pt-5 animate-fade-in">
          <div class="flex justify-between items-center mb-1">
            <h2 class="text-label-muted">Extras / Other Days</h2>
            <span class="text-[10px] text-slate-400 italic">Off-day logs count towards weekly goals</span>
          </div>
          <div class="flex flex-col gap-3">
            ${extraHabits.map(habit => HabitCard.render(habit, state)).join('')}
          </div>
        </div>
      `
      : '';

    return `
      <div id="today-page-view" class="flex flex-col min-h-full">
        ${greetingHtml}
        
        <div class="flex flex-col gap-4 flex-grow">
          <div class="flex justify-between items-center mb-1">
            <h2 class="text-label-muted">Today's Focus</h2>
            <span class="text-[10px] text-slate-400 italic">Tap card to log progress</span>
          </div>
          <div class="flex flex-col gap-3">
            ${focusHabitsHtml}
          </div>
          ${extrasHtml}
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
