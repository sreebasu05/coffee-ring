import { APP_CONFIG } from '../../config/appConfig.js';

export const DashboardPage = {
  render(state) {
    const todayPct = state.getTodayCompletionRate();
    const onTrackCount = state.getWeeklyGoalProgress();
    const totalHabits = state.habits.length;

    // -- Global Gating: calculate data maturity --
    const uniqueDays = new Set(state.checkIns.map(l => l.date)).size;
    const oldestHabitAge = state.habits.reduce((max, h) => {
      const created = h.createdAt ? new Date(h.createdAt) : new Date();
      const age = Math.floor((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24));
      return Math.max(max, age);
    }, 0);
    const dataMaturityDays = Math.max(uniqueDays, oldestHabitAge);
    const isLastWeekLocked = dataMaturityDays < 7;
    const isTrailing4Locked = dataMaturityDays < 28;
    const isCurrentTabLocked = state.dashboardWeekOffset === 1 ? isLastWeekLocked : isTrailing4Locked;

    // Only compute analytics if unlocked
    const overallConsistency = isCurrentTabLocked ? 0 : state.getOverallConsistency();
    const catFocus = isCurrentTabLocked ? { isLocked: true } : state.getCategoryFocus();
    const rankings = isCurrentTabLocked ? [] : state.getHabitRankings();
    const dayByDay = isCurrentTabLocked ? [] : state.getWeeklyDayByDayActivity();
    const advancedInsights = isCurrentTabLocked ? { overall: [], habitTags: {} } : state.getAdvancedBehavioralInsights();

    const isLastWeek = state.dashboardWeekOffset === 1;
    const activePeriodLabel = isLastWeek ? "Last Week" : "Trailing 4 Weeks";

    // -- Dropdown Menu Options --
    const timeframeDropdownOptions = `
      <button 
        id="opt-last-week"
        class="w-full text-left px-4 py-2.5 text-xs flex items-center justify-between ${
          isLastWeek ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-surface-sunken' : 'text-text-secondary hover:text-text-primary hover:bg-surface-sunken'
        } transition-colors border-b border-divider"
      >
        <span>Last Week</span>
        ${isLastWeek ? '<i data-lucide="check" class="w-3.5 h-3.5"></i>' : ''}
      </button>
      <button 
        id="opt-this-week"
        class="w-full text-left px-4 py-2.5 text-xs flex items-center justify-between ${
          !isLastWeek ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-surface-sunken' : 'text-text-secondary hover:text-text-primary hover:bg-surface-sunken'
        } transition-colors"
      >
        <span>Trailing 4 Weeks</span>
        ${!isLastWeek ? '<i data-lucide="check" class="w-3.5 h-3.5"></i>' : ''}
      </button>
    `;

    // -- Hero Header --
    const consistencyLabel = overallConsistency >= 90 ? 'Exceptional' : overallConsistency >= 70 ? 'Strong' : overallConsistency >= 50 ? 'Steady' : overallConsistency >= 25 ? 'Building' : 'Getting Started';

    const headerHtml = `
      <div class="flex flex-col gap-4 mt-2">
        <div class="flex flex-col gap-1">
          <h1 class="text-3xl font-black text-text-primary tracking-tight leading-tight">Dashboard</h1>
          <p class="text-sm text-text-secondary">Your overall habit analysis.</p>
        </div>

        <div class="flex gap-3">
          <div class="flex-1 bg-surface-card border border-divider/80 rounded-2xl p-4 flex flex-col gap-1 shadow-sm relative overflow-hidden">
            <span class="text-[10px] font-black text-text-secondary uppercase tracking-widest">Today</span>
            <span class="text-3xl font-black bg-gradient-to-r from-neutral-900 to-neutral-600 dark:from-neutral-100 dark:to-neutral-300 bg-clip-text text-transparent">${todayPct}<span class="text-lg font-bold text-text-secondary">%</span></span>
            <span class="text-[10px] text-text-secondary">real-time completion</span>
          </div>
          <div class="flex-1 bg-surface-card border border-divider/80 rounded-2xl p-4 flex flex-col gap-1 shadow-sm relative overflow-hidden">
            <span class="text-[10px] font-black text-text-secondary uppercase tracking-widest">On Track</span>
            <span class="text-3xl font-black bg-gradient-to-r from-neutral-900 to-neutral-600 dark:from-neutral-100 dark:to-neutral-300 bg-clip-text text-transparent">${onTrackCount}<span class="text-lg font-bold text-text-secondary">/${totalHabits}</span></span>
            <span class="text-[10px] text-text-secondary">meeting weekly targets</span>
          </div>
        </div>
      </div>
    `;

    // -- Subheading & Timeframe Dropdown Row --
    const controlsRowHtml = `
      <div class="flex flex-col gap-1 px-1 mt-1">
        <!-- Subheading with tiny chevron trigger like homepage -->
        <div class="relative inline-block select-none w-fit">
          <button 
            id="timeframe-dropdown-trigger" 
            class="flex items-center gap-1.5 text-text-primary hover:opacity-80 transition-colors uppercase tracking-widest text-[11px] font-extrabold"
          >
            <span>${activePeriodLabel.toUpperCase()} ANALYSIS</span>
            <i data-lucide="chevron-down" class="w-3.5 h-3.5 text-text-secondary"></i>
          </button>
          
          <div 
            id="dashboard-timeframe-dropdown" 
            class="hidden absolute left-0 mt-2 bg-surface-card border border-divider/80 rounded-2xl shadow-xl overflow-hidden w-48 z-50 animate-fade-in normal-case tracking-normal"
          >
            ${timeframeDropdownOptions}
          </div>
        </div>

        <!-- Metric links as subtext -->
        <div class="flex items-center gap-1.5 mt-0.5">
          <button id="dashboard-learn-more" class="inline-flex items-center gap-1 text-[10px] text-text-secondary hover:text-text-primary transition-colors underline decoration-divider underline-offset-2">
            <i data-lucide="info" class="w-3 h-3"></i>
            <span>What do these metrics mean?</span>
          </button>
        </div>
      </div>
    `;

    const metricsHtml = `
      <div class="flex flex-col gap-3">
        <div class="bg-surface-card border border-divider/80 rounded-2xl p-4.5 shadow-sm flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <div class="flex flex-col gap-0.5">
              <span class="text-[10px] font-black text-text-secondary uppercase tracking-widest">Overall Consistency</span>
              <span class="text-[11px] text-text-primary font-bold">${consistencyLabel}</span>
            </div>
            <span class="text-3xl font-black text-text-primary tabular-nums">${overallConsistency}<span class="text-lg font-bold text-text-secondary">%</span></span>
          </div>
          <div class="w-full bg-surface-sunken h-2.5 rounded-full overflow-hidden border border-divider/60 p-[1px]">
            <div class="h-full rounded-full transition-all duration-500 bg-neutral-800 dark:bg-neutral-200" style="width: ${overallConsistency}%;"></div>
          </div>
          <span class="text-[9.5px] text-text-secondary leading-relaxed">Average weekly target hit rate across all habits during this period.</span>
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
      <div class="bg-surface-card border border-divider rounded-2xl p-5 shadow-sm flex flex-col items-center text-center gap-3">
        <div class="w-9 h-9 rounded-full bg-surface-sunken border border-divider flex items-center justify-center text-text-secondary">
          <i data-lucide="lock" class="w-4 h-4"></i>
        </div>
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
                          '<i data-lucide="minus" class="w-3.5 h-3.5 text-neutral-300"></i>';
        
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
    if (uniqueDays < 7) {
      const progressPct = Math.round((uniqueDays / 7) * 100);
      insightsHtml = `
        <div class="flex flex-col gap-2">
          ${sectionDivider('Behavioral Insights')}
          <div class="bg-surface-card border border-divider rounded-2xl p-5 shadow-sm flex flex-col items-center text-center gap-3">
            <div class="w-9 h-9 rounded-full bg-surface-sunken border border-divider flex items-center justify-center text-text-secondary">
              <i data-lucide="lock" class="w-4 h-4"></i>
            </div>
            <p class="text-[10px] text-text-secondary max-w-[240px] leading-relaxed">Log for ${7 - uniqueDays} more day${7 - uniqueDays > 1 ? 's' : ''} to unlock behavioral patterns and personalized insights.</p>
            <div class="w-full max-w-[200px] flex flex-col gap-1.5">
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

    // -- Global Lock Card --
    const requiredDays = state.dashboardWeekOffset === 1 ? 7 : 28;
    const currentProgress = Math.min(dataMaturityDays, requiredDays);
    const globalProgressPct = Math.round((currentProgress / requiredDays) * 100);
    const tabLabel = state.dashboardWeekOffset === 1 ? 'first week' : '4 weeks';
    const unlockPreview = state.dashboardWeekOffset === 1
      ? 'Overall Consistency, Habit Focus, Category Focus, Rankings, Weekly Activity, and Behavioral Insights'
      : '4-week rolling trends, deep consistency analysis, and long-term behavioral patterns';

    const globalLockHtml = isCurrentTabLocked ? `
      <div class="bg-surface-card border border-divider rounded-2xl p-6 shadow-sm flex flex-col items-center text-center gap-4">
        <div class="w-10 h-10 rounded-full bg-surface-sunken border border-divider flex items-center justify-center text-text-secondary">
          <i data-lucide="lock" class="w-4.5 h-4.5"></i>
        </div>
        <div class="flex flex-col gap-1.5 max-w-[260px]">
          <span class="text-sm font-bold text-text-primary">Complete your ${tabLabel}</span>
          <p class="text-[10px] text-text-secondary leading-relaxed">Log habits for ${requiredDays} days to unlock analytics for this view.</p>
        </div>
        <div class="w-full max-w-[220px] flex flex-col gap-1.5">
          <div class="flex justify-between items-center text-[9px] font-bold text-text-secondary">
            <span>Progress</span>
            <span>${currentProgress} / ${requiredDays} days</span>
          </div>
          <div class="w-full bg-surface-sunken h-2 rounded-full overflow-hidden border border-divider">
            <div class="bg-accentBlue h-full rounded-full transition-all duration-500" style="width: ${globalProgressPct}%;"></div>
          </div>
        </div>
        <div class="border-t border-divider w-full pt-3 mt-1">
          <p class="text-[9px] text-text-secondary leading-relaxed opacity-50">${unlockPreview}</p>
        </div>
      </div>
    ` : '';

    const analyticsHtml = isCurrentTabLocked ? globalLockHtml : `
      ${metricsHtml}
      ${habitFocusHtml}
      ${catFocusHtml}
      ${insightsHtml}
      ${rankingsHtml}
      ${dayByDaySection}
    `;

    return `
      <div id="dashboard-view" class="flex flex-col gap-6 pb-24 animate-fade-in">
        ${headerHtml}
        ${controlsRowHtml}
        ${analyticsHtml}
      </div>
    `;
  },

  bindEvents(state, onNavigateToInsights, onNavigateToGlossary) {
    if (window.lucide) window.lucide.createIcons();

    // Dropdown toggle logic
    const trigger = document.getElementById('timeframe-dropdown-trigger');
    const dropdown = document.getElementById('dashboard-timeframe-dropdown');
    
    if (trigger && dropdown) {
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('hidden');
      });

      document.addEventListener('click', (e) => {
        if (!trigger.contains(e.target) && !dropdown.contains(e.target)) {
          dropdown.classList.add('hidden');
        }
      });
    }

    const btnLastWeek = document.getElementById('opt-last-week');
    if (btnLastWeek) {
      btnLastWeek.addEventListener('click', () => {
        if (state.dashboardWeekOffset !== 1) {
          state.dashboardWeekOffset = 1;
          state.notify();
        }
      });
    }

    const btnThisWeek = document.getElementById('opt-this-week');
    if (btnThisWeek) {
      btnThisWeek.addEventListener('click', () => {
        if (state.dashboardWeekOffset !== 0) {
          state.dashboardWeekOffset = 0;
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

    const learnMoreBtn = document.getElementById('dashboard-learn-more');
    if (learnMoreBtn && onNavigateToGlossary) {
      learnMoreBtn.addEventListener('click', () => onNavigateToGlossary());
    }
  }
};
