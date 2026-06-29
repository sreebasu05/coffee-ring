import { APP_CONFIG } from '../../config/appConfig.js';

// Color class mapping for each pastel key
const COLOR_CLASSES = {
  pastelMint: {
    activeCard: 'bg-pastelMint border-emerald-200 shadow-emerald-100',
    iconBoxActive: 'bg-emerald-100/50 border-emerald-200 text-emerald-800',
    titleActive: 'text-emerald-950',
    subTextActive: 'text-emerald-700',
    checkboxActive: 'bg-emerald-900 border-transparent text-white',
    tagBadge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    borderActive: 'border-emerald-200/50',
    inputActive: 'bg-white/40 border-emerald-200/50 text-emerald-955 focus:bg-white/70'
  },
  pastelAmber: {
    activeCard: 'bg-pastelAmber border-amber-200 shadow-amber-100',
    iconBoxActive: 'bg-amber-100/50 border-amber-200 text-amber-800',
    titleActive: 'text-amber-955',
    subTextActive: 'text-amber-700',
    checkboxActive: 'bg-amber-900 border-transparent text-white',
    tagBadge: 'bg-amber-100 text-amber-700 border-amber-200',
    borderActive: 'border-amber-200/50',
    inputActive: 'bg-white/40 border-amber-200/50 text-amber-955 focus:bg-white/70'
  },
  pastelSky: {
    activeCard: 'bg-pastelSky border-sky-200 shadow-sky-100',
    iconBoxActive: 'bg-sky-100/50 border-sky-200 text-sky-800',
    titleActive: 'text-sky-955',
    subTextActive: 'text-sky-700',
    checkboxActive: 'bg-sky-900 border-transparent text-white',
    tagBadge: 'bg-sky-100 text-sky-700 border-sky-200',
    borderActive: 'border-sky-200/50',
    inputActive: 'bg-white/40 border-sky-200/50 text-amber-955 focus:bg-white/70'
  },
  pastelRose: {
    activeCard: 'bg-pastelRose border-rose-200 shadow-rose-100',
    iconBoxActive: 'bg-rose-100/50 border-rose-200 text-rose-800',
    titleActive: 'text-rose-955',
    subTextActive: 'text-rose-700',
    checkboxActive: 'bg-rose-900 border-transparent text-white',
    tagBadge: 'bg-rose-100 text-rose-700 border-rose-200',
    borderActive: 'border-rose-200/50',
    inputActive: 'bg-white/40 border-rose-200/50 text-rose-955 focus:bg-white/70'
  },
  pastelLavender: {
    activeCard: 'bg-pastelLavender border-violet-200 shadow-violet-100',
    iconBoxActive: 'bg-violet-100/50 border-violet-200 text-violet-800',
    titleActive: 'text-violet-955',
    subTextActive: 'text-violet-750',
    checkboxActive: 'bg-violet-900 border-transparent text-white',
    tagBadge: 'bg-violet-100 text-violet-700 border-violet-200',
    borderActive: 'border-violet-200/50',
    inputActive: 'bg-white/40 border-violet-200/50 text-violet-955 focus:bg-white/70'
  },
  pastelPink: {
    activeCard: 'bg-pastelPink border-pink-200 shadow-pink-100',
    iconBoxActive: 'bg-pink-100/50 border-pink-200 text-pink-800',
    titleActive: 'text-pink-955',
    subTextActive: 'text-pink-700',
    checkboxActive: 'bg-pink-900 border-transparent text-white',
    tagBadge: 'bg-pink-100 text-pink-700 border-pink-200',
    borderActive: 'border-pink-200/50',
    inputActive: 'bg-white/40 border-pink-200/50 text-pink-955 focus:bg-white/70'
  }
};

export const HabitCard = {
  expandedHabitId: null,

  render(habit, state) {
    const log = state.getLogForHabit(habit.id);
    
    // Completion Logic
    let isCompleted = log !== null;
    if (habit.type === 'number' && log && log.value !== null && log.value !== undefined) {
      const val = log.value;
      const min = (habit.minGoal !== null && habit.minGoal !== undefined && habit.minGoal !== "") ? parseFloat(habit.minGoal) : -Infinity;
      const max = (habit.maxGoal !== null && habit.maxGoal !== undefined && habit.maxGoal !== "") ? parseFloat(habit.maxGoal) : Infinity;
      isCompleted = val >= min && val <= max;
    }

    const isExpanded = this.expandedHabitId === habit.id;
    
    // Derive color from category
    const colorKey = state.getCategoryColor(habit.category);
    const c = COLOR_CLASSES[colorKey] || COLOR_CLASSES.pastelMint;

    // Resolve category metadata for badge
    const categoryMeta = APP_CONFIG.categories.find(cat => cat.id === habit.category);
    const categoryLabel = categoryMeta ? categoryMeta.name : 'General';
    
    const weeklyCount = state.getWeeklyCount(habit.id);
    const weeklyTarget = habit.weeklyTarget || 7;

    // Map colorKey to hex values for precise style bindings
    const colorHexMap = {
      pastelMint: '#10b981',
      pastelAmber: '#f59e0b',
      pastelSky: '#0ea5e9',
      pastelRose: '#f43f5e',
      pastelLavender: '#8b5cf6',
      pastelPink: '#ec4899'
    };
    const themeHex = colorHexMap[colorKey] || '#0f172a';

    // Apply color class rules
    let cardClass = "relative overflow-hidden habit-card border border-slate-200 rounded-2xl p-4 pt-5 flex flex-col shadow-sm transition-all duration-300 bg-white text-slate-800 hover:shadow-md";
    let iconBoxStyle = "";
    let checkboxStyle = "";
    
    let iconBoxClass = "w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-300";
    let checkboxClass = "w-7 h-7 rounded-full border flex items-center justify-center transition-all duration-150 cursor-pointer";
    let titleClass = "font-bold text-sm leading-snug text-slate-800";
    let subtitleClass = "text-xs mt-0.5 text-slate-500";

    if (isCompleted) {
      iconBoxStyle = `background-color: ${themeHex}1a; border-color: ${themeHex}33; color: ${themeHex};`;
      checkboxStyle = `border-color: ${themeHex}; color: ${themeHex}; background-color: ${themeHex}10;`;
    } else {
      iconBoxClass += " bg-slate-50 border-slate-200 text-slate-500";
      checkboxClass += " bg-slate-50/50 border-slate-200 text-slate-400 hover:border-slate-400 hover:text-slate-600";
    }

    // Category badge classes
    const badgeClass = `text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full border bg-slate-100 text-slate-500 border-slate-200`;

    // Subtitle formatting
    let subtitle = "";
    if (habit.type === 'number') {
      const hasMin = habit.minGoal !== null && habit.minGoal !== undefined && habit.minGoal !== "";
      const hasMax = habit.maxGoal !== null && habit.maxGoal !== undefined && habit.maxGoal !== "";
      
      let targetLabel = "";
      if (hasMin && hasMax) targetLabel = `${habit.minGoal}–${habit.maxGoal}`;
      else if (hasMin) targetLabel = `≥ ${habit.minGoal}`;
      else if (hasMax) targetLabel = `≤ ${habit.maxGoal}`;

      const unitLabel = habit.unit || '';
      if (log !== null) {
        if (log.value !== null && log.value !== undefined && log.value !== '') {
          const isOutOfRange = !isCompleted;
          const textHighlight = isOutOfRange ? 'text-rose-600 font-semibold text-xs mt-0.5' : subtitleClass;
          subtitle = targetLabel
            ? `<span class="${textHighlight}">${log.value} / ${targetLabel} ${unitLabel}</span>`
            : `<span class="${textHighlight}">${log.value} ${unitLabel}</span>`;
        } else {
          subtitle = `<span class="${subtitleClass}">Completed</span>`;
        }
      } else {
        subtitle = targetLabel
          ? `<span class="${subtitleClass}">${targetLabel} ${unitLabel}</span>`
          : "";
      }
    } else {
      subtitle = `<span class="${subtitleClass}">${weeklyCount}/${weeklyTarget} days this week</span>`;
    }

    const isEmoji = (str) => /\p{Emoji}/u.test(str) && !/^[a-zA-Z0-9_-]+$/.test(str);
    const iconName = (!habit.icon || isEmoji(habit.icon)) ? 'target' : habit.icon;

    // Render tags
    const selectedTags = log?.tags || [];
    const tagsHTML = habit.tags.map(tag => {
      const isChecked = selectedTags.includes(tag);
      return `
        <button 
          data-tag="${tag}" 
          class="inline-tag-chip px-2.5 py-1 rounded-full text-xs transition-all border ${
            isChecked 
              ? 'bg-slate-900 border-transparent text-white font-semibold shadow-sm'
              : isCompleted
                ? 'bg-white/40 border-black/5 text-slate-700 hover:text-slate-900'
                : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
          }"
        >
          ${tag}
        </button>
      `;
    }).join('');

    // Default numeric placeholder
    let numPlaceholder = "0";
    if (habit.type === 'number') {
      const hasMin = habit.minGoal !== null && habit.minGoal !== undefined && habit.minGoal !== "";
      const hasMax = habit.maxGoal !== null && habit.maxGoal !== undefined && habit.maxGoal !== "";
      if (hasMin && hasMax) numPlaceholder = Math.round((parseFloat(habit.minGoal) + parseFloat(habit.maxGoal)) / 2);
      else if (hasMin) numPlaceholder = habit.minGoal;
      else if (hasMax) numPlaceholder = habit.maxGoal;
    }

    return `
      <div 
        data-habit-id="${habit.id}" 
        class="${cardClass}"
      >
        <!-- Top Colored Accent Strip (Completed State Only) -->
        ${isCompleted ? `<div class="absolute top-0 left-0 right-0 h-1.5 transition-all duration-300" style="background-color: ${themeHex};"></div>` : ''}

        <!-- Main row -->
        <div class="flex justify-between items-center cursor-pointer select-none">
          <div class="flex items-center gap-3">
            <div class="${iconBoxClass}" style="${iconBoxStyle}">
              <i data-lucide="${iconName}" class="w-5 h-5"></i>
            </div>
            <div class="flex flex-col gap-0.5">
              <div class="flex items-center gap-2">
                <span class="${titleClass}">${habit.name}</span>
                <span class="${badgeClass}">${categoryLabel}</span>
              </div>
              ${subtitle}
            </div>
          </div>
          <button class="habit-check-btn ${checkboxClass}" style="${checkboxStyle}">
            <i data-lucide="${isCompleted ? 'check' : 'plus'}" class="w-4 h-4"></i>
          </button>
        </div>

        <!-- Inline Downward Expanding Segment -->
        <div 
          class="transition-all duration-300 overflow-hidden ${
            isExpanded 
              ? 'max-h-[350px] mt-4 pt-4 border-t border-slate-100'
              : 'max-h-0'
          }"
        >
          <!-- Numeric Value Logger -->
          ${habit.type === 'number' ? `
            <div class="mb-4">
              <h4 class="text-label-muted ${isCompleted ? c.subTextActive : 'text-slate-500'} mb-2">Log Value</h4>
              <div class="flex items-center gap-2">
                <input 
                  type="number" 
                  value="${log?.value ?? ""}" 
                  placeholder="${numPlaceholder}"
                  class="card-numeric-input w-24 border rounded-xl px-3 py-2 text-sm font-bold focus:outline-none bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:border-slate-900"
                />
                <span class="text-xs ${isCompleted ? c.subTextActive : 'text-slate-500'} font-semibold">${habit.unit || 'units'}</span>
              </div>
            </div>
          ` : ''}

          <!-- Tags Grid (for habits with tags) -->
          ${habit.tags && habit.tags.length > 0 ? `
            <div class="mb-4">
              <h4 class="text-label-muted ${isCompleted ? c.subTextActive : 'text-slate-500'} mb-2.5">Select Tags</h4>
              <div class="flex flex-wrap items-center gap-1.5">
                ${tagsHTML}
                
                <div class="inline-flex items-center">
                  <button 
                    class="tag-add-trigger-btn w-6 h-6 rounded-full border flex items-center justify-center transition-colors border-slate-350 text-slate-500 hover:bg-slate-100"
                  >
                    <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                  </button>
                  
                  <div class="tag-input-bar hidden flex items-center gap-1">
                    <input 
                      type="text" 
                      placeholder="New tag..." 
                      class="tag-inline-input border border-slate-200 rounded-lg px-2 py-0.5 text-xs focus:outline-none w-20 bg-slate-50 text-slate-800 focus:bg-white"
                    />
                    <button class="tag-inline-confirm-btn text-slate-600 hover:text-slate-900 p-0.5">
                      <i data-lucide="check" class="w-3.5 h-3.5"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ` : ''}

          <!-- Note Area -->
          <div class="mb-4">
            <h4 class="text-label-muted ${isCompleted ? c.subTextActive : 'text-slate-500'} mb-2">Optional Note</h4>
            <textarea 
              placeholder="e.g. Squat PR, Read 10 pages..." 
              rows="2" 
              class="card-note-textarea w-full border border-slate-200 rounded-xl p-3 text-xs resize-none focus:outline-none bg-slate-50 text-slate-800 focus:bg-white focus:border-slate-900"
            >${log?.note || ""}</textarea>
          </div>

          <!-- Bottom Action Row -->
          <div class="pt-3 border-t border-dashed border-slate-150 flex justify-end items-center">
            <button 
              type="button"
              data-card-insights-btn="${habit.id}"
              class="text-[9px] font-extrabold tracking-widest uppercase text-slate-500 hover:text-slate-700 transition-colors flex items-center gap-1.5 py-1 px-2 rounded hover:bg-slate-50"
            >
              <i data-lucide="line-chart" class="w-3.5 h-3.5"></i>
              View Insights
            </button>
          </div>
        </div>
      </div>
    `;
  },

  bindEvents(state, onNavigateToInsights) {
    document.querySelectorAll('.habit-card').forEach(card => {
      const habitId = card.dataset.habitId;
      const habit = state.habits.find(h => h.id === habitId);
      const checkBtn = card.querySelector('.habit-check-btn');
      const cardHeader = card.firstElementChild;

      const addTriggerBtn = card.querySelector('.tag-add-trigger-btn');
      const tagInputBar = card.querySelector('.tag-input-bar');
      const inlineInput = card.querySelector('.tag-inline-input');
      const inlineConfirmBtn = card.querySelector('.tag-inline-confirm-btn');

      // Tapping card header toggles expansion
      cardHeader.addEventListener('click', (e) => {
        if (e.target.closest('.habit-check-btn')) return;
        this.expandedHabitId = this.expandedHabitId === habitId ? null : habitId;
        state.notify();
      });

      // Tapping checkbox toggles state
      checkBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const log = state.getLogForHabit(habitId);

        checkBtn.classList.add('active-pulse');
        setTimeout(() => checkBtn.classList.remove('active-pulse'), 150);

        if (log) {
          state.removeCheckIn(habitId);
          if (this.expandedHabitId === habitId) this.expandedHabitId = null;
        } else {
          if (habit.type === 'number') {
            state.logCheckIn(habitId, null, [], "");
          } else {
            state.logCheckIn(habitId, 1, [], "");
          }
          this.expandedHabitId = habitId;
        }
        state.notify();
      });

      // Select tag chips
      card.querySelectorAll('.inline-tag-chip').forEach(chip => {
        chip.addEventListener('click', (e) => {
          e.stopPropagation();
          const tag = chip.dataset.tag;
          const log = state.getLogForHabit(habitId) || { tags: [], note: "" };
          let updatedTags = [...(log.tags || [])];
          if (updatedTags.includes(tag)) updatedTags = updatedTags.filter(t => t !== tag);
          else updatedTags.push(tag);
          state.logCheckIn(habitId, log.value || 1, updatedTags, log.note || "");
        });
      });

      // Inline Tag Creator
      if (addTriggerBtn) {
        addTriggerBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          addTriggerBtn.classList.add('hidden');
          tagInputBar.classList.remove('hidden');
          inlineInput.focus();
        });
      }

      const saveInlineTag = () => {
        const text = inlineInput.value.trim();
        if (text) {
          if (!habit.tags.includes(text)) {
            habit.tags.push(text);
            state.saveHabit(habit);
          }
          const log = state.getLogForHabit(habitId) || { tags: [], note: "" };
          const updatedTags = [...(log.tags || [])];
          if (!updatedTags.includes(text)) updatedTags.push(text);
          state.logCheckIn(habitId, log.value || 1, updatedTags, log.note || "");
        }
        inlineInput.value = "";
        tagInputBar.classList.add('hidden');
        addTriggerBtn.classList.remove('hidden');
      };

      if (inlineConfirmBtn) {
        inlineConfirmBtn.addEventListener('click', (e) => { e.stopPropagation(); saveInlineTag(); });
      }
      if (inlineInput) {
        inlineInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); saveInlineTag(); }
        });
      }

      // Auto-saving numeric values on blur
      const numInput = card.querySelector('.card-numeric-input');
      if (numInput) {
        numInput.addEventListener('blur', () => {
          const val = parseFloat(numInput.value);
          const log = state.getLogForHabit(habitId) || { tags: [], note: "" };
          if (!isNaN(val)) {
            state.logCheckIn(habitId, val, log.tags || [], log.note || "");
          } else {
            state.logCheckIn(habitId, null, log.tags || [], log.note || "");
          }
        });
        numInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') numInput.blur(); });
      }

      // Auto-saving notes on blur
      const textarea = card.querySelector('.card-note-textarea');
      if (textarea) {
        textarea.addEventListener('blur', () => {
          const text = textarea.value.trim();
          const log = state.getLogForHabit(habitId) || { tags: [], value: 1 };
          state.logCheckIn(habitId, log.value || 1, log.tags || [], text);
        });
      }

      // View Insights Action
      const insightsCardBtn = card.querySelector('[data-card-insights-btn]');
      if (insightsCardBtn && onNavigateToInsights) {
        insightsCardBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          onNavigateToInsights(habitId);
        });
      }
    });
  }
};
