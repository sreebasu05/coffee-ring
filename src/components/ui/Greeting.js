import { APP_CONFIG } from '../../config/appConfig.js';

export const Greeting = {
  render(state) {
    const user = state.user?.name || "Sree";
    const hour = new Date().getHours();
    let greet = "Hello";

    if (hour >= APP_CONFIG.greetingTimes.morning && hour < APP_CONFIG.greetingTimes.afternoon) {
      greet = "Good morning,";
    } else if (hour >= APP_CONFIG.greetingTimes.afternoon && hour < APP_CONFIG.greetingTimes.evening) {
      greet = "Good afternoon,";
    } else {
      greet = "Good evening,";
    }

    // Generate date options for the last 7 days dropdown selection
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      dates.push(d);
    }

    const formatDateKey = (dateObj) => {
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    let activeDateLabel = "TODAY";
    const activeDateObj = new Date(state.selectedDate);
    
    if (state.selectedDate === formatDateKey(today)) {
      activeDateLabel = "TODAY";
    } else {
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      if (state.selectedDate === formatDateKey(yesterday)) {
        activeDateLabel = "YESTERDAY";
      } else {
        activeDateLabel = activeDateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();
      }
    }

    const dropdownOptions = dates.map(date => {
      const dateKey = formatDateKey(date);
      const isSelected = state.selectedDate === dateKey;
      
      let label = "";
      if (dateKey === formatDateKey(today)) {
        label = "Today";
      } else {
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        if (dateKey === formatDateKey(yesterday)) {
          label = "Yesterday";
        } else {
          label = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        }
      }

      return `
        <button 
          data-date-select="${dateKey}"
          class="w-full text-left px-4 py-3 text-xs ${
            isSelected ? 'text-accentViolet font-bold bg-slate-100' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          } transition-colors border-b border-slate-100 last:border-0"
        >
          ${label}
        </button>
      `;
    }).join('');

    const totalHabits = state.habits.length;
    const completedToday = state.habits.filter(h => {
      const log = state.getLogForHabit(h.id);
      return log !== null;
    }).length;

    const progressPercentage = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;

    return `
      <div class="mb-8 select-none relative">
        
        <!-- Dropdown Date Trigger using custom utility -->
        <div class="relative inline-block z-30">
          <button 
            id="date-dropdown-trigger" 
            class="flex items-center gap-1.5 text-label-muted hover:text-slate-800 transition-colors"
          >
            <span>${activeDateLabel}</span>
            <i data-lucide="chevron-down" class="w-3 h-3"></i>
          </button>
          
          <div 
            id="header-date-dropdown" 
            class="hidden absolute left-0 mt-2 bg-cardBg border border-slate-200/80 rounded-xl shadow-xl overflow-hidden w-40 z-50"
          >
            ${dropdownOptions}
          </div>
        </div>
        
        <!-- Greeting using custom header utilities -->
        <div class="flex justify-between items-end mt-3">
          <div>
            <h1 class="text-header-bold">${greet}</h1>
            <h2 class="text-3xl font-extrabold tracking-tight text-slate-800 mt-1.5">${user}</h2>
          </div>
          
          <!-- Numeric Ratio Indicator -->
          <div class="text-right flex flex-col items-end">
            <div class="text-3xl font-extrabold text-slate-900 leading-none tracking-tight">
              ${completedToday}<span class="text-lg font-bold text-slate-400">/${totalHabits}</span>
            </div>
            <span class="text-label-muted mt-1">done today</span>
          </div>
        </div>

        <!-- Progress Bar Section -->
        ${totalHabits > 0 ? `
          <div class="mt-6">
            <div class="w-full bg-slate-200 rounded-full h-2 overflow-hidden p-[1px]">
              <div class="bg-slate-900 h-full rounded-full transition-all duration-500 ease-out" style="width: ${progressPercentage}%"></div>
            </div>
            <p class="text-xs text-text-secondary mt-2 font-medium">${progressPercentage}% complete</p>
          </div>
        ` : ''}
      </div>
    `;
  },

  bindEvents(state) {
    const trigger = document.getElementById('date-dropdown-trigger');
    const dropdown = document.getElementById('header-date-dropdown');
    if (!trigger || !dropdown) return;

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('hidden');
      if (window.lucide) {
        window.lucide.createIcons();
      }
    });

    document.addEventListener('click', (e) => {
      if (!trigger.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.add('hidden');
      }
    });

    dropdown.querySelectorAll('[data-date-select]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const dateKey = e.currentTarget.dataset.dateSelect;
        state.setSelectedDate(dateKey);
        dropdown.classList.add('hidden');
      });
    });
  }
};
