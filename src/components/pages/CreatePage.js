import { APP_CONFIG } from '../../config/appConfig.js';

export const CreatePage = {
  iconList: [
    'brain', 'book-open', 'droplet', 'footprints', 'ban', 'pencil', 'zap', 'activity',
    'moon', 'heart', 'dumbbell', 'coffee', 'apple', 'music', 'sun', 'leaf',
    'flame', 'star', 'target', 'timer', 'wallet', 'shield-check', 'sparkles',
    'alarm-clock', 'code', 'utensils', 'pill', 'snowflake', 'bike', 'smile'
  ],
  prefilledData: null,
  currentStep: 0,
  totalSteps: 0,

  viewMode: 'selection',

  render(prefilled = null, currentStep = 0, totalSteps = 0) {
    this.prefilledData = prefilled;
    this.currentStep = currentStep;
    this.totalSteps = totalSteps;

    // If onboarding or a preset was clicked from the drawer, we are in form mode
    if (totalSteps > 0 || this.viewMode === 'form') {
      this.viewMode = 'form';
      return this.renderFormView();
    }

    this.viewMode = 'selection';
    return this.renderSelectionView();
  },

  renderSelectionView() {
    const presets = APP_CONFIG.presets || [];
    
    const customHabitHtml = `
      <button 
        type="button"
        id="drawer-custom-habit"
        class="onboarding-preset-card relative overflow-hidden flex flex-col items-center pt-4 pb-3 px-3 rounded-2xl border text-center transition-all duration-200 border-slate-200 bg-white dark:bg-slate-900 shadow-sm hover:border-slate-300 dark:hover:border-slate-700"
      >
        <div class="w-10 h-10 rounded-xl flex items-center justify-center border bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900">
          <i data-lucide="plus" class="w-5 h-5"></i>
        </div>
        <span class="text-xs font-bold text-slate-850 dark:text-slate-100 mt-2 line-clamp-1 w-full">Create custom habit</span>
        <span class="text-[9px] text-slate-450 dark:text-slate-500 uppercase mt-0.5 font-semibold">Blank</span>
      </button>
    `;

    const presetCardsHtml = presets.map(p => {
      const categoryMeta = APP_CONFIG.categories.find(cat => cat.id === p.category);
      const colorKey = categoryMeta ? categoryMeta.defaultColor : p.defaultColor;
      
      const iconBoxClass = 'w-10 h-10 rounded-xl flex items-center justify-center border bg-slate-50 dark:bg-slate-800 border-slate-150 dark:border-slate-700 text-slate-400';

      return `
        <button 
          type="button"
          data-drawer-preset="${p.id}"
          class="onboarding-preset-card relative overflow-hidden flex flex-col items-center pt-4 pb-3 px-3 rounded-2xl border text-center transition-all duration-200 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-sm"
        >
          <div class="${iconBoxClass}">
            <i data-lucide="${p.icon || 'target'}" class="w-5 h-5"></i>
          </div>
          <span class="text-xs font-bold text-slate-850 dark:text-slate-100 mt-2 line-clamp-1 w-full">${p.name}</span>
          <span class="text-[9px] text-slate-450 dark:text-slate-500 uppercase mt-0.5 font-semibold">${p.category}</span>
        </button>
      `;
    }).join('');

    return `
      <div id="create-page-selection-view" class="flex flex-col gap-6 animate-fade-in pb-8">
        <div>
          <h1 class="text-xl font-bold text-slate-800">Choose an option</h1>
          <p class="text-xs text-slate-500 mt-1">Start from scratch or pick a template.</p>
        </div>
        <div class="grid grid-cols-3 gap-2.5">
          ${customHabitHtml}
          ${presetCardsHtml}
        </div>
      </div>
    `;
  },

  renderFormView() {
    const prefilled = this.prefilledData;
    const currentStep = this.currentStep;
    const totalSteps = this.totalSteps;

    const activeIcon = prefilled ? prefilled.icon : this.iconList[0];
    const activeCategory = prefilled ? prefilled.category : APP_CONFIG.categories[0].id;
    const activeType = prefilled ? prefilled.type : 'checkbox';
    const activeWeeklyTarget = prefilled ? prefilled.weeklyTarget : 7;

    const iconGridHtml = this.iconList.map(icon => {
      const isSelected = icon === activeIcon;
      return `
        <button 
          type="button"
          data-icon-select="${icon}"
          class="icon-grid-btn w-11 h-11 rounded-full border flex items-center justify-center transition-all ${
            isSelected 
              ? 'border-accentViolet bg-slate-100 text-accentViolet shadow-sm' 
              : 'border-slate-200 bg-white text-slate-500 hover:border-slate-400 hover:text-slate-700'
          }"
        >
          <i data-lucide="${icon}" class="w-4.5 h-4.5"></i>
        </button>
      `;
    }).join('');

    const categoryChipsHtml = APP_CONFIG.categories.map(cat => {
      const pastelColor = APP_CONFIG.pastelColors.find(p => p.key === cat.defaultColor);
      const pastelHex = pastelColor ? pastelColor.hex : '#e2e8f0';
      const isSelected = cat.id === activeCategory;
        
      const chipClass = isSelected
        ? 'border-slate-900 bg-slate-900 text-white shadow-sm dark:bg-slate-800 dark:border-slate-700'
        : 'border-border-primary bg-cardBg text-text-secondary hover:border-slate-400 dark:hover:border-slate-500';

      const circleClass = 'w-2.5 h-2.5 rounded-full inline-block';
      const circleStyle = `background-color: ${pastelHex};`;

      return `
        <button 
          type="button"
          data-category-select="${cat.id}"
          class="category-chip-btn px-3 py-1.5 rounded-full text-xs font-semibold transition-all border flex items-center gap-1.5 whitespace-nowrap ${chipClass}"
        >
          <span class="${circleClass}" style="${circleStyle}"></span>
          ${cat.name}
        </button>
      `;
    }).join('');

    // Preset dropdown grouped by category
    const groupedPresetsHtml = APP_CONFIG.categories.map(cat => {
      const catPresets = APP_CONFIG.presets.filter(p => p.category === cat.id);
      if (catPresets.length === 0) return '';
      return `
        <div class="py-1">
          <div class="px-4 py-1.5 text-[9px] font-bold tracking-widest uppercase text-slate-400">${cat.name}</div>
          ${catPresets.map(preset => `
            <button 
              type="button"
              data-preset-id="${preset.id}"
              data-preset-name="${preset.name}"
              class="dropdown-item w-full text-left px-4 py-2.5 text-xs text-slate-600 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-3 transition-colors"
            >
              <span class="w-6 h-6 rounded-md bg-slate-100 text-slate-500 flex items-center justify-center">
                <i data-lucide="${preset.icon || 'target'}" class="w-3.5 h-3.5"></i>
              </span>
              <span class="font-medium">${preset.name}</span>
              <span class="ml-auto text-[9px] text-slate-400 font-semibold uppercase">${preset.type}</span>
            </button>
          `).join('')}
        </div>
      `;
    }).join('<div class="border-t border-slate-100"></div>');

    const pageTitle = prefilled 
      ? `Configure: ${prefilled.name} (${currentStep} of ${totalSteps})` 
      : 'Create New Habit';
    const pageSub = prefilled 
      ? 'Customize goals, triggers, metrics, and parameters before starting.' 
      : 'Type a name or pick a preset. 34 templates available.';
    const submitBtnLabel = prefilled 
      ? (currentStep === totalSteps ? 'Finish & Start coffee ring' : 'Save & Continue')
      : 'Create Habit';

    return `
      <div id="create-page-view" class="flex flex-col gap-5 animate-fade-in pb-8">
        <!-- Back trigger if onboarding prefill -->
        <!-- Back triggers -->
        ${prefilled && totalSteps > 0 ? `
          <div class="flex items-center gap-3 mb-1">
            <button 
              type="button" 
              onclick="window.OnboardingGoToStep(3)" 
              class="w-8 h-8 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-slate-800"
            >
              <i data-lucide="arrow-left" class="w-4 h-4"></i>
            </button>
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Configure Goals</span>
          </div>
        ` : `
          <div class="flex items-center gap-3 mb-1">
            <button 
              type="button" 
              id="create-form-back-btn"
              class="w-8 h-8 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-slate-800"
            >
              <i data-lucide="arrow-left" class="w-4 h-4"></i>
            </button>
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Back to Templates</span>
          </div>
        `}

        <div>
          <h1 class="text-xl font-bold text-slate-800">${pageTitle}</h1>
          <p class="text-xs text-slate-500 mt-1">${pageSub}</p>
        </div>

        <form id="habit-form" class="flex flex-col gap-5 relative">
          
          <!-- Name Input with auto-suggest -->
          <div class="relative">
            <label class="block text-label-muted mb-2">Habit Name</label>
            <input 
              type="text" 
              id="habit-name" 
              value="${prefilled ? prefilled.name : ''}"
              placeholder="e.g. Gym Workout, Drink Water" 
              required
              autocomplete="off"
              class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-slate-900 focus:bg-white"
            />
            <!-- Hide suggest list in onboarding mode -->
            ${!prefilled ? `
              <div 
                id="presets-dropdown" 
                class="hidden absolute left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden max-h-72 overflow-y-auto"
              >
                ${groupedPresetsHtml}
              </div>
            ` : ''}
          </div>

          <!-- Category Selector -->
          <div>
            <label class="block text-label-muted mb-2.5">Category</label>
            <div id="category-picker" class="flex flex-wrap gap-2">
              ${categoryChipsHtml}
            </div>
            <input type="hidden" id="habit-category" value="${activeCategory}" />
          </div>

          <!-- Icon Grid Picker -->
          <div>
            <label class="block text-label-muted mb-2.5">Icon</label>
            <div id="icon-picker-grid" class="grid grid-cols-8 gap-2">
              ${iconGridHtml}
            </div>
            <input type="hidden" id="habit-icon" value="${activeIcon}" />
          </div>

          <!-- Type Selector (Checkbox vs Number) -->
          <div>
            <label class="block text-label-muted mb-2">Type</label>
            <div class="grid grid-cols-2 bg-slate-100 p-1 rounded-xl border border-slate-200/60">
              <button 
                type="button" 
                data-type="checkbox" 
                class="type-tab-btn py-2.5 text-center text-xs font-semibold rounded-lg transition-all ${
                  activeType === 'checkbox' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }"
              >
                Yes / No
              </button>
              <button 
                type="button" 
                data-type="number" 
                class="type-tab-btn py-2.5 text-center text-xs font-semibold rounded-lg transition-all ${
                  activeType === 'number' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }"
              >
                Metric Value
              </button>
            </div>
          </div>

          <!-- Weekly Target -->
          <div>
            <label class="block text-label-muted mb-2">Weekly Target</label>
            <div class="flex items-center gap-3">
              <input 
                type="range" 
                id="weekly-target-slider" 
                min="1" max="7" value="${activeWeeklyTarget}" 
                class="flex-1 accent-slate-900"
              />
              <span id="weekly-target-label" class="text-sm font-bold text-slate-800 w-16 text-right">${activeWeeklyTarget}/7 days</span>
            </div>
          </div>

          <!-- Number-specific fields -->
          <div id="number-fields-wrapper" class="${activeType === 'number' ? '' : 'hidden'} flex flex-col gap-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-label-muted mb-2">Min Target</label>
                <input 
                  type="number" 
                  id="goal-numeric-min" 
                  value="${prefilled && prefilled.minGoal !== null ? prefilled.minGoal : ''}"
                  placeholder="e.g. 1800"
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-slate-900 focus:bg-white"
                />
              </div>
              <div>
                <label class="block text-label-muted mb-2">Max Target</label>
                <input 
                  type="number" 
                  id="goal-numeric-max" 
                  value="${prefilled && prefilled.maxGoal !== null ? prefilled.maxGoal : ''}"
                  placeholder="e.g. 2200"
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-slate-900 focus:bg-white"
                />
              </div>
            </div>
            <div>
              <label class="block text-label-muted mb-2">Unit</label>
              <input 
                type="text" 
                id="goal-numeric-unit" 
                value="${prefilled ? prefilled.unit || '' : ''}"
                placeholder="e.g. kcal, glasses, hours"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-slate-900 focus:bg-white"
              />
            </div>
          </div>

          <!-- Default Tags -->
          <div>
            <label class="block text-label-muted mb-2">Tags</label>
            <div id="form-tags-list" class="flex flex-wrap gap-1.5 mb-2"></div>
            <div class="flex items-center gap-2">
              <input 
                type="text" 
                id="form-new-tag-input" 
                placeholder="Add tag (e.g. Legs, Cardio)" 
                class="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none w-full"
              />
              <button type="button" id="form-add-tag-btn" class="bg-slate-880 hover:bg-slate-700 text-white px-4 py-3 text-xs rounded-xl font-semibold">Add</button>
            </div>
          </div>

          <!-- Submit -->
          <button 
            type="submit" 
            class="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-all text-center mt-2 text-sm"
          >
            ${submitBtnLabel}
          </button>
        </form>
      </div>
    `;
  },

  bindEvents(state, onCreatedCallback) {
    if (this.viewMode === 'selection') {
      const customBtn = document.getElementById('drawer-custom-habit');
      if (customBtn) {
        customBtn.addEventListener('click', () => {
          this.viewMode = 'form';
          this.prefilledData = null;
          const root = document.getElementById('app-root');
          root.innerHTML = this.renderFormView();
          this.bindEvents(state, onCreatedCallback);
          if (window.lucide) window.lucide.createIcons();
        });
      }
      
      document.querySelectorAll('[data-drawer-preset]').forEach(btn => {
        btn.addEventListener('click', () => {
          const presetId = btn.dataset.drawerPreset;
          const preset = APP_CONFIG.presets.find(p => p.id === presetId);
          if (preset) {
            this.viewMode = 'form';
            this.prefilledData = preset;
            const root = document.getElementById('app-root');
            root.innerHTML = this.renderFormView();
            this.bindEvents(state, onCreatedCallback);
            if (window.lucide) window.lucide.createIcons();
          }
        });
      });
      return;
    }

    const form = document.getElementById('habit-form');
    const backBtn = document.getElementById('create-form-back-btn');
    const nameInput = document.getElementById('habit-name');
    const dropdown = document.getElementById('presets-dropdown');
    const iconInput = document.getElementById('habit-icon');
    const categoryInput = document.getElementById('habit-category');
    const iconGrid = document.getElementById('icon-picker-grid');
    const categoryPicker = document.getElementById('category-picker');
    const weeklySlider = document.getElementById('weekly-target-slider');
    const weeklyLabel = document.getElementById('weekly-target-label');
    
    const typeButtons = document.querySelectorAll('.type-tab-btn');
    const numberFieldsWrapper = document.getElementById('number-fields-wrapper');

    const tagsListDiv = document.getElementById('form-tags-list');
    const newTagInput = document.getElementById('form-new-tag-input');
    const addTagBtn = document.getElementById('form-add-tag-btn');

    let currentType = this.prefilledData ? this.prefilledData.type : 'checkbox';
    let currentTags = this.prefilledData && this.prefilledData.tags ? [...this.prefilledData.tags] : [];
    let currentIcon = this.prefilledData ? this.prefilledData.icon : this.iconList[0];
    let currentCategory = this.prefilledData ? this.prefilledData.category : APP_CONFIG.categories[0].id;

    // --- Tag rendering ---
    const renderFormTags = () => {
      tagsListDiv.innerHTML = currentTags.map(tag => `
        <span class="px-2.5 py-1 rounded bg-slate-100 text-xs text-slate-600 font-semibold border border-slate-200 flex items-center gap-1.5 animate-fade-in">
          ${tag}
          <button type="button" data-tag-remove="${tag}" class="text-[10px] text-slate-400 hover:text-slate-600">✕</button>
        </span>
      `).join('');
      tagsListDiv.querySelectorAll('[data-tag-remove]').forEach(btn => {
        btn.addEventListener('click', () => {
          currentTags = currentTags.filter(t => t !== btn.dataset.tagRemove);
          renderFormTags();
        });
      });
    };
    renderFormTags();

    // --- Icon selection ---
    const selectIcon = (iconName) => {
      currentIcon = iconName;
      iconInput.value = iconName;
      iconGrid.querySelectorAll('.icon-grid-btn').forEach(btn => {
        btn.className = btn.dataset.iconSelect === iconName
          ? "icon-grid-btn w-11 h-11 rounded-full border flex items-center justify-center transition-all border-accentViolet bg-slate-100 text-accentViolet shadow-sm"
          : "icon-grid-btn w-11 h-11 rounded-full border flex items-center justify-center transition-all border-slate-200 bg-white text-slate-500 hover:border-slate-400 hover:text-slate-700";
      });
    };

    iconGrid.querySelectorAll('.icon-grid-btn').forEach(btn => {
      btn.addEventListener('click', (e) => { e.stopPropagation(); selectIcon(btn.dataset.iconSelect); });
    });

    // --- Category selection ---
    const selectCategory = (catId) => {
      currentCategory = catId;
      categoryInput.value = catId;
      categoryPicker.querySelectorAll('.category-chip-btn').forEach(btn => {
        btn.className = btn.dataset.categorySelect === catId
          ? "category-chip-btn px-3 py-1.5 rounded-full text-xs font-semibold transition-all border flex items-center gap-1.5 whitespace-nowrap border-slate-900 bg-slate-900 text-white shadow-sm dark:bg-slate-800 dark:border-slate-700"
          : "category-chip-btn px-3 py-1.5 rounded-full text-xs font-semibold transition-all border flex items-center gap-1.5 whitespace-nowrap border-border-primary bg-cardBg text-text-secondary hover:border-slate-400 dark:hover:border-slate-500";
      });
    };

    categoryPicker.querySelectorAll('.category-chip-btn').forEach(btn => {
      btn.addEventListener('click', (e) => { e.stopPropagation(); selectCategory(btn.dataset.categorySelect); });
    });

    // --- Type selection ---
    const setType = (type) => {
      currentType = type;
      typeButtons.forEach(btn => {
        btn.className = btn.dataset.type === type
          ? "type-tab-btn py-2.5 text-center text-xs font-semibold rounded-lg bg-slate-900 text-white transition-all shadow-sm"
          : "type-tab-btn py-2.5 text-center text-xs font-semibold rounded-lg text-slate-500 hover:text-slate-800 transition-all";
      });
      numberFieldsWrapper.classList.toggle('hidden', type !== 'number');
    };

    typeButtons.forEach(btn => {
      btn.addEventListener('click', () => setType(btn.dataset.type));
    });

    // --- Weekly target slider ---
    weeklySlider.addEventListener('input', () => {
      weeklyLabel.textContent = `${weeklySlider.value}/7 days`;
    });

    // --- Preset dropdown & suggester (Skip in onboarding) ---
    if (dropdown) {
      nameInput.addEventListener('focus', () => {
        dropdown.classList.remove('hidden');
        if (window.lucide) window.lucide.createIcons();
      });

      document.addEventListener('click', (e) => {
        if (!nameInput.contains(e.target) && !dropdown.contains(e.target)) {
          dropdown.classList.add('hidden');
        }
      });

      nameInput.addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase().trim();
        let hasMatches = false;
        dropdown.querySelectorAll('.dropdown-item').forEach(item => {
          const name = item.dataset.presetName.toLowerCase();
          const visible = name.includes(val);
          item.classList.toggle('hidden', !visible);
          item.classList.toggle('flex', visible);
          if (visible) hasMatches = true;
        });
        dropdown.classList.toggle('hidden', !hasMatches);
      });

      dropdown.addEventListener('click', (e) => {
        const item = e.target.closest('.dropdown-item');
        if (!item) return;

        const preset = APP_CONFIG.presets.find(p => p.id === item.dataset.presetId);
        if (!preset) return;

        nameInput.value = preset.name;
        currentTags = [...preset.tags];
        renderFormTags();
        
        selectIcon(preset.icon || 'target');
        selectCategory(preset.category);
        setType(preset.type);
        weeklySlider.value = preset.weeklyTarget || 7;
        weeklyLabel.textContent = `${preset.weeklyTarget || 7}/7 days`;

        if (preset.type === 'number') {
          document.getElementById('goal-numeric-min').value = preset.minGoal ?? '';
          document.getElementById('goal-numeric-max').value = preset.maxGoal ?? '';
          document.getElementById('goal-numeric-unit').value = preset.unit || '';
        }

        dropdown.classList.add('hidden');
      });
    }

    // --- Add tag ---
    const handleAddTag = () => {
      const tagText = newTagInput.value.trim();
      if (tagText && !currentTags.includes(tagText)) {
        currentTags.push(tagText);
        renderFormTags();
      }
      newTagInput.value = "";
    };

    addTagBtn.addEventListener('click', handleAddTag);
    newTagInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } });

    // --- Submit ---
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      let minGoalValue = null;
      let maxGoalValue = null;
      let unitValue = 'times';

      if (currentType === 'number') {
        const minRaw = document.getElementById('goal-numeric-min').value;
        const maxRaw = document.getElementById('goal-numeric-max').value;
        minGoalValue = minRaw !== '' ? parseFloat(minRaw) : null;
        maxGoalValue = maxRaw !== '' ? parseFloat(maxRaw) : null;
        unitValue = document.getElementById('goal-numeric-unit').value.trim() || 'units';
      }

      const newHabit = {
        id: this.prefilledData ? this.prefilledData.id : `habit_${Date.now()}`,
        name: nameInput.value.trim(),
        type: currentType,
        category: currentCategory,
        weeklyTarget: parseInt(weeklySlider.value, 10),
        minGoal: minGoalValue,
        maxGoal: maxGoalValue,
        unit: unitValue,
        icon: currentIcon,
        tags: currentTags,
        createdAt: new Date().toISOString()
      };

      if (this.prefilledData && this.totalSteps > 0) {
        // If onboarding mode, pass configured object to callback without saving automatically
        onCreatedCallback(newHabit);
      } else {
        state.saveHabit(newHabit);
        onCreatedCallback();
      }
    });

    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.viewMode = 'selection';
        const root = document.getElementById('app-root');
        root.innerHTML = this.renderSelectionView();
        this.bindEvents(state, onCreatedCallback);
        if (window.lucide) window.lucide.createIcons();
      });
    }
  }
};
