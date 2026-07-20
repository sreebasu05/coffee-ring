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
      <div class="flex items-center bg-surface-sunken p-1 rounded-xl w-full border border-divider">
        <button id="toggle-this-week" class="flex-1 text-xs font-bold py-1.5 rounded-lg transition-colors ${state.dashboardWeekOffset === 0 ? 'bg-surface-card shadow-sm text-text-primary' : 'text-text-secondary hover:text-text-primary'}">Trailing 4 Weeks</button>
        <button id="toggle-last-week" class="flex-1 text-xs font-bold py-1.5 rounded-lg transition-colors ${state.dashboardWeekOffset === 1 ? 'bg-surface-card shadow-sm text-text-primary' : 'text-text-secondary hover:text-text-primary'}">Last Week</button>
      </div>
    `;

    // -- Hero Header --
    const consistencyLabel = overallConsistency >= 90 ? 'Exceptional' : overallConsistency >= 70 ? 'Strong' : overallConsistency >= 50 ? 'Steady' : overallConsistency >= 25 ? 'Building' : 'Getting Started';

    const headerHtml = `
      <div class="flex flex-col gap-3 mt-2">
        <div class="flex flex-col gap-1">
          <h1 class="text-3xl font-black text-text-primary tracking-tight leading-tight">Dashboard</h1>
          <p class="text-sm text-text-secondary">Your overall habit analysis.</p>
        </div>

        <div class="flex gap-3">
          <div class="flex-1 bg-surface-card border border-divider rounded-2xl p-3.5 flex flex-col gap-1 shadow-sm">
            <span class="text-[10px] font-black text-text-secondary uppercase tracking-widest">Today</span>
            <span class="text-2xl font-black text-indigo-500 dark:text-indigo-400">${todayPct}<span class="text-base font-bold">%</span></span>
            <span class="text-[10px] text-text-secondary">real-time</span>
          </div>
          <div class="flex-1 bg-surface-card border border-divider rounded-2xl p-3.5 flex flex-col gap-1 shadow-sm">
            <span class="text-[10px] font-black text-text-secondary uppercase tracking-widest">On Track</span>
            <span class="text-2xl font-black text-amber-500 dark:text-amber-400">${onTrackCount}<span class="text-base font-bold text-text-secondary">/${totalHabits}</span></span>
            <span class="text-[10px] text-text-secondary">can meet goal this week</span>
          </div>
        </div>
      </div>
    `;

    const metricsHtml = `
      <div class="flex flex-col gap-3">
        <div class="bg-surface-card border border-divider rounded-2xl p-4 shadow-sm flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <div class="flex flex-col gap-0.5">
              <span class="text-[10px] font-black text-text-secondary uppercase tracking-widest">Overall Consistency</span>
              <span class="text-[10px] text-violet-500 dark:text-violet-400 font-bold">${consistencyLabel}</span>
            </div>
            <span class="text-3xl font-black text-text-primary tabular-nums">${overallConsistency}<span class="text-lg font-bold text-text-secondary">%</span></span>
          </div>
          <div class="w-full bg-surface-sunken h-2 rounded-full overflow-hidden border border-divider">
            <div class="h-full rounded-full transition-all duration-500 bg-violet-500 dark:bg-violet-400" style="width: ${overallConsistency}%;"></div>
          </div>
          <span class="text-[9px] text-text-secondary leading-relaxed">Average weekly target hit rate across all your habits over the trailing period.</span>
        </div>

      </div>
    `;

    // -- Habit Focus Cards --
    const sectionDivider = (label) => `
      <div class="flex items-center gap-3 px-1">
        <div class="flex-1 h-px bg-divider"></div>
        <span class="text-[9px] font-black text-text-secondary uppercase tracking-[0.2em]">${label}</span>
        <div class="flex-1 h-px bg-divider"></div>
      </div>
    `;

    const lockedCard = (message) => `
      <div class="bg-surface-card border border-divider rounded-2xl p-5 shadow-sm flex flex-col items-center text-center gap-2">
        <span class="text-xs font-bold text-text-primary">Locked</span>
        <p class="text-[10px] text-text-secondary max-w-[240px] leading-relaxed">${message}</p>
      </div>
    `;

    let habitFocusHtml = '';
    if (rankings.length > 0) {
      // Only consider habits with a completed week of data
      const establishedRankings = rankings.filter(r => !r.isNew);
      // Further filter: if all established habits are at 0%, treat as locked
      const scoredRankings = establishedRankings.filter(r => r.consistency > 0);

      const getHabitCardHtml = (r, title, isTop = false) => {
        const tieBadge = r.tieCount > 0 ? `<span class="text-[9px] bg-surface-sunken text-text-secondary px-1.5 py-0.5 rounded font-bold">+${r.tieCount} more</span>` : '';
        const labelColor = isTop ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400';
        return `
          <div class="flex-1 bg-surface-card border border-divider rounded-2xl p-4 shadow-sm flex flex-col gap-2">
            <span class="text-[9px] font-black ${labelColor} uppercase tracking-widest">${title}</span>
            <div class="flex flex-col gap-0.5">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="text-base font-bold text-text-primary leading-tight">${r.habit.name}</span>
                ${tieBadge}
              </div>
              <span class="text-[10px] text-text-secondary">${r.consistency}% consistency</span>
            </div>
          </div>
        `;
      };

      let focusContent;
      if (establishedRankings.length === 0) {
        // All habits are new — no completed weeks yet
        focusContent = lockedCard('All your habits are new this week. Habit Focus unlocks once you have at least one completed week of data.');
      } else if (scoredRankings.length === 0) {
        // All established habits have 0% — nothing meaningful to surface
        focusContent = lockedCard('No habits have hit their weekly target yet. Keep logging and your top performer will appear here.');
      } else {
        const topHabit = scoredRankings[0];
        const bottomHabit = establishedRankings[establishedRankings.length - 1];
        // Only show bottom if it's meaningfully different from the top
        const showBottom = bottomHabit && bottomHabit.habit.id !== topHabit.habit.id;

        let topTitle = 'Top Performer';
        if (topHabit.consistency === 100) topTitle = 'Flawless';
        else if (topHabit.consistency >= 80) topTitle = 'Going Strong';

        let bottomTitle = 'Needs Attention';
        if (showBottom && bottomHabit.consistency === 0) bottomTitle = 'Not Started';

        focusContent = `
          <div class="flex gap-3">
            ${getHabitCardHtml(topHabit, topTitle, true)}
            ${showBottom ? getHabitCardHtml(bottomHabit, bottomTitle, false) : ''}
          </div>
        `;
      }

      habitFocusHtml = `
        <div class="flex flex-col gap-2">
          ${sectionDivider('Habit Focus')}
          ${focusContent}
        </div>
      `;
    }

    // -- Category Focus Cards --
    let catFocusHtml = '';
    {
      const getCatHtml = (focusData, title, isTop = false) => {
        if (!focusData) return '';
        const cat = APP_CONFIG.categories.find(c => c.id === focusData.categoryId);
        if (!cat) return '';
        const tieBadge = focusData.tieCount > 0 ? `<span class="text-[9px] bg-surface-sunken text-text-secondary px-1.5 py-0.5 rounded font-bold">+${focusData.tieCount} more</span>` : '';
        const labelColor = isTop ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400';
        return `
          <div class="flex-1 bg-surface-card border border-divider rounded-2xl p-4 shadow-sm flex flex-col gap-2">
            <span class="text-[9px] font-black ${labelColor} uppercase tracking-widest">${title}</span>
            <div class="flex flex-col gap-0.5">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="text-base font-bold text-text-primary leading-tight">${cat.name}</span>
                ${tieBadge}
              </div>
              <span class="text-[10px] text-text-secondary">${focusData.rate}% consistency</span>
            </div>
          </div>
        `;
      };

      let catContent;
      if (catFocus.isLocked) {
        catContent = lockedCard('Log at least 7 check-ins to unlock category focus areas.');
      } else if (!catFocus.mostFocused || catFocus.mostFocused.rate === 0) {
        catContent = lockedCard('No category has any consistency yet. Keep logging and your most active category will surface here.');
      } else {
        let topCatTitle = 'Most Active';
        if (catFocus.mostFocused.rate === 100) topCatTitle = 'Perfect Focus';
        else if (catFocus.mostFocused.rate >= 80) topCatTitle = 'Highly Active';

        let bottomCatTitle = 'Slipping';
        if (catFocus.needsFocus && catFocus.needsFocus.rate === 0) bottomCatTitle = 'Neglected';

        const showBottom = catFocus.needsFocus && catFocus.needsFocus.categoryId !== catFocus.mostFocused.categoryId;

        catContent = `
          <div class="flex gap-3">
            ${getCatHtml(catFocus.mostFocused, topCatTitle, true)}
            ${showBottom ? getCatHtml(catFocus.needsFocus, bottomCatTitle, false) : ''}
          </div>
        `;
      }

      catFocusHtml = `
        <div class="flex flex-col gap-2">
          ${sectionDivider('Category Focus')}
          ${catContent}
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
          <div data-go-to-insights-row="${r.habit.id}" class="flex items-center justify-between py-3 border-b border-divider last:border-0 cursor-pointer hover:bg-surface-sunken transition-colors rounded-lg px-2 -mx-2">
            <div class="flex items-center gap-3">
              <span class="text-[10px] font-black text-text-secondary w-3 text-center tabular-nums">${i + 1}</span>
              <div class="flex flex-col gap-0.5">
                <span class="font-semibold text-text-primary text-sm leading-tight">${r.habit.name}</span>
                ${advancedInsights.habitTags[r.habit.id] ? `<span class="${advancedInsights.habitTags[r.habit.id].classes} text-[8px] px-1.5 py-0.5 rounded font-bold self-start">${advancedInsights.habitTags[r.habit.id].label}</span>` : ''}
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-sm font-bold text-text-primary tabular-nums">${r.isNew ? '<span class="text-[10px] text-text-secondary uppercase tracking-widest bg-surface-sunken px-2 py-0.5 rounded border border-divider">New</span>' : r.consistency + '%'}</span>
              <div class="w-4 flex justify-end">${trendIcon}</div>
            </div>
          </div>
        `;
      }).join('');
      
      rankingsHtml = `
        <div class="flex flex-col gap-2">
          <div class="flex items-center gap-3 px-1">
            <div class="flex-1 h-px bg-divider"></div>
            <span class="text-[9px] font-black text-text-secondary uppercase tracking-[0.2em]">Consistency Rankings</span>
            <div class="flex-1 h-px bg-divider"></div>
          </div>
          <p class="text-[10px] text-text-secondary text-center px-4">Tap any habit to explore its full consistency trends, logs, and stats.</p>
          <div class="bg-surface-card border border-divider rounded-2xl px-4 py-1 shadow-sm flex flex-col">
            ${rowsHtml}
          </div>
        </div>
      `;
    }

    // -- Day by Day --
    const dayByDayHtml = dayByDay.map(day => `
      <div class="flex flex-col items-center gap-1.5 flex-1">
        <div class="w-full bg-surface-sunken border border-divider h-24 rounded-xl overflow-hidden flex flex-col justify-end">
          <div class="bg-accentBlue w-full transition-all duration-500" style="height: ${day.pct}%;"></div>
        </div>
        <span class="text-[9px] font-bold text-text-secondary uppercase">${day.day}</span>
        <span class="text-[8px] font-semibold text-text-secondary tabular-nums">${day.pct}%</span>
      </div>
    `).join('');

    const dayByDaySection = `
      <div class="flex flex-col gap-2">
        <div class="flex items-center gap-3 px-1">
          <div class="flex-1 h-px bg-divider"></div>
          <span class="text-[9px] font-black text-text-secondary uppercase tracking-[0.2em]">This Week's Activity</span>
          <div class="flex-1 h-px bg-divider"></div>
        </div>
        <div class="bg-surface-card border border-divider rounded-2xl p-4 shadow-sm flex justify-between gap-1.5">
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
        <div class="flex flex-col gap-2">
          <div class="flex items-center gap-3 px-1">
            <div class="flex-1 h-px bg-divider"></div>
            <span class="text-[9px] font-black text-text-secondary uppercase tracking-[0.2em]">Behavioral Insights</span>
            <div class="flex-1 h-px bg-divider"></div>
          </div>
          <div class="bg-surface-card border border-divider rounded-2xl p-5 shadow-sm flex flex-col items-center text-center gap-3">
            <span class="text-xs font-bold text-text-primary">Locked</span>
            <p class="text-[10px] text-text-secondary max-w-[240px] leading-relaxed">Requires at least 7 unique days of logging history to generate behavioral patterns.</p>
            <div class="w-full max-w-[200px] flex flex-col gap-1.5 mt-1">
              <div class="flex justify-between items-center text-[9px] font-bold text-text-secondary">
                <span>Progress</span>
                <span>${uniqueDays} / 7 days</span>
              </div>
              <div class="w-full bg-surface-sunken h-1.5 rounded-full overflow-hidden border border-divider">
                <div class="bg-accentBlue h-full rounded-full transition-all duration-500" style="width: ${progressPct}%;"></div>
              </div>
            </div>
          </div>
        </div>
      `;
    } else {
      if (advancedInsights.overall.length > 0) {
        const cardsHtml = advancedInsights.overall.map((insight) => `
          <div class="flex items-start gap-3 border-b border-divider pb-4 last:border-0 last:pb-0">
            <div class="w-8 h-8 rounded-full ${insight.bg} flex items-center justify-center flex-shrink-0">
              <i data-lucide="${insight.icon}" class="w-4 h-4 ${insight.color}"></i>
            </div>
            <div class="flex flex-col gap-0.5">
              <span class="text-xs font-bold text-text-primary">${insight.title}</span>
              <p class="text-[10px] text-text-secondary leading-relaxed">${insight.text}</p>
            </div>
          </div>
        `).join('');

        insightsHtml = `
          <div class="flex flex-col gap-2">
            <div class="flex items-center gap-3 px-1">
              <div class="flex-1 h-px bg-divider"></div>
              <span class="text-[9px] font-black text-text-secondary uppercase tracking-[0.2em]">Behavioral Insights</span>
              <div class="flex-1 h-px bg-divider"></div>
            </div>
            <div class="bg-surface-card border border-divider rounded-2xl p-4 shadow-sm flex flex-col gap-4">
              ${cardsHtml}
            </div>
          </div>
        `;
      }
    }

    return `
      <div id="dashboard-view" class="flex flex-col gap-6 pb-24 animate-fade-in">
        ${headerHtml}
        ${toggleHtml}
        ${metricsHtml}
        ${habitFocusHtml}
        ${catFocusHtml}
        ${insightsHtml}
        ${rankingsHtml}
        ${dayByDaySection}
      </div>
    `;
  },

  bindEvents(state, onNavigateToInsights) {
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
