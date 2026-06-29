import { APP_CONFIG } from '../../config/appConfig.js';

export const DashboardPage = {
  expandedCategoryId: null,

  render(state) {
    const todayPct = state.getTodayCompletionRate();
    const onTrackCount = state.getWeeklyGoalProgress();
    const totalHabits = state.habits.length;
    const fidelity = state.getOverallLoggingFidelity();
    const highlights = state.getHighlights();
    const dayByDay = state.getWeeklyDayByDayActivity();

    // 1. Filter categories to only those containing active habits
    const activeCategories = APP_CONFIG.categories.filter(cat => {
      return state.habits.some(h => h.category === cat.id);
    });

    // 2. Generate Category Cards HTML
    const categoriesHtml = activeCategories.map(cat => {
      const isExpanded = this.expandedCategoryId === cat.id;
      const colorKey = state.getCategoryColor(cat.id);
      const completion = state.getCategoryCompletion(cat.id);

      const bgMap = {
        pastelMint: 'bg-pastelMint',
        pastelAmber: 'bg-pastelAmber',
        pastelSky: 'bg-pastelSky',
        pastelRose: 'bg-pastelRose',
        pastelLavender: 'bg-pastelLavender',
        pastelPink: 'bg-pastelPink'
      };
      
      const textMap = {
        pastelMint: 'text-emerald-800',
        pastelAmber: 'text-amber-800',
        pastelSky: 'text-sky-800',
        pastelRose: 'text-rose-800',
        pastelLavender: 'text-violet-800',
        pastelPink: 'text-pink-800'
      };

      const bgClass = bgMap[colorKey] || 'bg-slate-200';
      const textClass = textMap[colorKey] || 'text-slate-700';

      const catHabits = state.habits.filter(h => h.category === cat.id);
      const habitsListHtml = catHabits.map(h => {
        const count = state.getWeeklyCount(h.id);
        const target = h.weeklyTarget || 7;
        const icon = h.icon || 'target';
        return `
          <div 
            data-go-to-insights-row="${h.id}"
            class="flex items-center justify-between py-2 border-b border-slate-100 last:border-0 text-xs cursor-pointer hover:bg-slate-50/50 px-1 rounded transition-colors"
          >
            <div class="flex items-center gap-2">
              <i data-lucide="${icon}" class="w-3.5 h-3.5 text-slate-500"></i>
              <span class="font-medium text-slate-700">${h.name}</span>
            </div>
            <span class="text-slate-500 font-semibold">${count}/${target} days</span>
          </div>
        `;
      }).join('');

      const paletteOptionsHtml = APP_CONFIG.pastelColors.map(color => `
        <button 
          type="button"
          data-change-cat="${cat.id}"
          data-target-color="${color.key}"
          style="background-color: ${color.hex};"
          class="w-5 h-5 rounded-full border border-black/10 transition-transform active:scale-90"
        ></button>
      `).join('');

      return `
        <div 
          data-category-id="${cat.id}"
          class="border border-slate-200 bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col gap-3"
        >
          <!-- Card Row Header -->
          <div class="flex justify-between items-center cursor-pointer select-none category-header-row">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl flex items-center justify-center border bg-slate-50 border-slate-100 text-slate-600">
                <i data-lucide="${cat.icon || 'folder'}" class="w-4 h-4"></i>
              </div>
              <div class="flex flex-col">
                <span class="font-bold text-sm text-slate-800">${cat.name}</span>
                <span class="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">${catHabits.length} habits</span>
              </div>
            </div>
            
            <div class="flex items-center gap-3">
              <span class="text-xs font-bold ${textClass}">${completion}%</span>
              
              <!-- Palette customizer trigger -->
              <button class="palette-trigger-btn p-1 text-slate-300 hover:text-slate-500 transition-colors">
                <i data-lucide="palette" class="w-4 h-4"></i>
              </button>
            </div>
          </div>

          <!-- Color Customizer Grid -->
          <div class="palette-popup-bar hidden py-2 border-t border-slate-100 flex items-center justify-between gap-2">
            <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Customize Color</span>
            <div class="flex items-center gap-1.5">
              ${paletteOptionsHtml}
            </div>
          </div>

          <!-- Horizontal progress bar -->
          <div class="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div class="${bgClass} h-full rounded-full transition-all duration-500" style="width: ${completion}%;"></div>
          </div>

          <!-- Slide down habit list -->
          <div class="overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[300px] mt-2 pt-2 border-t border-slate-100' : 'max-h-0'}">
            ${habitsListHtml}
          </div>
        </div>
      `;
    }).join('');

    let highlightsHtml = `<div class="text-xs text-slate-400 py-2">No logs found yet. Check off habits on the Today tab to generate statistics!</div>`;
    if (highlights.best || highlights.worst || highlights.streakChampion) {
      highlightsHtml = `
        <div class="grid grid-cols-3 gap-3">
          <!-- Best habit -->
          ${highlights.best ? `
            <div class="relative overflow-hidden bg-white border border-slate-200 rounded-2xl p-3.5 pt-5 text-center flex flex-col items-center justify-between min-h-[105px]">
              <div class="absolute top-0 left-0 right-0 h-1" style="background-color: #10b981;"></div>
              <i data-lucide="trending-up" class="w-5 h-5 text-emerald-500 mb-1.5"></i>
              <span class="text-[9px] font-bold tracking-widest text-emerald-600 uppercase">Crushing It</span>
              <span class="text-xs font-bold text-slate-800 line-clamp-1 mt-1 w-full">${highlights.best.habit.name}</span>
              <span class="text-[10px] font-bold text-emerald-600 mt-0.5">${highlights.best.rate}% done</span>
            </div>
          ` : ''}

          <!-- Streak Champion -->
          ${highlights.streakChampion && highlights.streakChampion.streak > 0 ? `
            <div class="relative overflow-hidden bg-white border border-slate-200 rounded-2xl p-3.5 pt-5 text-center flex flex-col items-center justify-between min-h-[105px]">
              <div class="absolute top-0 left-0 right-0 h-1" style="background-color: #f59e0b;"></div>
              <i data-lucide="flame" class="w-5 h-5 text-amber-500 fill-amber-500/10 mb-1.5"></i>
              <span class="text-[9px] font-bold tracking-widest text-amber-600 uppercase">Streak Champ</span>
              <span class="text-xs font-bold text-slate-800 line-clamp-1 mt-1 w-full">${highlights.streakChampion.habit.name}</span>
              <span class="text-[10px] font-bold text-amber-600 mt-0.5">${highlights.streakChampion.streak}d streak</span>
            </div>
          ` : `
            <div class="relative overflow-hidden bg-white border border-slate-200 rounded-2xl p-3.5 pt-5 text-center flex flex-col items-center justify-center min-h-[105px]">
              <div class="absolute top-0 left-0 right-0 h-1 bg-slate-300"></div>
              <i data-lucide="award" class="w-5 h-5 text-slate-400 mb-1.5"></i>
              <span class="text-[9px] font-bold tracking-widest text-slate-400 uppercase">No Streak</span>
              <span class="text-xs text-slate-500 mt-1">Keep checking!</span>
            </div>
          `}

          <!-- Worst habit -->
          ${highlights.worst ? `
            <div class="relative overflow-hidden bg-white border border-slate-200 rounded-2xl p-3.5 pt-5 text-center flex flex-col items-center justify-between min-h-[105px]">
              <div class="absolute top-0 left-0 right-0 h-1" style="background-color: #f43f5e;"></div>
              <i data-lucide="alert-circle" class="w-5 h-5 text-rose-500 mb-1.5"></i>
              <span class="text-[9px] font-bold tracking-widest text-rose-600 uppercase">Needs Focus</span>
              <span class="text-xs font-bold text-slate-800 line-clamp-1 mt-1 w-full">${highlights.worst.habit.name}</span>
              <span class="text-[10px] font-bold text-rose-600 mt-0.5">${highlights.worst.rate}% done</span>
            </div>
          ` : ''}
        </div>
      `;
    }

    const dayByDayHtml = dayByDay.map(day => `
      <div class="flex flex-col items-center gap-1.5 flex-1">
        <div class="w-full bg-slate-50 border border-slate-100 h-28 rounded-xl overflow-hidden flex flex-col justify-end relative">
          <div 
            class="bg-slate-900 w-full rounded-t-lg transition-all duration-500" 
            style="height: ${day.pct}%;"
          ></div>
        </div>
        <span class="text-[9px] font-bold text-slate-400 uppercase">${day.day}</span>
        <span class="text-[8px] font-semibold text-slate-500">${day.pct}%</span>
      </div>
    `).join('');

    return `
      <div id="dashboard-view" class="flex flex-col gap-6 pb-24 animate-fade-in">
        
        <!-- Snapshot ring and general status -->
        <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center justify-between gap-4">
          <div class="flex flex-col gap-1">
            <h1 class="text-xl font-bold text-slate-800">Dashboard</h1>
            <p class="text-xs text-slate-500">Your overall habit analysis.</p>
            <div class="flex flex-col gap-0.5 mt-3 text-xs font-semibold text-slate-600">
              <span class="flex items-center gap-1.5"><i data-lucide="check" class="w-3.5 h-3.5 text-slate-800"></i> ${todayPct}% done today</span>
              <span class="flex items-center gap-1.5"><i data-lucide="target" class="w-3.5 h-3.5 text-slate-800"></i> ${onTrackCount} of ${totalHabits} on track</span>
            </div>
          </div>

          <!-- Circular ring completion tracker -->
          <div class="relative w-20 h-20 flex items-center justify-center">
            <svg class="absolute w-full h-full transform -rotate-90">
              <circle cx="40" cy="40" r="34" stroke="#f1f5f9" stroke-width="6" fill="transparent" />
              <circle cx="40" cy="40" r="34" stroke="#0f172a" stroke-width="6" fill="transparent"
                stroke-dasharray="213.628" stroke-dashoffset="${213.628 - (213.628 * todayPct) / 100}"
                stroke-linecap="round" class="transition-all duration-500" />
            </svg>
            <span class="text-sm font-extrabold text-slate-800">${todayPct}%</span>
          </div>
        </div>

        <!-- Highlights grid -->
        <div class="flex flex-col gap-2.5">
          <h3 class="text-label-muted">Standouts</h3>
          ${highlightsHtml}
        </div>

        <!-- Behavioral Insights Section -->
        ${(() => {
          const uniqueDays = new Set(state.checkIns.map(l => l.date)).size;
          const isLocked = uniqueDays < 7;

          if (isLocked) {
            const progressPct = Math.round((uniqueDays / 7) * 100);
            return `
              <div class="flex flex-col gap-2.5">
                <h3 class="text-label-muted">Behavioral Insights</h3>
                <div class="relative overflow-hidden bg-white border border-slate-200 rounded-2xl p-5 pt-6 shadow-sm flex flex-col items-center text-center gap-4">
                  <div class="absolute top-0 left-0 right-0 h-1" style="background-color: #8b5cf6;"></div>
                  
                  <div class="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500">
                    <i data-lucide="lock" class="w-4 h-4"></i>
                  </div>
                  
                  <div class="flex flex-col gap-1.5 max-w-[240px]">
                    <span class="text-xs font-bold text-slate-800">Behavioral Intelligence Locked</span>
                    <p class="text-[10px] text-slate-500 leading-normal">Stride requires at least 7 unique days of logging history to parse routine slumps and stack triggers.</p>
                  </div>

                  <!-- Progress Bar -->
                  <div class="w-full max-w-[200px] flex flex-col gap-1 mt-1">
                    <div class="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase">
                      <span>Progress</span>
                      <span>${uniqueDays} / 7 Days</span>
                    </div>
                    <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div class="bg-slate-900 h-full rounded-full transition-all duration-500" style="width: ${progressPct}%;"></div>
                    </div>
                  </div>

                  <!-- Preview list -->
                  <div class="border-t border-slate-100 w-full mt-2 pt-3 flex flex-col gap-2 text-left opacity-35 select-none pointer-events-none">
                    <span class="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Unlocks:</span>
                    <div class="flex items-center gap-2 text-[10px] text-slate-500">
                      <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
                      <span>Bounce-Back Recovery Strategy</span>
                    </div>
                    <div class="flex items-center gap-2 text-[10px] text-slate-500">
                      <i data-lucide="sun" class="w-3.5 h-3.5"></i>
                      <span>Weekend Performance Slumps</span>
                    </div>
                  </div>
                </div>
              </div>
            `;
          }

          const b = state.getBehavioralInsights();
          if (!b) return '';

          // Build Weekend Slump warning
          let slumpHtml = "";
          if (b.slumpDiff > 0) {
            slumpHtml = `
              <div class="flex items-start gap-3 p-3 bg-amber-50/50 border border-amber-100 rounded-xl">
                <i data-lucide="sun" class="w-4 h-4 text-amber-600 mt-0.5"></i>
                <div class="flex flex-col gap-0.5">
                  <span class="text-xs font-bold text-slate-800">Weekend Slump Warning</span>
                  <span class="text-[10px] text-slate-500 font-medium leading-relaxed">Your consistency drops by <strong class="text-amber-700">${b.slumpDiff}%</strong> on weekends (Sat-Sun) compared to weekdays.</span>
                </div>
              </div>
            `;
          } else {
            slumpHtml = `
              <div class="flex items-start gap-3 p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                <i data-lucide="sparkles" class="w-4 h-4 text-emerald-600 mt-0.5"></i>
                <div class="flex flex-col gap-0.5">
                  <span class="text-xs font-bold text-slate-800">Weekend Routine Intact</span>
                  <span class="text-[10px] text-slate-500 font-medium leading-relaxed">You maintain similar consistency levels during weekends as weekdays!</span>
                </div>
              </div>
            `;
          }

          // Build Keystone anchor connection list
          let keystoneHtml = "";
          if (b.keystoneStacks && b.keystoneStacks.length > 0) {
            const stacksList = b.keystoneStacks.map(s => {
              return `<li class="list-disc ml-3 text-[10px] text-slate-500 font-medium leading-relaxed mt-0.5">Completing <strong>${s.anchor}</strong> triggers <strong>${s.follower}</strong> (${s.probability}% correlation).</li>`;
            }).join('');

            keystoneHtml = `
              <div class="flex items-start gap-3 p-3 bg-violet-50/50 border border-violet-100 rounded-xl">
                <i data-lucide="link" class="w-4 h-4 text-violet-600 mt-0.5"></i>
                <div class="flex flex-col gap-0.5 w-full">
                  <span class="text-xs font-bold text-slate-800">Keystone Anchor Connections</span>
                  <ul class="flex flex-col gap-1 mt-1">
                    ${stacksList}
                  </ul>
                </div>
              </div>
            `;
          }

          return `
            <div class="flex flex-col gap-2.5">
              <h3 class="text-label-muted">Behavioral Insights</h3>
              <div class="relative overflow-hidden bg-white border border-slate-200 rounded-2xl p-4 pt-5 shadow-sm flex flex-col gap-3">
                <div class="absolute top-0 left-0 right-0 h-1" style="background-color: #8b5cf6;"></div>
                
                <!-- Bounce-back Rate -->
                <div class="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <div class="flex items-start gap-3">
                    <i data-lucide="refresh-cw" class="w-4 h-4 text-slate-600 mt-0.5"></i>
                    <div class="flex flex-col gap-0.5">
                      <span class="text-xs font-bold text-slate-800">Bounce-Back Rate</span>
                      <span class="text-[10px] text-slate-500 font-medium leading-relaxed">How often you check in the day after a missed log.</span>
                    </div>
                  </div>
                  <span class="text-lg font-bold text-slate-800 pl-4">${b.bounceBackRate}%</span>
                </div>

                ${slumpHtml}
                ${keystoneHtml}

              </div>
            </div>
          `;
        })()}

        <!-- Categories block -->
        <div class="flex flex-col gap-2.5">
          <h3 class="text-label-muted">Active Categories</h3>
          <div class="flex flex-col gap-3">
            ${categoriesHtml || '<div class="text-xs text-slate-400 py-2">No active categories. Create a habit to start!</div>'}
          </div>
        </div>

        <!-- Logging fidelity meter -->
        <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-2">
          <div class="flex justify-between items-center text-xs">
            <span class="font-bold text-slate-800">Logging Fidelity</span>
            <span class="text-[10px] font-bold text-slate-500 uppercase">${fidelity}% Detailed</span>
          </div>
          <div class="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div class="bg-slate-900 h-full rounded-full transition-all duration-500" style="width: ${fidelity}%;"></div>
          </div>
          <p class="text-[10px] text-slate-400 mt-0.5 leading-normal">Fidelity measures what percentage of your logs contain rich details (values, notes, or tags) rather than simple check ticks.</p>
        </div>

        <!-- Weekly activity vertical chart -->
        <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
          <h3 class="text-label-muted">Weekly Activity Trend</h3>
          <div class="flex items-end gap-2 pt-2 justify-between">
            ${dayByDayHtml}
          </div>
        </div>

      </div>
    `;
  },

  bindEvents(state, onNavigateToInsights) {
    // Tapping category expands list
    document.querySelectorAll('.category-header-row').forEach(row => {
      row.addEventListener('click', (e) => {
        if (e.target.closest('.palette-trigger-btn')) return;

        const catCard = row.closest('[data-category-id]');
        const catId = catCard.dataset.categoryId;

        this.expandedCategoryId = this.expandedCategoryId === catId ? null : catId;
        state.notify();
      });
    });

    // Palette customizer toggle
    document.querySelectorAll('.palette-trigger-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const catCard = btn.closest('[data-category-id]');
        const popupBar = catCard.querySelector('.palette-popup-bar');
        popupBar.classList.toggle('hidden');
      });
    });

    // Color re-assignment execution
    document.querySelectorAll('[data-change-cat]').forEach(colorBtn => {
      colorBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const catId = colorBtn.dataset.changeCat;
        const newColor = colorBtn.dataset.targetColor;

        state.updateCategoryColor(catId, newColor);
      });
    });

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
