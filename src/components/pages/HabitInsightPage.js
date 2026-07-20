import { APP_CONFIG } from '../../config/appConfig.js';
import { GridCard } from '../ui/GridCard.js';

export const HabitInsightPage = {
  selectedHabitId: null,
  activeSubTab: 'habits', // 'habits' or 'behavior'
  isEditing: false,
  editorType: null,
  viewedMonthOffset: 0,

  render(state) {
    // Expose global click helpers on window to ensure click handler is 100% bulletproof
    window.HabitInsightPageSelect = (habitId) => {
      HabitInsightPage.selectedHabitId = habitId;
      HabitInsightPage.viewedMonthOffset = 0;
      state.notify();
    };

    window.HabitInsightPageBack = () => {
      HabitInsightPage.selectedHabitId = null;
      HabitInsightPage.isEditing = false;
      HabitInsightPage.editorType = null;
      HabitInsightPage.viewedMonthOffset = 0;
      if (window.appController) {
        window.appController.navigate('dashboard');
      } else {
        state.notify();
      }
    };

    window.HabitInsightPageSetSubTab = (subTab) => {
      HabitInsightPage.activeSubTab = subTab;
      state.notify();
    };

    if (state.habits.length === 0) {
      return `
        <div id="habit-insights-view" class="flex flex-col gap-5 pb-24 animate-fade-in text-center py-10">
          <i data-lucide="line-chart" class="w-12 h-12 text-slate-300 mx-auto"></i>
          <h1 class="text-lg font-bold text-text-primary mt-3">No Habits Found</h1>
          <p class="text-xs text-text-secondary max-w-xs mx-auto mt-1">Please create a habit first on the Add tab to begin tracking detailed insights.</p>
        </div>
      `;
    }

    // Redirect to dashboard if no habit is selected
    if (this.selectedHabitId === null) {
      if (window.appController) {
        window.appController.navigate('dashboard');
      }
      return '';
    }

    // ── CASE B: Detailed Insights View ──
    const habit = state.habits.find(h => h.id === this.selectedHabitId);
    if (!habit) {
      this.selectedHabitId = null;
      return '';
    }

    this.editorType = this.editorType || habit.type;

    if (HabitInsightPage.editDays === undefined || HabitInsightPage.selectedHabitId !== HabitInsightPage.lastSelectedId) {
      HabitInsightPage.editDays = habit.days ? [...habit.days] : [];
      HabitInsightPage.lastSelectedId = HabitInsightPage.selectedHabitId;
    }
    const activeDays = HabitInsightPage.editDays;

    // Calculate habit age to lock insights unless 7 days have passed
    const createdAt = habit.createdAt ? new Date(habit.createdAt) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const diffMs = new Date().getTime() - createdAt.getTime();
    const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    const loggedDaysCount = new Set(state.checkIns.filter(l => l.habitId === habit.id).map(l => l.date)).size;
    const progressDays = Math.min(7, Math.max(loggedDaysCount, diffDays));
    const isInsightsLocked = progressDays < 7;
    const daysRemaining = 7 - progressDays;

    const weeklyStreak = state.getWeeklyStreak(habit.id);
    const bestWeeklyStreak = state.getBestWeeklyStreak(habit.id);
    
    let secondaryStreakName = "Target Streak";
    let secondaryStreak = state.getTargetStreak(habit.id);
    let bestSecondaryStreakText = "";
    
    if (habit.weeklyTarget === 7) {
      secondaryStreakName = "Daily Streak";
      secondaryStreak = state.getDailyStreak(habit.id);
      bestSecondaryStreakText = `Best: ${state.getBestDailyStreak(habit.id)}d`;
    }

    const monthlyRate = state.getRollingConsistency(habit.id, 28);
    const fidelity = state.getLoggingFidelity(habit.id);
    const tagsFrequency = state.getTagFrequency(habit.id);
    const recentNotes = state.getRecentNotes(habit.id);

    const categoryMeta = APP_CONFIG.categories.find(cat => cat.id === habit.category);
    const categoryLabel = categoryMeta ? categoryMeta.name : 'General';

    // Build badges for header
    const targetBadgeHtml = `
      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-sunken text-[9px] font-bold text-text-secondary border border-divider/60 flex-shrink-0">
        <i data-lucide="target" class="w-2.5 h-2.5"></i>
        Goal: ${habit.weeklyTarget}d/wk
      </span>
    `;

    const scheduleDaysStr = habit.days && habit.days.length > 0 ? habit.days.join(', ') : 'Everyday';
    const scheduleBadgeHtml = `
      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-sunken text-[9px] font-bold text-text-secondary border border-divider/60 flex-shrink-0">
        <i data-lucide="calendar" class="w-2.5 h-2.5"></i>
        Days: ${scheduleDaysStr}
      </span>
    `;

    let metricBadgeHtml = "";
    if (habit.type === 'number') {
      let rangeText = "";
      if (habit.minGoal !== null && habit.maxGoal !== null) {
        rangeText = `${habit.minGoal}–${habit.maxGoal}`;
      } else if (habit.minGoal !== null) {
        rangeText = `≥ ${habit.minGoal}`;
      } else if (habit.maxGoal !== null) {
        rangeText = `≤ ${habit.maxGoal}`;
      }
      
      if (rangeText) {
        metricBadgeHtml = `
          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-sunken text-[9px] font-bold text-text-secondary border border-divider/60 flex-shrink-0">
            <i data-lucide="activity" class="w-2.5 h-2.5"></i>
            Range: ${rangeText} ${habit.unit || ''}
          </span>
        `;
      }
    }

    const catColor = state.getCategoryColor(habit.category);
    const colorHexMap = {
      pastelMint: '#10b981',
      pastelAmber: '#f59e0b',
      pastelSky: '#0ea5e9',
      pastelRose: '#f43f5e',
      pastelLavender: '#8b5cf6',
      pastelPink: '#ec4899'
    };
    const themeHex = colorHexMap[catColor] || '#0f172a';

    const bgMap = {
      pastelMint: 'bg-pastelMint',
      pastelAmber: 'bg-pastelAmber',
      pastelSky: 'bg-pastelSky',
      pastelRose: 'bg-pastelRose',
      pastelLavender: 'bg-pastelLavender',
      pastelPink: 'bg-pastelPink'
    };
    const textMap = {
      pastelMint: 'text-emerald-800 dark:text-emerald-200',
      pastelAmber: 'text-amber-800 dark:text-amber-200',
      pastelSky: 'text-sky-800 dark:text-sky-200',
      pastelRose: 'text-rose-800 dark:text-rose-200',
      pastelLavender: 'text-violet-800 dark:text-violet-200',
      pastelPink: 'text-pink-800 dark:text-pink-200'
    };
    const borderMap = {
      pastelMint: 'border-emerald-250 bg-pastelMint/20',
      pastelAmber: 'border-amber-250 bg-pastelAmber/20',
      pastelSky: 'border-sky-250 bg-pastelSky/20',
      pastelRose: 'border-rose-250 bg-pastelRose/20',
      pastelLavender: 'border-violet-250 bg-pastelLavender/20',
      pastelPink: 'border-pink-250 bg-pastelPink/20'
    };

    const pastelBg = bgMap[catColor] || 'bg-surface-sunken';
    const pastelText = textMap[catColor] || 'text-text-primary';
    const softBorderClass = borderMap[catColor] || 'border-divider';

    // Generate Heatmap calendar (switchable by month offset)
    const currentDate = new Date();
    currentDate.setMonth(currentDate.getMonth() + (HabitInsightPage.viewedMonthOffset || 0));
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const monthName = currentDate.toLocaleString('default', { month: 'long' });

    const firstDay = new Date(currentYear, currentMonth, 1);
    let startDayIdx = firstDay.getDay() - 1; 
    if (startDayIdx === -1) startDayIdx = 6; 

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const calendarHeaderHtml = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
      .map(d => `<span class="text-[10px] font-bold text-text-secondary text-center uppercase">${d}</span>`).join('');

    const dayCells = [];
    for (let i = 0; i < startDayIdx; i++) {
      dayCells.push(`<div class="w-8 h-8"></div>`);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const log = state.checkIns.find(l => l.habitId === habit.id && l.date === dateStr);
      
      let isCompleted = log !== null && log !== undefined;

      const hasDetails = log && (
        (log.value !== null && log.value !== undefined) || 
        (log.note && log.note.trim() !== '') || 
        (log.tags && log.tags.length > 0)
      );

      let cellClass = "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border ";
      if (log) {
        if (hasDetails) {
          cellClass += `border-transparent ${pastelBg} ${pastelText} shadow-sm`;
        } else {
          cellClass += `border-transparent ${softBorderClass} ${pastelText}`;
        }
      } else {
        cellClass += "border-divider bg-surface-card text-text-secondary hover:border-divider";
      }

      dayCells.push(`
        <div class="flex items-center justify-center">
          <div class="${cellClass}">${day}</div>
        </div>
      `);
    }
    const calendarGridHtml = dayCells.join('');

    const heatmapHtml = `
      <!-- Heatmap Calendar Grid -->
      <div class="relative overflow-hidden bg-surface-card border border-divider rounded-2xl p-5 shadow-sm flex flex-col gap-4">
        <div class="absolute top-0 left-0 right-0 h-1" style="background-color: ${themeHex};"></div>
        <div class="flex justify-between items-center border-b border-slate-50 pb-2">
          <div class="flex items-center gap-3">
            <button 
              type="button"
              onclick="window.HabitInsightPagePrevMonth()"
              class="w-6 h-6 rounded-full border border-divider bg-surface-card text-text-secondary hover:text-text-primary transition-colors shadow-sm flex items-center justify-center active:scale-95 cursor-pointer"
            >
              <i data-lucide="chevron-left" class="w-3.5 h-3.5"></i>
            </button>
            <h3 class="text-label-muted">${monthName} ${currentYear}</h3>
            <button 
              type="button"
              onclick="window.HabitInsightPageNextMonth()"
              class="w-6 h-6 rounded-full border border-divider bg-surface-card text-text-secondary hover:text-text-primary transition-colors shadow-sm flex items-center justify-center active:scale-95 cursor-pointer"
            >
              <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
            </button>
          </div>
          <span class="text-[9px] font-bold text-text-primary uppercase">Monthly Check-ins</span>
        </div>
        
        <div class="flex flex-col gap-2">
          <div class="grid grid-cols-7 gap-1">
            ${calendarHeaderHtml}
          </div>
          <div class="grid grid-cols-7 gap-y-2.5 gap-x-1 pt-1.5">
            ${calendarGridHtml}
          </div>
        </div>
        
        <!-- Heatmap Legend -->
        <div class="flex items-center gap-4 text-[9px] font-bold text-text-secondary uppercase pt-2 border-t border-slate-50">
          <div class="flex items-center gap-1.5">
            <div class="w-3.5 h-3.5 rounded-full border border-divider bg-surface-card"></div>
            <span>Missed</span>
          </div>
          <div class="flex items-center gap-1.5">
            <div class="w-3.5 h-3.5 rounded-full border ${softBorderClass}"></div>
            <span>Quick Tick</span>
          </div>
          <div class="flex items-center gap-1.5">
            <div class="w-3.5 h-3.5 rounded-full ${pastelBg}"></div>
            <span>Detailed Log</span>
          </div>
        </div>
      </div>
    `;

    // Number stats
    let numberStatsHtml = "";
    if (habit.type === 'number') {
      const numStats = state.getNumberStats(habit.id);
      const hasMin = habit.minGoal !== null && habit.minGoal !== undefined && habit.minGoal !== "";
      const hasMax = habit.maxGoal !== null && habit.maxGoal !== undefined && habit.maxGoal !== "";
      let budgetText = "";
      if (hasMin && hasMax) budgetText = `${habit.minGoal}–${habit.maxGoal}`;
      else if (hasMin) budgetText = `≥ ${habit.minGoal}`;
      else if (hasMax) budgetText = `≤ ${habit.maxGoal}`;

      numberStatsHtml = `
        <div class="bg-surface-card border border-divider rounded-2xl p-5 shadow-sm flex flex-col gap-4">
          <h3 class="text-label-muted">Numeric Target Analysis</h3>
          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col border-r border-divider pr-2">
              <span class="text-[10px] text-text-secondary font-bold uppercase tracking-wider">Target Budget</span>
              <span class="text-sm font-extrabold text-text-primary mt-1">${budgetText || 'No bounds'} ${habit.unit || ''}</span>
            </div>
            <div class="flex flex-col">
              <span class="text-[10px] text-text-secondary font-bold uppercase tracking-wider">Daily Average (30d)</span>
              <span class="text-sm font-extrabold text-text-primary mt-1">${numStats.avg30} ${habit.unit || ''}</span>
            </div>
          </div>
          
          <div class="grid grid-cols-3 gap-3 border-t border-slate-50 pt-4">
            <div class="flex flex-col">
              <span class="text-[8px] font-bold text-text-secondary uppercase">Min Logged</span>
              <span class="text-xs font-bold text-text-primary mt-0.5">${numStats.min}</span>
            </div>
            <div class="flex flex-col">
              <span class="text-[8px] font-bold text-text-secondary uppercase">Max Logged</span>
              <span class="text-xs font-bold text-text-primary mt-0.5">${numStats.max}</span>
            </div>
            <div class="flex flex-col">
              <span class="text-[8px] font-bold text-text-secondary uppercase">On-Target Rate</span>
              <span class="text-xs font-bold text-text-primary mt-0.5">${numStats.onTargetRate}%</span>
            </div>
          </div>

          <div class="mt-2 py-2 px-3 rounded-xl border border-divider bg-surface-sunken dark:bg-slate-800/40 flex items-center justify-between text-xs font-semibold">
            <span class="text-text-secondary">Value Trend direction:</span>
            <span class="flex items-center gap-1 text-text-primary font-bold">
              <i data-lucide="${numStats.trend === 'Trending Up' ? 'trending-up' : numStats.trend === 'Trending Down' ? 'trending-down' : 'minus'}" class="w-3.5 h-3.5"></i>
              ${numStats.trend}
            </span>
          </div>
        </div>
      `;
    }

    // Value trend line chart (last 30 days)
    let valueChartHtml = "";
    if (habit.type === 'number') {
      const chartW = 320;
      const chartH = 140;
      const padX = 35;
      const padY = 20;
      const innerW = chartW - padX * 2;
      const innerH = chartH - padY * 2;

      // Collect dynamic days of data based on first logged value
      const validLogs = state.checkIns
        .filter(l => l.habitId === habit.id && l.value !== null && l.value !== undefined)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      if (validLogs.length >= 1) {
        const oldestDate = new Date(validLogs[0].date);
        const today = new Date();
        today.setHours(0,0,0,0);
        oldestDate.setHours(0,0,0,0);

        const pageSize = 30;
        const chartOffset = HabitInsightPage.viewedChartOffset || 0;

        const pageEndDate = new Date(today);
        pageEndDate.setDate(today.getDate() + (chartOffset * pageSize));

        const pageStartDate = new Date(pageEndDate);
        pageStartDate.setDate(pageEndDate.getDate() - (pageSize - 1));

        // Constrain start date to oldest log date
        if (pageStartDate < oldestDate) {
          pageStartDate.setTime(oldestDate.getTime());
        }

        const pageTime = Math.abs(pageEndDate - pageStartDate);
        const pageSpanDays = Math.ceil(pageTime / (1000 * 60 * 60 * 24)) + 1;
        const hasOlderData = pageStartDate > oldestDate;

        const dataPoints = [];
        for (let i = pageSpanDays - 1; i >= 0; i--) {
          const d = new Date(pageEndDate);
          d.setDate(pageEndDate.getDate() - i);
          const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          const log = state.checkIns.find(l => l.habitId === habit.id && l.date === dateStr);
          const val = (log && log.value !== null && log.value !== undefined) ? parseFloat(log.value) : null;
          dataPoints.push({ date: dateStr, value: val });
        }

        const validValues = dataPoints.filter(p => p.value !== null).map(p => p.value);
        if (validValues.length >= 1) {
          // Prepare labels and clean data arrays
          const labels = dataPoints.map(p => {
            return new Date(p.date).toLocaleDateString('default', { month: 'short', day: 'numeric' });
          });
          const values = dataPoints.map(p => p.value);

          // Save metadata on window so bindEvents can initialize Chart.js
          window.currentChartConfig = {
            labels,
            values,
            themeHex,
            unit: habit.unit || 'units',
            minGoal: habit.minGoal ? parseFloat(habit.minGoal) : null,
            maxGoal: habit.maxGoal ? parseFloat(habit.maxGoal) : null
          };

          valueChartHtml = `
            <div class="relative overflow-hidden bg-surface-card border border-divider rounded-2xl p-5 shadow-sm flex flex-col gap-3">
              <div class="absolute top-0 left-0 right-0 h-1" style="background-color: ${themeHex};"></div>
              <div class="flex justify-between items-center mb-1">
                <div class="flex items-center gap-2">
                  <button 
                    type="button"
                    onclick="window.HabitInsightPagePrevChartRange()"
                    class="w-5 h-5 rounded-full border border-divider bg-surface-card text-text-secondary hover:text-text-primary transition-colors shadow-sm flex items-center justify-center active:scale-95 cursor-pointer"
                    ${!hasOlderData ? 'disabled style="opacity: 0.3; cursor: not-allowed;"' : ''}
                  >
                    <i data-lucide="chevron-left" class="w-3 h-3"></i>
                  </button>
                  <h3 class="text-label-muted">Value Trend (${pageSpanDays} Days)</h3>
                  <button 
                    type="button"
                    onclick="window.HabitInsightPageNextChartRange()"
                    class="w-5 h-5 rounded-full border border-divider bg-surface-card text-text-secondary hover:text-text-primary transition-colors shadow-sm flex items-center justify-center active:scale-95 cursor-pointer"
                    ${chartOffset >= 0 ? 'disabled style="opacity: 0.3; cursor: not-allowed;"' : ''}
                  >
                    <i data-lucide="chevron-right" class="w-3 h-3"></i>
                  </button>
                </div>
                <span class="text-[9px] font-bold text-text-secondary uppercase">${habit.unit || 'units'}</span>
              </div>
              <div class="w-full relative h-40">
                <canvas id="habit-trend-chart"></canvas>
              </div>
            </div>
          `;
        } else {
          // Fallback locked placeholder when validValues length is insufficient
          valueChartHtml = `
            <div class="relative overflow-hidden bg-surface-card border border-divider rounded-2xl p-5 text-center flex flex-col items-center justify-center min-h-[140px] shadow-sm">
              <div class="absolute top-0 left-0 right-0 h-1" style="background-color: ${themeHex};"></div>
              <div class="w-8 h-8 rounded-full bg-surface-sunken border border-divider flex items-center justify-center text-text-secondary mb-2">
                <i data-lucide="lock" class="w-3.5 h-3.5"></i>
              </div>
              <span class="text-xs font-bold text-text-primary">Value Trend Locked</span>
              <span class="text-[10px] text-text-secondary mt-1 max-w-[220px] leading-relaxed">
                Log at least 1 check-in with a metric value to see your progress chart.
              </span>
            </div>
          `;
        }
      } else {
        // Fallback locked placeholder when validLogs length is insufficient
        valueChartHtml = `
          <div class="relative overflow-hidden bg-surface-card border border-divider rounded-2xl p-5 text-center flex flex-col items-center justify-center min-h-[140px] shadow-sm">
            <div class="absolute top-0 left-0 right-0 h-1" style="background-color: ${themeHex};"></div>
            <div class="w-8 h-8 rounded-full bg-surface-sunken border border-divider flex items-center justify-center text-text-secondary mb-2">
              <i data-lucide="lock" class="w-3.5 h-3.5"></i>
            </div>
            <span class="text-xs font-bold text-text-primary">Value Trend Locked</span>
            <span class="text-[10px] text-text-secondary mt-1 max-w-[220px] leading-relaxed">
              Log at least 1 check-in with a metric value to see your progress chart.
            </span>
          </div>
        `;
      }
    }

    // Tag frequency HTML
    let tagsBreakdownHtml = "";
    if (habit.tags && habit.tags.length > 0) {
      if (tagsFrequency.length > 0) {
        const maxCount = tagsFrequency[0].count || 1;
        const barsHtml = tagsFrequency.map(tf => {
          const pct = Math.round((tf.count / maxCount) * 100);
          return `
            <div class="flex items-center gap-3.5 w-full text-xs">
              <span class="text-[11px] font-bold text-text-primary w-20 truncate flex-shrink-0" title="${tf.name}">${tf.name}</span>
              <div class="flex-grow bg-surface-sunken border border-divider/60 h-3 rounded-full overflow-hidden relative">
                <div class="bg-accentBlue h-full rounded-full transition-all duration-500 ease-out" style="width: ${pct}%;"></div>
              </div>
              <span class="text-[10px] font-bold text-text-secondary w-8 text-right flex-shrink-0">${tf.count}x</span>
            </div>
          `;
        }).join('');

        tagsBreakdownHtml = `
          <div class="relative overflow-hidden bg-surface-card border border-divider rounded-2xl p-5 shadow-sm flex flex-col gap-3">
            <div class="absolute top-0 left-0 right-0 h-1" style="background-color: ${themeHex};"></div>
            <div class="flex justify-between items-center mb-1">
              <h3 class="text-label-muted">Tag Frequency Breakdown</h3>
              <span class="text-[9px] font-bold text-text-secondary uppercase">Tags used</span>
            </div>
            <div class="flex flex-col gap-3 pt-1">
              ${barsHtml}
            </div>
          </div>
        `;
      } else {
        // Fallback locked placeholder when tags are configured but not logged yet
        tagsBreakdownHtml = `
          <div class="relative overflow-hidden bg-surface-card border border-divider rounded-2xl p-5 text-center flex flex-col items-center justify-center min-h-[140px] shadow-sm">
            <div class="absolute top-0 left-0 right-0 h-1" style="background-color: ${themeHex};"></div>
            <div class="w-8 h-8 rounded-full bg-surface-sunken border border-divider flex items-center justify-center text-text-secondary mb-2">
              <i data-lucide="lock" class="w-3.5 h-3.5"></i>
            </div>
            <span class="text-xs font-bold text-text-primary">Tag Distribution Locked</span>
            <span class="text-[10px] text-text-secondary mt-1 max-w-[220px] leading-relaxed">
              Log at least 1 check-in with tags selected to unlock your tag breakdown.
            </span>
          </div>
        `;
      }
    }

    // Recent Notes HTML
    let notesFeedHtml = "";
    if (recentNotes.length > 0) {
      const feedsHtml = recentNotes.map(n => {
        const formattedDate = new Date(n.date).toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' });
        return `
          <div class="border-b border-divider last:border-0 pb-3 last:pb-0 flex flex-col gap-1 text-xs">
            <div class="flex justify-between items-center text-[9px] font-bold text-text-secondary uppercase">
              <span>${formattedDate}</span>
              ${n.value !== null && n.value !== undefined ? `<span class="bg-surface-sunken px-1.5 py-0.5 rounded text-text-secondary">${n.value} ${habit.unit || ''}</span>` : ''}
            </div>
            <p class="text-text-primary italic font-medium leading-relaxed mt-0.5">"${n.note}"</p>
          </div>
        `;
      }).join('');

      notesFeedHtml = `
        <div class="relative overflow-hidden bg-surface-card border border-divider rounded-2xl p-5 shadow-sm flex flex-col gap-4">
          <div class="absolute top-0 left-0 right-0 h-1" style="background-color: ${themeHex};"></div>
          <h3 class="text-label-muted">Recent Notes Feed</h3>
          <div class="flex flex-col gap-3">
            ${feedsHtml}
          </div>
        </div>
      `;
    }

    const weekStatus = state.getCurrentWeekStatus(habit.id);
    const completedDaysThisWeek = weekStatus.filter(d => d.isCompleted).length;
    const weekCompletionPct = Math.round((completedDaysThisWeek / 7) * 100);

    const weekDaysHtml = weekStatus.map(day => {
      const activeDotBg = day.isCompleted ? `background-color: ${themeHex}; border-color: transparent;` : 'background-color: #e2e8f0; border-color: transparent;';
      return `
        <div class="flex flex-col items-center gap-1 flex-1">
          <div class="w-6 h-6 rounded-full border transition-all duration-300" style="${activeDotBg}"></div>
          <span class="text-[9px] font-bold text-text-secondary uppercase mt-1">${day.dayName}</span>
        </div>
      `;
    }).join('');

    const thisWeekCardHtml = `
      <div class="relative overflow-hidden bg-surface-card border border-divider rounded-2xl p-5 shadow-sm flex items-center gap-5">
        <div class="absolute top-0 left-0 right-0 h-1" style="background-color: ${themeHex};"></div>
        <div class="relative w-16 h-16 flex items-center justify-center flex-shrink-0">
          <svg class="absolute w-full h-full transform -rotate-90">
            <circle cx="32" cy="32" r="26" stroke="#f1f5f9" stroke-width="4.5" fill="transparent" />
            <circle cx="32" cy="32" r="26" stroke="${themeHex}" stroke-width="4.5" fill="transparent"
              stroke-dasharray="163.362" stroke-dashoffset="${163.362 - (163.362 * weekCompletionPct) / 100}"
              stroke-linecap="round" class="transition-all duration-500" />
          </svg>
          <span class="text-xs font-bold text-text-primary">${weekCompletionPct}%</span>
        </div>

        <div class="flex flex-col gap-2.5 flex-grow">
          <div>
            <h3 class="text-[9px] font-bold text-text-primary uppercase">THIS WEEK</h3>
            <span class="text-[10px] text-text-secondary font-semibold mt-1 inline-block">${completedDaysThisWeek} of 7 days</span>
          </div>
          <div class="flex items-center justify-between w-full gap-1">
            ${weekDaysHtml}
          </div>
        </div>
      </div>
    `;

    const uniqueDays = new Set(state.checkIns.map(l => l.date)).size;
    const isLocked = uniqueDays < 7;
    
    let habitBehavioralHtml = "";
    if (isLocked) {
      const progressPct = Math.round((uniqueDays / 7) * 100);
      habitBehavioralHtml = `
        <div class="flex flex-col gap-2.5">
          <h3 class="text-label-muted">Behavioral Insights</h3>
          <div class="relative overflow-hidden bg-surface-card border border-divider rounded-2xl p-5 pt-6 shadow-sm flex flex-col items-center text-center gap-4">
            <div class="absolute top-0 left-0 right-0 h-1" style="background-color: ${themeHex};"></div>
            
            <div class="w-10 h-10 rounded-full bg-surface-sunken border border-divider flex items-center justify-center text-text-secondary">
              <i data-lucide="lock" class="w-4 h-4"></i>
            </div>
            
            <div class="flex flex-col gap-1">
              <span class="text-xs font-bold text-text-primary">Insights Locked</span>
              <span class="text-[10px] text-text-secondary max-w-[200px] leading-relaxed">
                Log for ${7 - uniqueDays} more day${7 - uniqueDays > 1 ? 's' : ''} to unlock personalized bounce-back strategies and keystone habit links.
              </span>
            </div>

            <div class="w-full mt-2">
              <div class="w-full bg-surface-sunken rounded-full h-1.5 overflow-hidden">
                <div class="h-full rounded-full transition-all duration-500 ease-out" style="background-color: ${themeHex}; width: ${progressPct}%"></div>
              </div>
              <span class="text-[9px] font-bold text-text-secondary mt-2 block uppercase tracking-wider">${progressPct}% Data Gathered</span>
            </div>
          </div>
        </div>
      `;
    } else {
      const b = state.getAdvancedBehavioralInsights();
      if (b && b.perHabitStats) {
        const stat = b.perHabitStats.find(s => s.habit.id === habit.id);

        let insightsList = [];
        if (stat) {
          if (stat.missedWeeks >= 2) {
            const rate = Math.round((stat.recoveredWeeks / stat.missedWeeks) * 100);
            if (rate > 0) {
              insightsList.push({
                title: rate >= 50 ? "Strong Comebacks" : "Comeback Opportunity",
                text: rate >= 50 
                  ? `When you miss a weekly goal, you bounce back and hit it the next week ${rate}% of the time!` 
                  : `You recover your weekly targets ${rate}% of the time. Don't let a bad week keep you down.`,
                icon: 'refresh-cw'
              });
            }
          }
          if (stat.zeroLogWeeks >= 1) {
            const rate = Math.round((stat.savedWeeks / stat.zeroLogWeeks) * 100);
            if (rate > 0) {
              insightsList.push({
                title: rate >= 50 ? "Slump Resistant" : "Slump Warning",
                text: rate >= 50 
                  ? `After a week of 0 check-ins, you return to log at least once the next week ${rate}% of the time.` 
                  : `After a week of 0 check-ins, you only return ${rate}% of the time. Focus on doing just 1 rep to keep the habit alive!`,
                icon: 'shield'
              });
            }
          }
          if (stat.successfulWeeks >= 2) {
            const rate = Math.round((stat.momentumWeeks / stat.successfulWeeks) * 100);
            if (rate > 0) {
              insightsList.push({
                title: rate >= 60 ? "Momentum Master" : "Building Momentum",
                text: rate >= 60
                  ? `Once you hit your target, you hit it again the next week ${rate}% of the time.`
                  : `You chain successful weeks together ${rate}% of the time.`,
                icon: 'zap'
              });
            }
          }
          const totalLogs = stat.totalWeekdayLogs + stat.totalWeekendLogs;
          if (totalLogs >= 5) {
            const weekdayAvg = stat.totalWeekdayLogs / 20;
            const weekendAvg = stat.totalWeekendLogs / 8;
            if (weekendAvg > weekdayAvg * 1.2) {
              insightsList.push({
                title: "Weekend Warrior",
                text: `You log significantly more often on weekends. Great way to use your free time!`,
                icon: 'sun'
              });
            } else if (weekdayAvg > weekendAvg * 1.2) {
              insightsList.push({
                title: "Weekday Hero",
                text: `Your consistency thrives during the workweek but drops on weekends.`,
                icon: 'briefcase'
              });
            }
          }
        }
        
        if (insightsList.length === 0) {
          insightsList.push({
            title: "Data Gathering",
            text: "Keep logging to unlock personalized insights like Comeback Rate and Slump Prevention.",
            icon: 'bar-chart'
          });
        }

        const cardsHtml = insightsList.map((insight) => `
          <div class="flex items-start gap-3 border-b border-divider pb-4 last:border-0 last:pb-0 mt-4 first:mt-0">
            <div class="w-8 h-8 rounded-full bg-surface-sunken border border-divider flex items-center justify-center flex-shrink-0">
              <i data-lucide="${insight.icon}" class="w-4 h-4 text-text-primary"></i>
            </div>
            <div class="flex flex-col">
              <span class="text-xs font-bold text-text-primary">${insight.title}</span>
              <p class="text-[10px] text-text-secondary mt-0.5 leading-relaxed">${insight.text}</p>
            </div>
          </div>
        `).join('');

        habitBehavioralHtml = `
          <div class="relative bg-surface-card border border-divider rounded-2xl p-5 shadow-sm overflow-hidden flex flex-col gap-4 pt-6">
            <div class="absolute top-0 left-0 right-0 h-1" style="background-color: ${themeHex};"></div>
            <h3 class="text-label-muted">Behavioral Insights</h3>
            <div class="flex flex-col">
              ${cardsHtml}
            </div>
          </div>
        `;
      }
    }

    // ── Manage Habit Actions Group Card ──
    const manageHabitCardHtml = `
      <div class="mt-5 mb-2.5 flex items-center">
        <h3 class="text-label-muted">Manage Habit</h3>
      </div>

      <div class="relative bg-surface-card border border-divider rounded-2xl shadow-sm overflow-hidden flex flex-col mb-8 pt-1">
        <div class="absolute top-0 left-0 right-0 h-1" style="background-color: ${themeHex};"></div>
        
        <!-- Row 1: Edit Row -->
        <div class="flex flex-col p-4 border-b border-divider">
          <div class="flex justify-between items-center">
            <div class="flex flex-col gap-0.5">
              <span class="text-xs font-bold text-text-primary">Edit Goals & Parameters</span>
              <span class="text-[10px] text-text-secondary font-medium leading-relaxed">Modify name, type, targets, and parameters.</span>
            </div>
            <button 
              type="button"
              id="habit-edit-toggle-btn"
              onclick="window.HabitInsightPageToggleEditor()"
              class="w-8 h-8 rounded-full border border-divider bg-surface-card flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-sunken transition-all shadow-sm flex-shrink-0"
            >
              <i data-lucide="settings" class="w-3.5 h-3.5"></i>
            </button>
          </div>

          <!-- Inline editor block -->
          <div id="habit-goal-editor-panel" class="${this.isEditing ? '' : 'hidden'} flex flex-col gap-4 pt-4 mt-2 border-t border-divider animate-fade-in">
            <!-- Habit Name -->
            <div class="flex flex-col gap-1.5 text-xs">
              <span class="text-[9px] font-bold text-text-secondary uppercase">Habit Name</span>
              <input 
                type="text" 
                id="edit-goal-name"
                value="${habit.name}" 
                class="border border-divider rounded-xl px-3 py-2 text-sm font-bold bg-surface-card text-text-primary focus:outline-none focus:border-slate-900"
              />
            </div>

             <!-- Weekly Target -->
            <div class="flex flex-col gap-1.5 text-xs">
              <span class="text-[9px] font-bold text-text-secondary uppercase">Weekly Target</span>
              <select 
                id="edit-goal-weekly"
                class="border border-divider rounded-xl px-3 py-2 focus:outline-none bg-surface-card text-text-primary font-bold"
              >
                ${[1, 2, 3, 4, 5, 6, 7].map(num => `<option value="${num}" ${habit.weeklyTarget === num ? 'selected' : ''}>${num} days / wk</option>`).join('')}
              </select>
            </div>

            <!-- Custom Schedule Toggle -->
            <div class="mt-1 border-t border-divider pt-2">
              <label class="flex items-center gap-2 mt-2 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  id="edit-schedule-toggle" 
                  class="w-3.5 h-3.5 border border-divider rounded accent-accentBlue cursor-pointer"
                  ${activeDays.length > 0 ? 'checked' : ''}
                  onchange="window.HabitInsightPageToggleSchedule(this.checked)"
                />
                <span class="text-[10px] text-text-secondary font-bold uppercase tracking-wide">Schedule on specific weekdays</span>
              </label>
              
              <div id="edit-schedule-days-wrapper" class="${activeDays.length > 0 ? '' : 'hidden'} flex justify-between items-center gap-1 mt-2.5 bg-surface-sunken p-2 rounded-xl border border-divider/50">
                ${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
                  const isSelected = activeDays.includes(day);
                  return `
                    <button 
                      type="button" 
                      data-edit-day="${day}"
                      onclick="window.HabitInsightPageToggleEditDay('${day}')"
                      class="edit-day-chip-btn w-8 h-8 rounded-lg border font-bold text-[10px] flex items-center justify-center transition-all ${
                        isSelected 
                          ? 'border-accentBlue bg-accentBlue text-white shadow-sm' 
                          : 'border-divider bg-surface-card text-text-secondary hover:border-divider hover:text-text-primary'
                      }"
                    >
                      ${day.slice(0, 1)}
                    </button>
                  `;
                }).join('')}
              </div>
              
              <!-- Validation Tip -->
              <p id="edit-schedule-validation-tip" class="hidden text-[9px] text-rose-500 font-semibold mt-1.5">
                <i data-lucide="alert-circle" class="w-3 h-3 inline mr-1"></i>
                Please select at least <span id="edit-required-days-count">${habit.weeklyTarget}</span> day(s) to match your weekly target.
              </p>
            </div>

            <!-- Optional Metric Tracking Toggle -->
            <div class="mt-1 border-t border-divider pt-2">
              <label class="flex items-center gap-2 mt-2 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  id="edit-enable-metric-toggle" 
                  class="w-3.5 h-3.5 border border-divider rounded accent-accentBlue cursor-pointer"
                  ${this.editorType === 'number' ? 'checked' : ''}
                />
                <span class="text-[10px] text-text-secondary font-bold uppercase tracking-wide">Track Optional Metric</span>
              </label>
            </div>

            <!-- Metric specific inputs -->
            <div id="edit-goal-metric-fields" class="${this.editorType === 'number' ? '' : 'hidden'} flex flex-col gap-3">
              <div class="grid grid-cols-3 gap-2.5 text-xs pt-2 border-t border-divider">
                <div class="flex flex-col gap-1.5">
                  <span class="text-[9px] font-bold text-text-secondary uppercase">Unit</span>
                  <input 
                    type="text" 
                    id="edit-goal-unit"
                    value="${habit.unit || ''}" 
                    placeholder="e.g. ml, steps"
                    class="border border-divider rounded-xl px-3 py-2 text-xs font-bold bg-surface-card text-text-primary focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div class="flex flex-col gap-1.5">
                  <span class="text-[9px] font-bold text-text-secondary uppercase">Min Target</span>
                  <input 
                    type="number" 
                    id="edit-goal-min"
                    value="${habit.minGoal ?? ''}" 
                    placeholder="None"
                    class="border border-divider rounded-xl px-3 py-2 text-xs font-bold bg-surface-card text-text-primary focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div class="flex flex-col gap-1.5">
                  <span class="text-[9px] font-bold text-text-secondary uppercase">Max Target</span>
                  <input 
                    type="number" 
                    id="edit-goal-max"
                    value="${habit.maxGoal ?? ''}" 
                    placeholder="None"
                    class="border border-divider rounded-xl px-3 py-2 text-xs font-bold bg-surface-card text-text-primary focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>
            </div>

            <!-- Save Action Button -->
            <button 
              type="button" 
              onclick="window.HabitInsightPageSaveGoals('${habit.id}')"
              class="w-full bg-slate-900 text-white rounded-xl py-2.5 text-xs font-bold hover:bg-slate-850 active:scale-[0.99] transition-all shadow-sm mt-2"
            >
              Save Parameters
            </button>
          </div>
        </div>

        <!-- Row 2: Pause / Resume Habit Row -->
        <div class="flex justify-between items-center p-4 border-b border-divider">
          <div class="flex flex-col gap-0.5">
            <span class="text-xs font-bold text-text-primary">${habit.paused ? 'Resume Tracking' : 'Pause Tracking'}</span>
            <span class="text-[10px] text-text-secondary font-medium leading-relaxed">Temporarily freeze streaks without failing.</span>
          </div>
          <button 
            type="button" 
            onclick="window.HabitInsightPageTogglePause('${habit.id}')"
            class="w-8 h-8 rounded-full border border-divider bg-surface-card flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-sunken transition-all shadow-sm flex-shrink-0"
          >
            <i data-lucide="${habit.paused ? 'play' : 'pause'}" class="w-3.5 h-3.5"></i>
          </button>
        </div>

        <!-- Row 3: Delete Habit Row -->
        <div class="flex justify-between items-center p-4">
          <div class="flex flex-col gap-0.5">
            <span class="text-xs font-bold text-text-primary">Delete Habit</span>
            <span class="text-[10px] text-text-secondary font-medium leading-relaxed">Permanently delete this habit and all history.</span>
          </div>
          <button 
            type="button" 
            onclick="window.HabitInsightPageDelete('${habit.id}', '${habit.name.replace(/'/g, "\\\\'")}')"
            class="w-8 h-8 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 hover:bg-rose-100 transition-all shadow-sm flex-shrink-0"
          >
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        </div>

      </div>
    `;

    if (isInsightsLocked) {
      const progressPct = Math.round((progressDays / 7) * 100);
      return `
        <div id="habit-insights-view" class="flex flex-col gap-5 pb-24 animate-fade-in">
          <!-- Header row with Back Button -->
          <div class="flex items-center gap-4">
            <button 
              type="button"
              onclick="window.HabitInsightPageBack()"
              class="flex items-center justify-center w-8 h-8 rounded-full border border-divider bg-surface-card text-text-secondary hover:text-text-primary transition-colors shadow-sm flex-shrink-0"
            >
              <i data-lucide="arrow-left" class="w-4 h-4"></i>
            </button>
            <div class="flex flex-col min-w-0 gap-1">
              <span class="text-[9px] font-extrabold text-text-secondary uppercase tracking-widest">${categoryLabel} Analysis</span>
              <h1 class="text-base sm:text-lg font-extrabold text-text-primary break-words leading-tight">${habit.name}</h1>
              <div class="flex flex-wrap gap-1.5 items-center mt-0.5">
                ${targetBadgeHtml}
                ${scheduleBadgeHtml}
                ${metricBadgeHtml}
              </div>
            </div>
          </div>

          <!-- This Week Status Card -->
          ${thisWeekCardHtml}

          <!-- Lock Card -->
          <div class="relative overflow-hidden bg-surface-card border border-divider rounded-2xl p-5 pt-6 shadow-sm flex flex-col items-center text-center gap-4">
            <div class="absolute top-0 left-0 right-0 h-1" style="background-color: ${themeHex};"></div>
            
            <div class="w-10 h-10 rounded-full bg-surface-sunken border border-divider flex items-center justify-center text-text-secondary">
              <i data-lucide="lock" class="w-4 h-4"></i>
            </div>
            
            <div class="flex flex-col gap-1.5 max-w-[240px]">
              <span class="text-xs font-bold text-text-primary">Insights Gathering...</span>
              <p class="text-[10px] text-text-secondary leading-normal">We need at least 7 days of age on this habit to generate meaningful trends, heatmaps, and behavioral analysis.</p>
            </div>

            <!-- Progress Bar -->
            <div class="w-full max-w-[200px] flex flex-col gap-1 mt-1">
              <div class="flex justify-between items-center text-[9px] font-bold text-text-secondary uppercase">
                <span>Progress</span>
                <span>${progressDays} / 7 Days</span>
              </div>
              <div class="w-full bg-surface-sunken h-2 rounded-full overflow-hidden">
                <div class="h-full rounded-full transition-all duration-500" style="background-color: ${themeHex}; width: ${progressPct}%;"></div>
              </div>
            </div>

            <!-- Preview list -->
            <div class="border-t border-divider w-full mt-2 pt-3 flex flex-col gap-2 text-left opacity-35 select-none pointer-events-none">
              <span class="text-[8px] font-bold text-text-secondary uppercase tracking-wider">Unlocks:</span>
              <div class="flex items-center gap-2 text-[10px] text-text-secondary">
                <i data-lucide="bar-chart-3" class="w-3.5 h-3.5"></i>
                <span>Weekly Consistency Trends</span>
              </div>
              <div class="flex items-center gap-2 text-[10px] text-text-secondary">
                <i data-lucide="grid-3x3" class="w-3.5 h-3.5"></i>
                <span>Activity Heatmap</span>
              </div>
              <div class="flex items-center gap-2 text-[10px] text-text-secondary">
                <i data-lucide="brain" class="w-3.5 h-3.5"></i>
                <span>Behavioral Analysis</span>
              </div>
            </div>
          </div>

          <!-- Heatmap Calendar Grid -->
          ${heatmapHtml}

          <!-- Tags Breakdown chart (Only if tags are used) -->
          ${tagsBreakdownHtml}

          <!-- Value trend line chart -->
          ${valueChartHtml}

          <!-- Notes Feed -->
          ${notesFeedHtml}

          <!-- Manage Habit Actions Group Card -->
          ${manageHabitCardHtml}
        </div>
      `;
    }

    return `
      <div id="habit-insights-view" class="flex flex-col gap-5 pb-24 animate-fade-in">
        
        <!-- Header row with Back Button -->
        <div class="flex items-center gap-4">
          <button 
            type="button"
            onclick="window.HabitInsightPageBack()"
            class="flex items-center justify-center w-8 h-8 rounded-full border border-divider bg-surface-card text-text-secondary hover:text-text-primary transition-colors shadow-sm flex-shrink-0"
          >
            <i data-lucide="arrow-left" class="w-4 h-4"></i>
          </button>
          <div class="flex flex-col min-w-0 gap-1">
            <span class="text-[9px] font-extrabold text-text-secondary uppercase tracking-widest">${categoryLabel} Analysis</span>
            <h1 class="text-base sm:text-lg font-extrabold text-text-primary break-words leading-tight">${habit.name}</h1>
            <div class="flex flex-wrap gap-1.5 items-center mt-0.5">
              ${targetBadgeHtml}
              ${scheduleBadgeHtml}
              ${metricBadgeHtml}
            </div>
          </div>
        </div>

        <!-- 3 combined stats cards -->
        <div class="grid grid-cols-3 gap-3">
          <div class="relative overflow-hidden bg-surface-card border border-divider rounded-2xl p-4 pt-5 shadow-sm flex flex-col justify-between min-h-[95px]">
            <div class="absolute top-0 left-0 right-0 h-1" style="background-color: ${themeHex};"></div>
            <span class="text-[9px] font-bold tracking-widest text-text-secondary uppercase">Week Streak</span>
            <div class="flex flex-col">
              <span class="text-2xl font-semibold text-text-primary leading-none">${weeklyStreak}w</span>
              <span class="text-[9px] font-bold text-text-secondary uppercase tracking-wide mt-1.5">Best: ${bestWeeklyStreak}w</span>
            </div>
          </div>

          <div class="relative overflow-hidden bg-surface-card border border-divider rounded-2xl p-4 pt-5 shadow-sm flex flex-col justify-between min-h-[95px]">
            <div class="absolute top-0 left-0 right-0 h-1" style="background-color: ${themeHex};"></div>
            <span class="text-[9px] font-bold tracking-widest text-text-secondary uppercase">${secondaryStreakName}</span>
            <div class="flex flex-col">
              <span class="text-2xl font-semibold text-text-primary leading-none">${secondaryStreak}${habit.weeklyTarget === 7 ? 'd' : 'w'}</span>
              <span class="text-[9px] font-bold text-text-secondary uppercase tracking-wide mt-1.5">${bestSecondaryStreakText}</span>
            </div>
          </div>

          <div class="relative overflow-hidden bg-surface-card border border-divider rounded-2xl p-4 pt-5 shadow-sm flex flex-col justify-between min-h-[95px]">
            <div class="absolute top-0 left-0 right-0 h-1" style="background-color: ${themeHex};"></div>
            <span class="text-[9px] font-bold tracking-widest text-text-secondary uppercase">Consistency</span>
            <div class="flex flex-col">
              <span class="text-2xl font-semibold text-text-primary leading-none">${monthlyRate}%</span>
              <span class="text-[9px] font-bold text-text-secondary uppercase tracking-wide mt-1.5">Log Fdl: ${fidelity}%</span>
            </div>
          </div>
        </div>

        <!-- This Week Status Card -->
        ${thisWeekCardHtml}

        <!-- Personalized Behavioral Insights -->
        ${habitBehavioralHtml}

        <!-- Heatmap Calendar Grid -->
        ${heatmapHtml}

        <!-- Value trend line chart -->
        ${valueChartHtml}

        <!-- Numeric analysis (Only for value/numeric habits) -->
        ${numberStatsHtml}

        <!-- Tags Breakdown chart (Only if tags are used) -->
        ${tagsBreakdownHtml}

        <!-- Notes Feed -->
        ${notesFeedHtml}

        <!-- Manage Habit Actions Group Card -->
        ${manageHabitCardHtml}

      </div>
    `;
  },

  bindEvents(state) {
    // Window-level handlers for month switching
    window.HabitInsightPagePrevMonth = () => {
      HabitInsightPage.viewedMonthOffset = (HabitInsightPage.viewedMonthOffset || 0) - 1;
      state.notify();
    };

    window.HabitInsightPageNextMonth = () => {
      HabitInsightPage.viewedMonthOffset = (HabitInsightPage.viewedMonthOffset || 0) + 1;
      state.notify();
    };

    window.HabitInsightPagePrevChartRange = () => {
      HabitInsightPage.viewedChartOffset = (HabitInsightPage.viewedChartOffset || 0) - 1;
      state.notify();
    };

    window.HabitInsightPageNextChartRange = () => {
      HabitInsightPage.viewedChartOffset = (HabitInsightPage.viewedChartOffset || 0) + 1;
      state.notify();
    };

    // Window-level handlers for bulletproof click reliability
    window.HabitInsightPageTogglePause = (habitId) => {
      state.togglePauseHabit(habitId);
    };

    window.HabitInsightPageDelete = (habitId, habitName) => {
      const confirmed = confirm(`Are you sure you want to delete "${habitName}"? This will erase all history.`);
      if (confirmed) {
        HabitInsightPage.selectedHabitId = null;
        state.deleteHabit(habitId);
      }
    };

    window.HabitInsightPageToggleEditor = () => {
      const habit = state.habits.find(h => h.id === HabitInsightPage.selectedHabitId);
      if (!habit) return;
      HabitInsightPage.isEditing = !HabitInsightPage.isEditing;
      if (HabitInsightPage.isEditing) {
        HabitInsightPage.editorType = habit.type;
      }
      state.notify();
    };

    window.HabitInsightPageToggleSchedule = (checked) => {
      const wrapper = document.getElementById('edit-schedule-days-wrapper');
      const tip = document.getElementById('edit-schedule-validation-tip');
      if (wrapper) wrapper.classList.toggle('hidden', !checked);
      if (!checked) {
        HabitInsightPage.editDays = [];
        document.querySelectorAll('.edit-day-chip-btn').forEach(btn => {
          btn.className = "edit-day-chip-btn w-8 h-8 rounded-lg border font-bold text-[10px] flex items-center justify-center transition-all border-divider bg-surface-card text-text-secondary hover:border-divider hover:text-text-primary";
        });
      }
      if (tip) tip.classList.add('hidden');
    };

    window.HabitInsightPageToggleEditDay = (day) => {
      HabitInsightPage.editDays = HabitInsightPage.editDays || [];
      const btn = document.querySelector(`[data-edit-day="${day}"]`);
      if (HabitInsightPage.editDays.includes(day)) {
        HabitInsightPage.editDays = HabitInsightPage.editDays.filter(d => d !== day);
        if (btn) btn.className = "edit-day-chip-btn w-8 h-8 rounded-lg border font-bold text-[10px] flex items-center justify-center transition-all border-divider bg-surface-card text-text-secondary hover:border-divider hover:text-text-primary";
      } else {
        HabitInsightPage.editDays.push(day);
        if (btn) btn.className = "edit-day-chip-btn w-8 h-8 rounded-lg border font-bold text-[10px] flex items-center justify-center transition-all border-accentBlue bg-accentBlue text-white shadow-sm";
      }

      // Check validation live
      const weeklyVal = parseInt(document.getElementById('edit-goal-weekly').value);
      const toggle = document.getElementById('edit-schedule-toggle');
      const tip = document.getElementById('edit-schedule-validation-tip');
      const countSpan = document.getElementById('edit-required-days-count');
      
      if (toggle && toggle.checked && tip && countSpan) {
        countSpan.textContent = weeklyVal;
        if (HabitInsightPage.editDays.length < weeklyVal) {
          tip.classList.remove('hidden');
        } else {
          tip.classList.add('hidden');
        }
      }
    };

    window.HabitInsightPageSaveGoals = (habitId) => {
      const habit = state.habits.find(h => h.id === habitId);
      if (!habit) return;

      const nameVal = document.getElementById('edit-goal-name').value.trim();
      const weeklyVal = parseInt(document.getElementById('edit-goal-weekly').value);
      const typeVal = HabitInsightPage.editorType;
      const scheduleChecked = document.getElementById('edit-schedule-toggle').checked;

      if (!nameVal) {
        alert("Please enter a valid habit name.");
        return;
      }

      // Enforce selectedDays.length >= weeklyTarget validation
      if (scheduleChecked) {
        const daysArray = HabitInsightPage.editDays || [];
        if (daysArray.length < weeklyVal) {
          const tip = document.getElementById('edit-schedule-validation-tip');
          const countSpan = document.getElementById('edit-required-days-count');
          if (tip && countSpan) {
            countSpan.textContent = weeklyVal;
            tip.classList.remove('hidden');
          }
          alert(`Please select at least ${weeklyVal} day(s) for your schedule.`);
          return;
        }
      }

      const oldWeeklyTarget = habit.weeklyTarget;
      habit.name = nameVal;
      habit.weeklyTarget = weeklyVal;
      habit.type = typeVal;
      habit.days = scheduleChecked ? [...(HabitInsightPage.editDays || [])] : null;

      if (oldWeeklyTarget !== weeklyVal) {
        habit.weeklyTargetHistory = habit.weeklyTargetHistory || [];
        if (habit.weeklyTargetHistory.length === 0) {
          const createdDateStr = state.formatDate(new Date(habit.createdAt));
          habit.weeklyTargetHistory.push({ date: createdDateStr, target: oldWeeklyTarget || 7 });
        }
        const todayStr = state.formatDate(new Date());
        const todayEntry = habit.weeklyTargetHistory.find(e => e.date === todayStr);
        if (todayEntry) {
          todayEntry.target = weeklyVal;
        } else {
          habit.weeklyTargetHistory.push({ date: todayStr, target: weeklyVal });
        }
      }

      if (typeVal === 'number') {
        const unitVal = document.getElementById('edit-goal-unit').value.trim();
        const minVal = document.getElementById('edit-goal-min').value;
        const maxVal = document.getElementById('edit-goal-max').value;

        habit.unit = unitVal || "";
        habit.minGoal = minVal !== "" ? parseFloat(minVal) : null;
        habit.maxGoal = maxVal !== "" ? parseFloat(maxVal) : null;
      } else {
        habit.unit = "";
        habit.minGoal = null;
        habit.maxGoal = null;
      }

      state.saveHabit(habit);
      
      HabitInsightPage.isEditing = false;
      HabitInsightPage.editorType = null;
      state.notify();
    };

    // Toggle metric fields live in edit panel
    const editMetricToggle = document.getElementById('edit-enable-metric-toggle');
    const editMetricFields = document.getElementById('edit-goal-metric-fields');
    if (editMetricToggle && editMetricFields) {
      editMetricToggle.addEventListener('change', (e) => {
        const isChecked = e.target.checked;
        HabitInsightPage.editorType = isChecked ? 'number' : 'checkbox';
        editMetricFields.classList.toggle('hidden', !isChecked);
      });
    }

    // Initialize Chart.js graph if the element exists
    const ctx = document.getElementById('habit-trend-chart');
    if (ctx && window.currentChartConfig && window.Chart) {
      const cfg = window.currentChartConfig;
      
      // Setup dynamic gradient helper
      const canvasCtx = ctx.getContext('2d');
      const gradient = canvasCtx.createLinearGradient(0, 0, 0, 160);
      gradient.addColorStop(0, cfg.themeHex + '33'); // 20% opacity
      gradient.addColorStop(1, cfg.themeHex + '00'); // 0% opacity

      const datasets = [{
        label: `Logged (${cfg.unit})`,
        data: cfg.values,
        borderColor: cfg.themeHex,
        borderWidth: 2,
        tension: 0.45,
        fill: true,
        backgroundColor: gradient,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointBackgroundColor: cfg.themeHex,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 1.5,
        spanGaps: true
      }];

      if (cfg.minGoal !== null && cfg.minGoal !== undefined) {
        datasets.push({
          label: `Min Target (${cfg.minGoal})`,
          data: Array(cfg.values.length).fill(cfg.minGoal),
          borderColor: '#94a3b8',
          borderWidth: 1.2,
          borderDash: [4, 4],
          pointRadius: 0,
          fill: false,
          spanGaps: true
        });
      }

      if (cfg.maxGoal !== null && cfg.maxGoal !== undefined) {
        datasets.push({
          label: `Max Target (${cfg.maxGoal})`,
          data: Array(cfg.values.length).fill(cfg.maxGoal),
          borderColor: '#94a3b8',
          borderWidth: 1.2,
          borderDash: [4, 4],
          pointRadius: 0,
          fill: false,
          spanGaps: true
        });
      }

      new window.Chart(ctx, {
        type: 'line',
        data: {
          labels: cfg.labels,
          datasets: datasets
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              mode: 'index',
              intersect: false,
              backgroundColor: '#1e293b',
              titleFont: { size: 10, weight: '600', family: 'Outfit' },
              bodyFont: { size: 10, family: 'Outfit' },
              padding: 8,
              cornerRadius: 8,
              displayColors: false
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: {
                maxTicksLimit: 3, // Start, middle, and end labels only
                font: { size: 9, weight: '600', family: 'Outfit' },
                color: '#94a3b8'
              },
              border: { display: false }
            },
            y: {
              grid: {
                color: '#f1f5f9',
                drawTicks: false
              },
              ticks: {
                maxTicksLimit: 3,
                font: { size: 9, weight: '600', family: 'Outfit' },
                color: '#94a3b8'
              },
              border: { display: false }
            }
          }
        }
      });
    }
  }
};
