import { APP_CONFIG } from '../../config/appConfig.js';

export const DashboardPage = {
  render(state) {
    const todayPct = state.getTodayCompletionRate();
    const onTrackCount = state.getWeeklyGoalProgress();
    const totalHabits = state.habits.length;
    const overallConsistency = state.getOverallConsistency();
    const catFocus = state.getCategoryFocus();
    const rankings = state.getHabitRankings();
    const dayByDay = state.getWeeklyDayByDayActivity();
    const advancedInsights = state.getAdvancedBehavioralInsights();

    // -- Time Toggle --
    const toggleHtml = `
      <div class="flex items-center justify-center bg-surface-sunken p-1 rounded-xl w-full max-w-[280px] mx-auto border border-divider">
        <button id="toggle-this-week" class="flex-1 text-xs font-bold py-1.5 rounded-lg transition-colors ${state.dashboardWeekOffset === 0 ? 'bg-surface-card shadow-sm text-text-primary' : 'text-text-secondary hover:text-text-primary'}">Trailing 4 Weeks</button>
        <button id="toggle-last-week" class="flex-1 text-xs font-bold py-1.5 rounded-lg transition-colors ${state.dashboardWeekOffset === 1 ? 'bg-surface-card shadow-sm text-text-primary' : 'text-text-secondary hover:text-text-primary'}">Last Week</button>
      </div>
    `;

    // -- Top Snapshot --
    const snapshotHtml = `
      <div class="bg-surface-card border border-divider rounded-2xl p-5 shadow-sm flex items-center justify-between gap-4">
        <div class="flex flex-col gap-1">
          <h1 class="text-xl font-bold text-text-primary">Dashboard</h1>
          <p class="text-xs text-text-secondary">Your overall habit analysis.</p>
          <div class="flex flex-col gap-0.5 mt-3 text-xs font-semibold text-text-secondary">
            <span class="flex items-center gap-1.5"><i data-lucide="check" class="w-3.5 h-3.5 text-text-primary"></i> ${todayPct}% done today</span>
            <span class="flex items-center gap-1.5"><i data-lucide="target" class="w-3.5 h-3.5 text-text-primary"></i> ${onTrackCount} of ${totalHabits} on track</span>
          </div>
        </div>

        <div class="flex flex-col items-center gap-1">
          <div class="relative w-20 h-20 flex items-center justify-center">
            <svg class="absolute w-full h-full transform -rotate-90 text-text-primary">
              <circle cx="40" cy="40" r="34" stroke="var(--border-subtle)" stroke-width="6" fill="transparent" />
              <circle cx="40" cy="40" r="34" stroke="currentColor" stroke-width="6" fill="transparent"
                stroke-dasharray="213.628" stroke-dashoffset="${213.628 - (213.628 * (overallConsistency || 0)) / 100}"
                stroke-linecap="round" class="transition-all duration-500" />
            </svg>
            <span class="text-sm font-extrabold text-text-primary">${overallConsistency}%</span>
          </div>
          <span class="text-[9px] font-bold text-text-secondary uppercase tracking-widest text-center mt-1">Overall<br/>Consistency</span>
        </div>
      </div>
    `;

    // -- Habit Focus Cards --
    let habitFocusHtml = '';
    if (rankings.length > 0) {
      const topHabit = rankings[0];
      const bottomHabit = rankings.length > 1 ? rankings[rankings.length - 1] : null;
      
      const getHabitCardHtml = (r, title, colorHex, iconName) => {
        if (!r) return '';
        const tieBadge = r.tieCount > 0 ? `<span class="text-[9px] bg-surface-sunken text-text-secondary px-1.5 py-0.5 rounded font-bold align-middle whitespace-nowrap flex-shrink-0">+${r.tieCount} more</span>` : '';

        return `
          <div class="relative overflow-hidden bg-surface-card border border-divider rounded-2xl p-4 pt-5 shadow-sm flex flex-col justify-between min-h-[105px]">
            <div class="absolute top-0 left-0 right-0 h-1" style="background-color: ${colorHex};"></div>
            <div class="flex items-center gap-2 mb-2">
              <i data-lucide="${iconName}" class="w-4 h-4" style="color: ${colorHex}"></i>
              <span class="text-[9px] font-bold tracking-widest uppercase" style="color: ${colorHex}">${title}</span>
            </div>
            <div class="flex flex-col">
              <div class="flex items-center gap-1.5">
                <span class="text-lg font-bold text-text-primary">${r.habit.name}</span>
                ${tieBadge}
              </div>
              <span class="text-[10px] font-bold text-text-secondary uppercase tracking-wide mt-1">${r.consistency}% Consistency</span>
            </div>
          </div>
        `;
      };
      
      let topTitle = 'Top Performer';
      if (topHabit.consistency === 100) topTitle = 'Flawless Execution';
      else if (topHabit.consistency >= 80) topTitle = 'Going Strong';

      let bottomTitle = 'Falling Behind';
      if (bottomHabit && bottomHabit.consistency === 0) bottomTitle = 'Needs Jumpstart';
      
      habitFocusHtml = `
        <div class="flex flex-col gap-2.5">
          <h3 class="text-label-muted">Habit Focus</h3>
          <div class="grid grid-cols-2 gap-3">
            ${getHabitCardHtml(topHabit, topTitle, '#8b5cf6', 'trending-up')}
            ${bottomHabit ? getHabitCardHtml(bottomHabit, bottomTitle, '#f59e0b', 'alert-circle') : getHabitCardHtml(topHabit, 'Solid Routine', '#0ea5e9', 'star')}
          </div>
        </div>
      `;
    }

    // -- Category Focus Cards --
    let catFocusHtml = '';
    if (catFocus.isLocked) {
      catFocusHtml = `
        <div class="relative overflow-hidden bg-surface-card border border-divider rounded-2xl p-5 pt-6 shadow-sm flex flex-col items-center text-center gap-4">
          <div class="absolute top-0 left-0 right-0 h-1 bg-slate-400"></div>
          
          <div class="w-10 h-10 rounded-full bg-surface-sunken border border-divider flex items-center justify-center text-text-secondary">
            <i data-lucide="lock" class="w-4 h-4"></i>
          </div>
          <div class="flex flex-col gap-1.5">
            <span class="text-xs font-bold text-text-primary">Category Insights Locked</span>
            <p class="text-[10px] text-text-secondary">Log at least 7 check-ins to unlock category focus areas.</p>
          </div>
        </div>
      `;
    } else {
      const getCatHtml = (focusData, title, colorHex, iconName) => {
        if (!focusData) return '';
        const cat = APP_CONFIG.categories.find(c => c.id === focusData.categoryId);
        if (!cat) return '';
        const tieBadge = focusData.tieCount > 0 ? `<span class="text-[9px] bg-surface-sunken text-text-secondary px-1.5 py-0.5 rounded font-bold align-middle whitespace-nowrap flex-shrink-0">+${focusData.tieCount} more</span>` : '';

        return `
          <div class="relative overflow-hidden bg-surface-card border border-divider rounded-2xl p-4 pt-5 shadow-sm flex flex-col justify-between min-h-[105px]">
            <div class="absolute top-0 left-0 right-0 h-1" style="background-color: ${colorHex};"></div>
            <div class="flex items-center gap-2 mb-2">
              <i data-lucide="${iconName}" class="w-4 h-4" style="color: ${colorHex}"></i>
              <span class="text-[9px] font-bold tracking-widest uppercase" style="color: ${colorHex}">${title}</span>
            </div>
            <div class="flex flex-col">
              <div class="flex items-center gap-1.5">
                <span class="text-lg font-bold text-text-primary">${cat.name}</span>
                ${tieBadge}
              </div>
              <span class="text-[10px] font-bold text-text-secondary uppercase tracking-wide mt-1">${focusData.rate}% Consistency</span>
            </div>
          </div>
        `;
      };
      
      let topCatTitle = 'Top Priority';
      if (catFocus.mostFocused.rate === 100) topCatTitle = 'Perfect Execution';
      else if (catFocus.mostFocused.rate >= 80) topCatTitle = 'Highly Active';

      let bottomCatTitle = 'Slipping Away';
      if (catFocus.needsFocus && catFocus.needsFocus.rate === 0) bottomCatTitle = 'Completely Ignored';

      catFocusHtml = `
        <div class="flex flex-col gap-2.5">
          <h3 class="text-label-muted">Category Focus</h3>
          <div class="grid grid-cols-2 gap-3">
            ${getCatHtml(catFocus.mostFocused, topCatTitle, '#10b981', 'trending-up')}
            ${getCatHtml(catFocus.needsFocus, bottomCatTitle, '#f43f5e', 'alert-circle') || getCatHtml(catFocus.mostFocused, 'Solid Routine', '#0ea5e9', 'star')}
          </div>
        </div>
      `;
    }

    // -- Habit Rankings --
    let rankingsHtml = '';
    if (rankings.length === 0) {
      rankingsHtml = `<div class="text-center text-xs text-text-secondary py-4">No active habits.</div>`;
    } else {
      const rowsHtml = rankings.map((r, i) => {
        const trendIcon = r.trend === 'up' ? '<i data-lucide="arrow-up-right" class="w-3.5 h-3.5 text-emerald-500"></i>' : 
                          r.trend === 'down' ? '<i data-lucide="arrow-down-right" class="w-3.5 h-3.5 text-rose-500"></i>' : 
                          '<i data-lucide="minus" class="w-3.5 h-3.5 text-slate-300"></i>';
        
        return `
          <div data-go-to-insights-row="${r.habit.id}" class="flex items-center justify-between py-3 border-b border-divider last:border-0 cursor-pointer hover:bg-surface-sunken transition-colors rounded px-2">
            <div class="flex items-center gap-3">
              <span class="text-[10px] font-bold text-text-secondary w-3 text-center">${i + 1}</span>
              <div class="w-8 h-8 rounded-lg bg-surface-sunken flex items-center justify-center text-text-secondary">
                <i data-lucide="${r.habit.icon || 'target'}" class="w-4 h-4"></i>
              </div>
              <span class="font-medium text-text-primary text-sm">${r.habit.name}</span>
              ${advancedInsights.habitTags[r.habit.id] ? `<span class="${advancedInsights.habitTags[r.habit.id].classes} text-[8px] px-1.5 py-0.5 rounded-sm font-bold ml-1">${advancedInsights.habitTags[r.habit.id].label}</span>` : ''}
            </div>
            <div class="flex items-center gap-3">
              <span class="text-sm font-bold text-text-primary">${r.isNew ? '<span class="text-[10px] text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded">New</span>' : r.consistency + '%'}</span>
              <div class="w-5 flex justify-end">${trendIcon}</div>
            </div>
          </div>
        `;
      }).join('');
      
      rankingsHtml = `
        <div class="flex flex-col gap-2.5">
          <h3 class="text-label-muted">Consistency Rankings</h3>
          <div class="bg-surface-card border border-divider rounded-2xl p-4 shadow-sm flex flex-col">
            ${rowsHtml}
          </div>
        </div>
      `;
    }

    // -- Day by Day --
    const dayByDayHtml = dayByDay.map(day => `
      <div class="flex flex-col items-center gap-1.5 flex-1">
        <div class="w-full bg-surface-sunken border border-divider h-28 rounded-xl overflow-hidden flex flex-col justify-end relative">
          <div class="bg-slate-900 w-full rounded-t-lg transition-all duration-500" style="height: ${day.pct}%;"></div>
        </div>
        <span class="text-[9px] font-bold text-text-secondary uppercase">${day.day}</span>
        <span class="text-[8px] font-semibold text-text-secondary">${day.pct}%</span>
      </div>
    `).join('');

    const dayByDaySection = `
      <div class="flex flex-col gap-2.5">
        <h3 class="text-label-muted">This Week's Activity</h3>
        <div class="bg-surface-card border border-divider rounded-2xl p-4 shadow-sm flex justify-between gap-1">
          ${dayByDayHtml}
        </div>
      </div>
    `;

    // -- Behavioral Insights --
    let insightsHtml = '';
    const uniqueDays = new Set(state.checkIns.map(l => l.date)).size;
    if (uniqueDays < 7) {
      const progressPct = Math.round((uniqueDays / 7) * 100);
      insightsHtml = `
        <div class="flex flex-col gap-2.5">
          <h3 class="text-label-muted">Behavioral Insights</h3>
          <div class="relative overflow-hidden bg-surface-card border border-divider rounded-2xl p-5 pt-6 shadow-sm flex flex-col items-center text-center gap-4">
            <div class="absolute top-0 left-0 right-0 h-1 bg-slate-400"></div>
            <div class="w-10 h-10 rounded-full bg-surface-sunken border border-divider flex items-center justify-center text-text-secondary">
              <i data-lucide="lock" class="w-4 h-4"></i>
            </div>
            <div class="flex flex-col gap-1.5 max-w-[240px]">
              <span class="text-xs font-bold text-text-primary">Behavioral Intelligence Locked</span>
              <p class="text-[10px] text-text-secondary leading-normal">Stride requires at least 7 unique days of logging history to parse routine slumps and stack triggers.</p>
            </div>
            <div class="w-full max-w-[200px] flex flex-col gap-1 mt-1">
              <div class="flex justify-between items-center text-[9px] font-bold text-text-secondary uppercase">
                <span>Progress</span>
                <span>${uniqueDays} / 7 Days</span>
              </div>
              <div class="w-full bg-surface-sunken h-2 rounded-full overflow-hidden">
                <div class="bg-slate-900 h-full rounded-full transition-all duration-500" style="width: ${progressPct}%;"></div>
              </div>
            </div>
            <div class="border-t border-divider w-full mt-2 pt-3 flex flex-col gap-2 text-left opacity-35 select-none pointer-events-none">
              <span class="text-[8px] font-bold text-text-secondary uppercase tracking-wider">Unlocks:</span>
              <div class="flex items-center gap-2 text-[10px] text-text-secondary"><i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i><span>Bounce-Back Recovery Strategy</span></div>
              <div class="flex items-center gap-2 text-[10px] text-text-secondary"><i data-lucide="sun" class="w-3.5 h-3.5"></i><span>Weekend Performance Slumps</span></div>
            </div>
          </div>
        </div>
      `;
    } else {
      if (advancedInsights.overall.length > 0) {
        const cardsHtml = advancedInsights.overall.map((insight, index) => `
          <div class="flex items-start gap-3 border-b border-divider pb-4 last:border-0 last:pb-0">
            <div class="w-8 h-8 rounded-full ${insight.bg} flex items-center justify-center flex-shrink-0">
              <i data-lucide="${insight.icon}" class="w-4 h-4 ${insight.color}"></i>
            </div>
            <div class="flex flex-col">
              <span class="text-xs font-bold text-text-primary">${insight.title}</span>
              <p class="text-[10px] text-text-secondary mt-0.5 leading-relaxed">${insight.text}</p>
            </div>
          </div>
        `).join('');

        insightsHtml = `
          <div class="flex flex-col gap-2.5">
            <h3 class="text-label-muted flex items-center gap-1.5"><i data-lucide="brain" class="w-3.5 h-3.5"></i> Behavioral Insights</h3>
            <div class="bg-surface-card border border-divider rounded-2xl p-4 shadow-sm flex flex-col gap-4">
              ${cardsHtml}
            </div>
          </div>
        `;
      }
    }

    return `
      <div id="dashboard-view" class="flex flex-col gap-6 pb-24 animate-fade-in">
        <div class="flex flex-col gap-3">
          ${toggleHtml}
          ${snapshotHtml}
        </div>
        ${habitFocusHtml}
        ${catFocusHtml}
        ${insightsHtml}
        ${rankingsHtml}
        ${dayByDaySection}
      </div>
    `;
  },

  bindEvents(state, onNavigateToInsights) {
    // Time Toggle Events
    const btnThisWeek = document.getElementById('toggle-this-week');
    if (btnThisWeek) {
      btnThisWeek.addEventListener('click', () => {
        if (state.dashboardWeekOffset !== 0) {
          state.dashboardWeekOffset = 0;
          state.notify();
        }
      });
    }

    const btnLastWeek = document.getElementById('toggle-last-week');
    if (btnLastWeek) {
      btnLastWeek.addEventListener('click', () => {
        if (state.dashboardWeekOffset !== 1) {
          state.dashboardWeekOffset = 1;
          state.notify();
        }
      });
    }

    // Go to habit insights on row click
    document.querySelectorAll('[data-go-to-insights-row]').forEach(row => {
      row.addEventListener('click', (e) => {
        e.stopPropagation();
        const habitId = row.dataset.goToInsightsRow;
        if (habitId && onNavigateToInsights) {
          onNavigateToInsights(habitId);
        }
      });
    });
  }
};
