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
      state.notify();
    };

    window.HabitInsightPageSetSubTab = (subTab) => {
      HabitInsightPage.activeSubTab = subTab;
      state.notify();
    };

    if (state.habits.length === 0) {
      return `
        <div id="habit-insights-view" class="flex flex-col gap-5 pb-24 animate-fade-in text-center py-10">
          <i data-lucide="line-chart" class="w-12 h-12 text-slate-300 mx-auto"></i>
          <h1 class="text-lg font-bold text-slate-800 mt-3">No Habits Found</h1>
          <p class="text-xs text-slate-500 max-w-xs mx-auto mt-1">Please create a habit first on the Add tab to begin tracking detailed insights.</p>
        </div>
      `;
    }

    // ── CASE A: Landings View (SelectedId is null) ──
    if (this.selectedHabitId === null) {
      const categoriesWithHabits = APP_CONFIG.categories
        .map(cat => ({
          ...cat,
          habits: state.habits.filter(h => h.category === cat.id)
        }))
        .filter(cat => cat.habits.length > 0);

      const groupedHtml = categoriesWithHabits.map(cat => {
        const gridItemsHtml = cat.habits.map(h => {
          const catColor = state.getCategoryColor(h.category);
          const dailyStreak = state.getDailyStreak(h.id);
          
          let subtitleHtml = '';
          if (h.paused) {
            subtitleHtml = `<span class="text-[9px] font-extrabold text-amber-500 uppercase flex items-center gap-0.5 mt-1 tracking-wider"><i data-lucide="pause" class="w-2.5 h-2.5"></i> Paused</span>`;
          } else if (dailyStreak > 0) {
            subtitleHtml = `<span class="text-[9px] font-extrabold text-amber-600 uppercase flex items-center gap-0.5 mt-1 tracking-wider"><i data-lucide="flame" class="w-2.5 h-2.5 fill-amber-500 text-amber-500"></i> ${dailyStreak}d</span>`;
          } else {
            subtitleHtml = `<span class="text-[9px] font-bold text-text-secondary mt-1 uppercase tracking-wider">Track</span>`;
          }

          return GridCard.render({
            id: h.id,
            name: h.name,
            category: h.category,
            icon: h.icon,
            actionAttr: `onclick="window.HabitInsightPageSelect('${h.id}')"`,
            subtitleHtml: subtitleHtml
          });
        }).join('');

        return `
          <div class="flex flex-col gap-3">
            <h3 class="text-[10px] font-extrabold tracking-widest uppercase text-slate-400">${cat.name}</h3>
            <div class="grid grid-cols-3 gap-4">
              ${gridItemsHtml}
            </div>
          </div>
        `;
      }).join('');

      return `
        <div id="habit-insights-selection-view" class="flex flex-col gap-6 pb-24 animate-fade-in">
          <div>
            <h1 class="text-xl font-bold text-slate-800">Habits</h1>
            <p class="text-xs text-slate-500 mt-1">Select any habit to inspect streaks, heatmap, and values.</p>
          </div>
          
          <div class="flex flex-col gap-5">
            ${groupedHtml}
          </div>
        </div>
      `;
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
    const isInsightsLocked = diffDays < 7;
    const daysRemaining = 7 - diffDays;

    const dailyStreak = state.getDailyStreak(habit.id);
    const bestDailyStreak = state.getBestDailyStreak(habit.id);
    const weeklyStreak = state.getWeeklyStreak(habit.id);
    const bestWeeklyStreak = state.getBestWeeklyStreak(habit.id);
    
    const monthlyRate = state.getCompletionRate(habit.id, 30);
    const fidelity = state.getLoggingFidelity(habit.id);
    const tagsFrequency = state.getTagFrequency(habit.id);
    const recentNotes = state.getRecentNotes(habit.id);

    const categoryMeta = APP_CONFIG.categories.find(cat => cat.id === habit.category);
    const categoryLabel = categoryMeta ? categoryMeta.name : 'General';

    // Build badges for header
    const targetBadgeHtml = `
      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-50 text-[9px] font-bold text-slate-500 border border-slate-200/60 flex-shrink-0">
        <i data-lucide="target" class="w-2.5 h-2.5"></i>
        Goal: ${habit.weeklyTarget}d/wk
      </span>
    `;

    const scheduleDaysStr = habit.days && habit.days.length > 0 ? habit.days.join(', ') : 'Everyday';
    const scheduleBadgeHtml = `
      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-50 text-[9px] font-bold text-slate-500 border border-slate-200/60 flex-shrink-0">
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
          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-50 text-[9px] font-bold text-slate-500 border border-slate-200/60 flex-shrink-0">
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

    const pastelBg = bgMap[catColor] || 'bg-slate-200';
    const pastelText = textMap[catColor] || 'text-slate-800';
    const softBorderClass = borderMap[catColor] || 'border-slate-200';

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
      .map(d => `<span class="text-[10px] font-bold text-slate-400 text-center uppercase">${d}</span>`).join('');

    const dayCells = [];
    for (let i = 0; i < startDayIdx; i++) {
      dayCells.push(`<div class="w-8 h-8"></div>`);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const log = state.checkIns.find(l => l.habitId === habit.id && l.date === dateStr);
      
      let isCompleted = log !== null && log !== undefined;
      if (habit.type === 'number' && log && log.value !== null && log.value !== undefined) {
        const val = log.value;
        const min = (habit.minGoal !== null && habit.minGoal !== undefined && habit.minGoal !== "") ? parseFloat(habit.minGoal) : -Infinity;
        const max = (habit.maxGoal !== null && habit.maxGoal !== undefined && habit.maxGoal !== "") ? parseFloat(habit.maxGoal) : Infinity;
        isCompleted = val >= min && val <= max;
      }

      const hasDetails = log && (
        (log.value !== null && log.value !== undefined) || 
        (log.note && log.note.trim() !== '') || 
        (log.tags && log.tags.length > 0)
      );

      let cellClass = "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border ";
      if (log) {
        if (habit.type === 'number' && log.value !== null && !isCompleted) {
          cellClass += "border-rose-400 bg-white text-rose-600 shadow-sm";
        } else if (hasDetails) {
          cellClass += `border-transparent ${pastelBg} ${pastelText} shadow-sm`;
        } else {
          cellClass += `border-transparent ${softBorderClass} ${pastelText}`;
        }
      } else {
        cellClass += "border-slate-100 bg-white text-slate-400 hover:border-slate-300";
      }

      dayCells.push(`
        <div class="flex items-center justify-center">
          <div class="${cellClass}">${day}</div>
        </div>
      `);
    }
    const calendarGridHtml = dayCells.join('');

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
        <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
          <h3 class="text-label-muted">Numeric Target Analysis</h3>
          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col border-r border-slate-100 pr-2">
              <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Target Budget</span>
              <span class="text-sm font-extrabold text-slate-800 mt-1">${budgetText || 'No bounds'} ${habit.unit || ''}</span>
            </div>
            <div class="flex flex-col">
              <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Daily Average (30d)</span>
              <span class="text-sm font-extrabold text-slate-800 mt-1">${numStats.avg30} ${habit.unit || ''}</span>
            </div>
          </div>
          
          <div class="grid grid-cols-3 gap-3 border-t border-slate-50 pt-4">
            <div class="flex flex-col">
              <span class="text-[8px] font-bold text-slate-400 uppercase">Min Logged</span>
              <span class="text-xs font-bold text-slate-700 mt-0.5">${numStats.min}</span>
            </div>
            <div class="flex flex-col">
              <span class="text-[8px] font-bold text-slate-400 uppercase">Max Logged</span>
              <span class="text-xs font-bold text-slate-700 mt-0.5">${numStats.max}</span>
            </div>
            <div class="flex flex-col">
              <span class="text-[8px] font-bold text-slate-400 uppercase">On-Target Rate</span>
              <span class="text-xs font-bold text-slate-700 mt-0.5">${numStats.onTargetRate}%</span>
            </div>
          </div>

          <div class="mt-2 py-2 px-3 rounded-xl border border-slate-100 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between text-xs font-semibold">
            <span class="text-slate-500">Value Trend direction:</span>
            <span class="flex items-center gap-1 text-slate-800 font-bold">
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

      // Collect last 30 days of data
      const today = new Date();
      const dataPoints = [];
      const dateLabels = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const log = state.checkIns.find(l => l.habitId === habit.id && l.date === dateStr);
        const val = (log && log.value !== null && log.value !== undefined) ? parseFloat(log.value) : null;
        dataPoints.push({ day: i, date: dateStr, value: val, dayLabel: d.getDate() });
        dateLabels.push(d.getDate());
      }

      const validValues = dataPoints.filter(p => p.value !== null).map(p => p.value);
      if (validValues.length >= 2) {
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
          <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-3">
            <div class="flex justify-between items-center mb-1">
              <h3 class="text-label-muted">Value Trend (30 Days)</h3>
              <span class="text-[9px] font-bold text-slate-400 uppercase">${habit.unit || 'units'}</span>
            </div>
            <div class="w-full relative h-40">
              <canvas id="habit-trend-chart"></canvas>
            </div>
          </div>
        `;
      }
    }

    // Tag frequency HTML
    let tagsBreakdownHtml = "";
    if (tagsFrequency.length > 0) {
      const maxCount = tagsFrequency[0].count || 1;
      const barsHtml = tagsFrequency.map(tf => {
        const pct = Math.round((tf.count / maxCount) * 100);
        return `
          <div class="flex flex-col gap-1.5 w-full text-xs">
            <div class="flex justify-between items-center text-[11px] font-semibold text-slate-700">
              <span>${tf.name}</span>
              <span>Used ${tf.count}x</span>
            </div>
            <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div class="bg-slate-900 h-full rounded-full transition-all duration-300" style="width: ${pct}%;"></div>
            </div>
          </div>
        `;
      }).join('');

      tagsBreakdownHtml = `
        <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
          <h3 class="text-label-muted">Sub-Tag Frequencies</h3>
          <div class="flex flex-col gap-3">
            ${barsHtml}
          </div>
        </div>
      `;
    }

    // Recent Notes HTML
    let notesFeedHtml = "";
    if (recentNotes.length > 0) {
      const feedsHtml = recentNotes.map(n => {
        const formattedDate = new Date(n.date).toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' });
        return `
          <div class="border-b border-slate-100 last:border-0 pb-3 last:pb-0 flex flex-col gap-1 text-xs">
            <div class="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase">
              <span>${formattedDate}</span>
              ${n.value !== null && n.value !== undefined ? `<span class="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">${n.value} ${habit.unit || ''}</span>` : ''}
            </div>
            <p class="text-slate-700 italic font-medium leading-relaxed mt-0.5">"${n.note}"</p>
          </div>
        `;
      }).join('');

      notesFeedHtml = `
        <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
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
          <span class="text-[9px] font-bold text-slate-400 uppercase mt-1">${day.dayName}</span>
        </div>
      `;
    }).join('');

    const thisWeekCardHtml = `
      <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-5">
        <div class="relative w-16 h-16 flex items-center justify-center flex-shrink-0">
          <svg class="absolute w-full h-full transform -rotate-90">
            <circle cx="32" cy="32" r="26" stroke="#f1f5f9" stroke-width="4.5" fill="transparent" />
            <circle cx="32" cy="32" r="26" stroke="${themeHex}" stroke-width="4.5" fill="transparent"
              stroke-dasharray="163.362" stroke-dashoffset="${163.362 - (163.362 * weekCompletionPct) / 100}"
              stroke-linecap="round" class="transition-all duration-500" />
          </svg>
          <span class="text-xs font-bold text-slate-800">${weekCompletionPct}%</span>
        </div>

        <div class="flex flex-col gap-2.5 flex-grow">
          <div>
            <h3 class="font-bold text-xs text-slate-800 leading-none">This week</h3>
            <span class="text-[10px] text-slate-400 font-semibold mt-1 inline-block">${completedDaysThisWeek} of 7 days</span>
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
          <div class="relative overflow-hidden bg-white border border-slate-200 rounded-2xl p-5 pt-6 shadow-sm flex flex-col items-center text-center gap-4">
            <div class="absolute top-0 left-0 right-0 h-1" style="background-color: ${themeHex};"></div>
            
            <div class="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
              <i data-lucide="lock" class="w-4 h-4"></i>
            </div>
            
            <div class="flex flex-col gap-1">
              <span class="text-xs font-bold text-slate-800">Insights Locked</span>
              <span class="text-[10px] text-slate-500 max-w-[200px] leading-relaxed">
                Log for ${7 - uniqueDays} more day${7 - uniqueDays > 1 ? 's' : ''} to unlock personalized bounce-back strategies and keystone habit links.
              </span>
            </div>

            <div class="w-full mt-2">
              <div class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div class="h-full rounded-full transition-all duration-500 ease-out" style="background-color: ${themeHex}; width: ${progressPct}%"></div>
              </div>
              <span class="text-[9px] font-bold text-slate-400 mt-2 block uppercase tracking-wider">${progressPct}% Data Gathered</span>
            </div>
          </div>
        </div>
      `;
    } else {
      const b = state.getBehavioralInsights();
      if (b) {
        const hb = b.habitBounceBacks.find(x => x.name === habit.name);
        const hs = b.habitSlumps.find(x => x.name === habit.name);
        const hStacks = b.keystoneStacks.filter(s => s.anchor === habit.name || s.follower === habit.name);

        let bounceBackText = "No recovery data logged yet.";
        if (hb) {
          bounceBackText = `You recover <strong>${hb.rate}%</strong> of the time on the day immediately following a missed log.`;
        }

        let slumpText = "Weekend tracking is stable.";
        let slumpIcon = "sparkles";
        let slumpBg = "bg-emerald-50/50 border-emerald-100 text-emerald-800";
        if (hs && hs.diff > 0) {
          slumpText = `Your consistency drops by <strong class="text-amber-700">${hs.diff}%</strong> on weekends compared to weekdays (${hs.weekdayRate}% weekdays vs ${hs.weekendRate}% weekends).`;
          slumpIcon = "sun";
          slumpBg = "bg-amber-50/50 border-amber-100 text-amber-800";
        }

        habitBehavioralHtml = `
          <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
            <h3 class="text-label-muted">Behavioral Insights</h3>
            
            <!-- Bounce-back -->
            <div class="flex items-start gap-3">
              <div class="w-8 h-8 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-500 flex-shrink-0">
                <i data-lucide="refresh-cw" class="w-4 h-4"></i>
              </div>
              <div class="flex flex-col gap-0.5 min-w-0">
                <span class="text-xs font-bold text-slate-800">Bounce-Back Strategy</span>
                <span class="text-[10px] text-slate-500 leading-normal">${bounceBackText}</span>
              </div>
            </div>

            <hr class="border-slate-200" />

            <!-- Weekend Performance -->
            <div class="flex items-start gap-3">
              <div class="w-8 h-8 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-500 flex-shrink-0">
                <i data-lucide="${slumpIcon}" class="w-4 h-4"></i>
              </div>
              <div class="flex flex-col gap-0.5 min-w-0">
                <span class="text-xs font-bold text-slate-800">Weekend Performance Variance</span>
                <span class="text-[10px] text-slate-500 leading-normal">${slumpText}</span>
              </div>
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

      <div class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col mb-8">
        
        <!-- Row 1: Edit Row -->
        <div class="flex flex-col p-4 border-b border-slate-100">
          <div class="flex justify-between items-center">
            <div class="flex flex-col gap-0.5">
              <span class="text-xs font-bold text-slate-800">Edit Goals & Parameters</span>
              <span class="text-[10px] text-slate-500 font-medium leading-relaxed">Modify name, type, targets, and parameters.</span>
            </div>
            <button 
              type="button"
              id="habit-edit-toggle-btn"
              onclick="window.HabitInsightPageToggleEditor()"
              class="w-8 h-8 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all shadow-sm flex-shrink-0"
            >
              <i data-lucide="settings" class="w-3.5 h-3.5"></i>
            </button>
          </div>

          <!-- Inline editor block -->
          <div id="habit-goal-editor-panel" class="${this.isEditing ? '' : 'hidden'} flex flex-col gap-4 pt-4 mt-2 border-t border-slate-100 animate-fade-in">
            <!-- Habit Name -->
            <div class="flex flex-col gap-1.5 text-xs">
              <span class="text-[9px] font-bold text-slate-400 uppercase">Habit Name</span>
              <input 
                type="text" 
                id="edit-goal-name"
                value="${habit.name}" 
                class="border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold bg-white text-slate-800 focus:outline-none focus:border-slate-900"
              />
            </div>

            <div class="grid grid-cols-2 gap-3 text-xs">
              <!-- Habit Type Toggle Button (Locked after creation) -->
              <div class="flex flex-col gap-1.5">
                <span class="text-[9px] font-bold text-slate-400 uppercase">Habit Type</span>
                <div class="flex bg-slate-100 p-0.5 rounded-xl w-full border border-slate-200/50 pointer-events-none opacity-60">
                  <button 
                    type="button"
                    class="flex-grow py-1.5 text-[10px] font-bold rounded-lg text-center transition-all duration-200 ${
                      this.editorType === 'boolean' || this.editorType === 'checkbox' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'
                    }"
                  >
                    Yes / No
                  </button>
                  <button 
                    type="button"
                    class="flex-grow py-1.5 text-[10px] font-bold rounded-lg text-center transition-all duration-200 ${
                      this.editorType === 'number' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'
                    }"
                  >
                    Metric
                  </button>
                </div>
                <p class="text-[8px] text-slate-400 mt-1 font-semibold">Type cannot be changed after creation.</p>
              </div>

              <!-- Weekly Target -->
              <div class="flex flex-col gap-1.5">
                <span class="text-[9px] font-bold text-slate-400 uppercase">Weekly Target</span>
                <select 
                  id="edit-goal-weekly"
                  class="border border-slate-200 rounded-xl px-3 py-2 focus:outline-none bg-white text-slate-800 font-bold"
                >
                  ${[1, 2, 3, 4, 5, 6, 7].map(num => `<option value="${num}" ${habit.weeklyTarget === num ? 'selected' : ''}>${num} days / wk</option>`).join('')}
                </select>
              </div>
            </div>

            <!-- Metric specific inputs -->
            <div id="edit-goal-metric-fields" class="${this.editorType === 'number' ? '' : 'hidden'} flex flex-col gap-3">
              <div class="grid grid-cols-3 gap-2.5 text-xs pt-2 border-t border-slate-100">
                <div class="flex flex-col gap-1.5">
                  <span class="text-[9px] font-bold text-slate-400 uppercase">Unit</span>
                  <input 
                    type="text" 
                    id="edit-goal-unit"
                    value="${habit.unit || ''}" 
                    placeholder="e.g. ml, steps"
                    class="border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold bg-white text-slate-800 focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div class="flex flex-col gap-1.5">
                  <span class="text-[9px] font-bold text-slate-400 uppercase">Min Target</span>
                  <input 
                    type="number" 
                    id="edit-goal-min"
                    value="${habit.minGoal ?? ''}" 
                    placeholder="None"
                    class="border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold bg-white text-slate-800 focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div class="flex flex-col gap-1.5">
                  <span class="text-[9px] font-bold text-slate-400 uppercase">Max Target</span>
                  <input 
                    type="number" 
                    id="edit-goal-max"
                    value="${habit.maxGoal ?? ''}" 
                    placeholder="None"
                    class="border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold bg-white text-slate-800 focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>
            </div>

            <!-- Custom Schedule Toggle -->
            <div class="mt-1 border-t border-slate-100 pt-2">
              <label class="flex items-center gap-2 mt-2 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  id="edit-schedule-toggle" 
                  class="w-3.5 h-3.5 border border-slate-350 rounded accent-slate-900 cursor-pointer"
                  ${activeDays.length > 0 ? 'checked' : ''}
                  onchange="window.HabitInsightPageToggleSchedule(this.checked)"
                />
                <span class="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Schedule on specific weekdays</span>
              </label>
              
              <div id="edit-schedule-days-wrapper" class="${activeDays.length > 0 ? '' : 'hidden'} flex justify-between items-center gap-1 mt-2.5 bg-slate-50 p-2 rounded-xl border border-slate-200/50">
                ${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
                  const isSelected = activeDays.includes(day);
                  return `
                    <button 
                      type="button" 
                      data-edit-day="${day}"
                      onclick="window.HabitInsightPageToggleEditDay('${day}')"
                      class="edit-day-chip-btn w-8 h-8 rounded-lg border font-bold text-[10px] flex items-center justify-center transition-all ${
                        isSelected 
                          ? 'border-slate-900 bg-slate-900 text-white shadow-sm' 
                          : 'border-slate-200 bg-white text-slate-500 hover:border-slate-350 hover:text-slate-700'
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
        <div class="flex justify-between items-center p-4 border-b border-slate-100">
          <div class="flex flex-col gap-0.5">
            <span class="text-xs font-bold text-slate-800">${habit.paused ? 'Resume Tracking' : 'Pause Tracking'}</span>
            <span class="text-[10px] text-slate-500 font-medium leading-relaxed">Temporarily freeze streaks without failing.</span>
          </div>
          <button 
            type="button" 
            onclick="window.HabitInsightPageTogglePause('${habit.id}')"
            class="w-8 h-8 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all shadow-sm flex-shrink-0"
          >
            <i data-lucide="${habit.paused ? 'play' : 'pause'}" class="w-3.5 h-3.5"></i>
          </button>
        </div>

        <!-- Row 3: Delete Habit Row -->
        <div class="flex justify-between items-center p-4">
          <div class="flex flex-col gap-0.5">
            <span class="text-xs font-bold text-slate-800">Delete Habit</span>
            <span class="text-[10px] text-slate-500 font-medium leading-relaxed">Permanently delete this habit and all history.</span>
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
      const progressPct = Math.round((diffDays / 7) * 100);
      return `
        <div id="habit-insights-view" class="flex flex-col gap-5 pb-24 animate-fade-in">
          <!-- Header row with Back Button -->
          <div class="flex items-center gap-4">
            <button 
              type="button"
              onclick="window.HabitInsightPageBack()"
              class="flex items-center justify-center w-8 h-8 rounded-full border border-slate-200 bg-white text-slate-500 hover:text-slate-800 transition-colors shadow-sm flex-shrink-0"
            >
              <i data-lucide="arrow-left" class="w-4 h-4"></i>
            </button>
            <div class="flex flex-col min-w-0 gap-1">
              <span class="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">${categoryLabel} Analysis</span>
              <h1 class="text-base sm:text-lg font-extrabold text-slate-800 break-words leading-tight">${habit.name}</h1>
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
          <div class="relative overflow-hidden bg-white border border-slate-200 rounded-2xl p-5 pt-6 shadow-sm flex flex-col items-center text-center gap-4">
            <div class="absolute top-0 left-0 right-0 h-1" style="background-color: ${themeHex};"></div>
            
            <div class="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
              <i data-lucide="lock" class="w-4 h-4"></i>
            </div>
            
            <div class="flex flex-col gap-1.5 max-w-[240px]">
              <span class="text-xs font-bold text-slate-800">Insights Gathering...</span>
              <p class="text-[10px] text-slate-500 leading-normal">We need at least 7 days of age on this habit to generate meaningful trends, heatmaps, and behavioral analysis.</p>
            </div>

            <!-- Progress Bar -->
            <div class="w-full max-w-[200px] flex flex-col gap-1 mt-1">
              <div class="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase">
                <span>Progress</span>
                <span>${diffDays} / 7 Days</span>
              </div>
              <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div class="h-full rounded-full transition-all duration-500" style="background-color: ${themeHex}; width: ${progressPct}%;"></div>
              </div>
            </div>

            <!-- Preview list -->
            <div class="border-t border-slate-100 w-full mt-2 pt-3 flex flex-col gap-2 text-left opacity-35 select-none pointer-events-none">
              <span class="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Unlocks:</span>
              <div class="flex items-center gap-2 text-[10px] text-slate-500">
                <i data-lucide="bar-chart-3" class="w-3.5 h-3.5"></i>
                <span>Weekly Consistency Trends</span>
              </div>
              <div class="flex items-center gap-2 text-[10px] text-slate-500">
                <i data-lucide="grid-3x3" class="w-3.5 h-3.5"></i>
                <span>Activity Heatmap</span>
              </div>
              <div class="flex items-center gap-2 text-[10px] text-slate-500">
                <i data-lucide="brain" class="w-3.5 h-3.5"></i>
                <span>Behavioral Analysis</span>
              </div>
            </div>
          </div>

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
            class="flex items-center justify-center w-8 h-8 rounded-full border border-slate-200 bg-white text-slate-500 hover:text-slate-800 transition-colors shadow-sm flex-shrink-0"
          >
            <i data-lucide="arrow-left" class="w-4 h-4"></i>
          </button>
          <div class="flex flex-col min-w-0 gap-1">
            <span class="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">${categoryLabel} Analysis</span>
            <h1 class="text-base sm:text-lg font-extrabold text-slate-800 break-words leading-tight">${habit.name}</h1>
            <div class="flex flex-wrap gap-1.5 items-center mt-0.5">
              ${targetBadgeHtml}
              ${scheduleBadgeHtml}
              ${metricBadgeHtml}
            </div>
          </div>
        </div>

        <!-- 3 combined stats cards -->
        <div class="grid grid-cols-3 gap-3">
          <div class="relative overflow-hidden bg-white border border-slate-200 rounded-2xl p-4 pt-5 shadow-sm flex flex-col justify-between min-h-[95px]">
            <div class="absolute top-0 left-0 right-0 h-1" style="background-color: ${themeHex};"></div>
            <span class="text-[9px] font-bold tracking-widest text-slate-400 uppercase">Daily Streak</span>
            <div class="flex flex-col">
              <span class="text-2xl font-semibold text-slate-800 leading-none">${dailyStreak}d</span>
              <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wide mt-1.5">Best: ${bestDailyStreak}d</span>
            </div>
          </div>

          <div class="relative overflow-hidden bg-white border border-slate-200 rounded-2xl p-4 pt-5 shadow-sm flex flex-col justify-between min-h-[95px]">
            <div class="absolute top-0 left-0 right-0 h-1" style="background-color: ${themeHex};"></div>
            <span class="text-[9px] font-bold tracking-widest text-slate-400 uppercase">Week Streak</span>
            <div class="flex flex-col">
              <span class="text-2xl font-semibold text-slate-800 leading-none">${weeklyStreak}w</span>
              <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wide mt-1.5">Best: ${bestWeeklyStreak}w</span>
            </div>
          </div>

          <div class="relative overflow-hidden bg-white border border-slate-200 rounded-2xl p-4 pt-5 shadow-sm flex flex-col justify-between min-h-[95px]">
            <div class="absolute top-0 left-0 right-0 h-1" style="background-color: ${themeHex};"></div>
            <span class="text-[9px] font-bold tracking-widest text-slate-400 uppercase">Consistency</span>
            <div class="flex flex-col">
              <span class="text-2xl font-semibold text-slate-800 leading-none">${monthlyRate}%</span>
              <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wide mt-1.5">Log Fdl: ${fidelity}%</span>
            </div>
          </div>
        </div>

        <!-- This Week Status Card -->
        ${thisWeekCardHtml}

        <!-- Personalized Behavioral Insights -->
        ${habitBehavioralHtml}

        <!-- Heatmap Calendar Grid -->
        <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
          <div class="flex justify-between items-center border-b border-slate-50 pb-2">
            <div class="flex items-center gap-3">
              <button 
                type="button"
                onclick="window.HabitInsightPagePrevMonth()"
                class="w-6 h-6 rounded-full border border-slate-200 bg-white text-slate-500 hover:text-slate-800 transition-colors shadow-sm flex items-center justify-center active:scale-95 cursor-pointer"
              >
                <i data-lucide="chevron-left" class="w-3.5 h-3.5"></i>
              </button>
              <h3 class="text-label-muted">${monthName} ${currentYear}</h3>
              <button 
                type="button"
                onclick="window.HabitInsightPageNextMonth()"
                class="w-6 h-6 rounded-full border border-slate-200 bg-white text-slate-500 hover:text-slate-800 transition-colors shadow-sm flex items-center justify-center active:scale-95 cursor-pointer"
              >
                <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
              </button>
            </div>
            <span class="text-[9px] font-bold text-slate-400 uppercase">Monthly Check-ins</span>
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
          <div class="flex items-center gap-4 text-[9px] font-bold text-slate-400 uppercase pt-2 border-t border-slate-50">
            <div class="flex items-center gap-1.5">
              <div class="w-3.5 h-3.5 rounded-full border border-slate-100 bg-white"></div>
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
            ${habit.type === 'number' ? `
              <div class="flex items-center gap-1.5">
                <div class="w-3.5 h-3.5 rounded-full border border-rose-400 bg-white"></div>
                <span>Failed Target</span>
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Numeric analysis (Only for value/numeric habits) -->
        ${numberStatsHtml}

        <!-- Value trend line chart -->
        ${valueChartHtml}

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
      HabitInsightPage.isEditing = !HabitInsightPage.isEditing;
      state.notify();
    };

    window.HabitInsightPageSetEditorType = (typeVal) => {
      HabitInsightPage.editorType = typeVal;
      state.notify();
    };

    window.HabitInsightPageToggleSchedule = (checked) => {
      const wrapper = document.getElementById('edit-schedule-days-wrapper');
      const tip = document.getElementById('edit-schedule-validation-tip');
      if (wrapper) wrapper.classList.toggle('hidden', !checked);
      if (!checked) {
        HabitInsightPage.editDays = [];
        document.querySelectorAll('.edit-day-chip-btn').forEach(btn => {
          btn.className = "edit-day-chip-btn w-8 h-8 rounded-lg border font-bold text-[10px] flex items-center justify-center transition-all border-slate-200 bg-white text-slate-500 hover:border-slate-350 hover:text-slate-700";
        });
      }
      if (tip) tip.classList.add('hidden');
    };

    window.HabitInsightPageToggleEditDay = (day) => {
      HabitInsightPage.editDays = HabitInsightPage.editDays || [];
      const btn = document.querySelector(`[data-edit-day="${day}"]`);
      if (HabitInsightPage.editDays.includes(day)) {
        HabitInsightPage.editDays = HabitInsightPage.editDays.filter(d => d !== day);
        if (btn) btn.className = "edit-day-chip-btn w-8 h-8 rounded-lg border font-bold text-[10px] flex items-center justify-center transition-all border-slate-200 bg-white text-slate-500 hover:border-slate-350 hover:text-slate-700";
      } else {
        HabitInsightPage.editDays.push(day);
        if (btn) btn.className = "edit-day-chip-btn w-8 h-8 rounded-lg border font-bold text-[10px] flex items-center justify-center transition-all border-slate-900 bg-slate-900 text-white shadow-sm";
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

    // Initialize Chart.js graph if the element exists
    const ctx = document.getElementById('habit-trend-chart');
    if (ctx && window.currentChartConfig && window.Chart) {
      const cfg = window.currentChartConfig;
      
      // Setup dynamic gradient helper
      const canvasCtx = ctx.getContext('2d');
      const gradient = canvasCtx.createLinearGradient(0, 0, 0, 160);
      gradient.addColorStop(0, cfg.themeHex + '33'); // 20% opacity
      gradient.addColorStop(1, cfg.themeHex + '00'); // 0% opacity

      new window.Chart(ctx, {
        type: 'line',
        data: {
          labels: cfg.labels,
          datasets: [{
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
          }]
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
