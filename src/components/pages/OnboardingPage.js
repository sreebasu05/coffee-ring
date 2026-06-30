import { APP_CONFIG } from '../../config/appConfig.js';
import { CreatePage } from './CreatePage.js';

export const OnboardingPage = {
  step: 1, // 1: Welcome, 2: Name Input, 3: Habits Selector, 4: Prefilled Create Pages
  userName: "",
  selectedPresets: ['preset_gym', 'preset_steps', 'preset_water'], // pre-selected default seeds
  currentPresetIndex: 0, // Tracker index for Step 4 Create queue
  customGoals: [], // Accumulator array for finalized habits

  saveState() {
    localStorage.setItem('coffeering_onboarding_draft', JSON.stringify({
      step: this.step,
      userName: this.userName,
      selectedPresets: this.selectedPresets,
      currentPresetIndex: this.currentPresetIndex,
      customGoals: this.customGoals
    }));
  },

  loadState() {
    try {
      const data = localStorage.getItem('coffeering_onboarding_draft');
      if (data) {
        const parsed = JSON.parse(data);
        this.step = parsed.step || 1;
        this.userName = parsed.userName || "";
        this.selectedPresets = parsed.selectedPresets || ['preset_gym', 'preset_steps', 'preset_water'];
        this.currentPresetIndex = parsed.currentPresetIndex || 0;
        this.customGoals = parsed.customGoals || [];
      }
    } catch(e) {}
  },

  clearState() {
    localStorage.removeItem('coffeering_onboarding_draft');
  },

  render() {
    if (this.step === 1) {
      return this.renderStep1();
    } else if (this.step === 2) {
      return this.renderStep2();
    } else if (this.step === 3) {
      return this.renderStep3();
    } else {
      return this.renderStep4();
    }
  },

  renderStep1() {
    return `
      <div id="onboarding-page" class="flex flex-col justify-between min-h-[80vh] px-4 py-8 animate-fade-in text-slate-800">
        <div class="flex flex-col items-center text-center mt-8 gap-4">
          <div class="w-16 h-16 rounded-3xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
            <i data-lucide="target" class="w-8 h-8"></i>
          </div>
          <div class="flex flex-col gap-1.5 mt-2">
            <h1 class="text-2xl font-bold tracking-tight text-slate-900 leading-tight">coffee ring</h1>
            <p class="text-xs font-semibold text-slate-400 uppercase tracking-widest">Atomic Habit Builder</p>
          </div>
        </div>

        <div class="flex flex-col gap-3.5 my-8 max-w-sm mx-auto w-full">
          <div class="flex items-start gap-4 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
            <div class="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
              <i data-lucide="zap" class="w-5 h-5"></i>
            </div>
            <div class="flex flex-col gap-0.5">
              <span class="text-xs font-bold text-slate-800">Build Identity Routines</span>
              <span class="text-[10px] text-slate-500 font-medium leading-relaxed">Protect streaks, calculate bounce-backs, and build consistency.</span>
            </div>
          </div>

          <div class="flex items-start gap-4 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
            <div class="w-9 h-9 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 flex-shrink-0">
              <i data-lucide="refresh-cw" class="w-5 h-5"></i>
            </div>
            <div class="flex flex-col gap-0.5">
              <span class="text-xs font-bold text-slate-800">Bounce-Back Strategy</span>
              <span class="text-[10px] text-slate-500 font-medium leading-relaxed">Focus on "Never Miss Twice" psychology to recover routinely.</span>
            </div>
          </div>

          <div class="flex items-start gap-4 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
            <div class="w-9 h-9 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 flex-shrink-0">
              <i data-lucide="bar-chart-2" class="w-5 h-5"></i>
            </div>
            <div class="flex flex-col gap-0.5">
              <span class="text-xs font-bold text-slate-800">Behavior Analytics</span>
              <span class="text-[10px] text-slate-500 font-medium leading-relaxed">Unlock detailed metrics, weekend performance slumps, and triggers.</span>
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-3 max-w-sm mx-auto w-full">
          <button 
            type="button"
            onclick="window.OnboardingGoToStep(2)"
            class="w-full py-4 bg-slate-900 hover:bg-slate-850 active:scale-98 text-white rounded-2xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
          >
            <span>Get Started</span>
            <i data-lucide="arrow-right" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
    `;
  },

  renderStep2() {
    const isNextDisabled = !this.userName || this.userName.trim() === "";
    const nextBtnClass = isNextDisabled 
      ? "bg-slate-200 text-slate-400 cursor-not-allowed" 
      : "bg-slate-900 hover:bg-slate-850 active:scale-98 text-white shadow-md";

    return `
      <div id="onboarding-page" class="flex flex-col justify-between min-h-[80vh] px-4 py-8 animate-fade-in text-slate-800">
        <div>
          <div class="flex items-center gap-3 mb-8">
            <button 
              type="button" 
              onclick="window.OnboardingGoToStep(1)" 
              class="w-8 h-8 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-slate-800"
            >
              <i data-lucide="arrow-left" class="w-4 h-4"></i>
            </button>
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Step 1 of 3</span>
          </div>

          <div class="flex flex-col gap-3 mt-4 max-w-sm mx-auto w-full">
            <h2 class="text-xl font-bold text-slate-900">What should we call you?</h2>
            <p class="text-xs text-slate-500 leading-relaxed">Your profile remains completely local, private, and saved only on your device.</p>
            
            <input 
              type="text" 
              id="onboarding-name-input"
              value="${this.userName}"
              placeholder="Enter your name..."
              class="w-full border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-bold bg-white text-slate-800 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 mt-4 transition-all"
            />
          </div>
        </div>

        <div class="max-w-sm mx-auto w-full">
          <button 
            type="button"
            id="onboarding-name-next-btn"
            onclick="window.OnboardingGoToStep(3)"
            class="w-full py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${nextBtnClass}"
            ${isNextDisabled ? 'disabled' : ''}
          >
            <span>Continue</span>
            <i data-lucide="arrow-right" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
    `;
  },

  renderStep3() {
    const presets = APP_CONFIG.presets || [];
    const isNextDisabled = this.selectedPresets.length === 0;
    const nextBtnClass = isNextDisabled 
      ? "bg-slate-200 text-slate-400 cursor-not-allowed" 
      : "bg-slate-900 hover:bg-slate-850 active:scale-98 text-white shadow-md";

    const presetCardsHtml = presets.map(p => {
      const isSelected = this.selectedPresets.includes(p.id);
      
      const categoryMeta = APP_CONFIG.categories.find(cat => cat.id === p.category);
      const colorKey = categoryMeta ? categoryMeta.defaultColor : p.defaultColor;
      const pastelColorObj = APP_CONFIG.pastelColors.find(x => x.key === colorKey);
      const pastelHex = pastelColorObj ? pastelColorObj.hex : '#cbd5e1';

      const colorHexMap = {
        pastelMint: '#10b981',
        pastelAmber: '#f59e0b',
        pastelSky: '#0ea5e9',
        pastelRose: '#f43f5e',
        pastelLavender: '#8b5cf6',
        pastelPink: '#ec4899'
      };
      const themeHex = colorHexMap[colorKey] || '#0f172a';
      
      const iconBoxStyle = isSelected 
        ? `background-color: ${themeHex}1a; border-color: ${themeHex}33; color: ${themeHex};` 
        : '';
        
      const iconBoxClass = isSelected 
        ? 'w-10 h-10 rounded-xl flex items-center justify-center border'
        : 'w-10 h-10 rounded-xl flex items-center justify-center border bg-slate-50 dark:bg-slate-800 border-slate-150 dark:border-slate-700 text-slate-400';

      return `
        <button 
          type="button"
          data-preset-id="${p.id}"
          class="onboarding-preset-card relative overflow-hidden flex flex-col items-center pt-4 pb-3 px-3 rounded-2xl border text-center transition-all duration-200 ${
            isSelected 
              ? `border-slate-200/80 bg-white dark:bg-slate-900 shadow-sm`
              : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:border-slate-200 dark:hover:border-slate-700'
          }"
        >
          <!-- Top Accent Color Line when selected -->
          ${isSelected ? `<div class="absolute top-0 left-0 right-0 h-[3px]" style="background-color: ${pastelHex};"></div>` : ''}

          <div class="${iconBoxClass}" style="${iconBoxStyle}">
            <i data-lucide="${p.icon || 'target'}" class="w-5 h-5"></i>
          </div>
          <span class="text-xs font-bold text-slate-850 dark:text-slate-100 mt-2 line-clamp-1 w-full">${p.name}</span>
          <span class="text-[9px] text-slate-450 dark:text-slate-500 uppercase mt-0.5 font-semibold">${p.category}</span>
        </button>
      `;
    }).join('');

    return `
      <div id="onboarding-page" class="flex flex-col justify-between min-h-[90vh] px-4 py-8 animate-fade-in text-slate-800">
        <div>
          <div class="flex items-center gap-3 mb-6">
            <button 
              type="button" 
              onclick="window.OnboardingGoToStep(2)" 
              class="w-8 h-8 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-slate-800"
            >
              <i data-lucide="arrow-left" class="w-4 h-4"></i>
            </button>
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Step 2 of 3</span>
          </div>

          <div class="flex flex-col gap-2.5 max-w-sm mx-auto w-full mb-6">
            <h2 class="text-xl font-bold text-slate-900">Choose your starter habits</h2>
            <p class="text-xs text-slate-500 leading-relaxed">Select habits to begin with. You will configure types and goals in the next step.</p>
          </div>

          <div class="grid grid-cols-3 gap-2.5 max-w-sm mx-auto w-full">
            ${presetCardsHtml}
          </div>
        </div>

        <div class="max-w-sm mx-auto w-full mt-8">
          <button 
            type="button"
            id="onboarding-to-goals-btn"
            class="w-full py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${nextBtnClass}"
            ${isNextDisabled ? 'disabled' : ''}
          >
            <span>Configure Goals</span>
            <i data-lucide="arrow-right" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
    `;
  },

  renderStep4() {
    const activePresetId = this.selectedPresets[this.currentPresetIndex];
    const p = APP_CONFIG.presets.find(x => x.id === activePresetId);
    
    // Inject prefilled CreatePage template
    return CreatePage.render(p, this.currentPresetIndex + 1, this.selectedPresets.length);
  },

  bindEvents(state, onComplete) {
    if (this.step === 1) {
      // Welcome view binds inline on onclick attribute
    } else if (this.step === 2) {
      // Step 2 Name Input
      const nameInput = document.getElementById('onboarding-name-input');
      if (nameInput) {
        nameInput.addEventListener('input', (e) => {
          this.userName = e.target.value;
          this.saveState();
          const nextBtn = document.getElementById('onboarding-name-next-btn');
          if (nextBtn) {
            const isInvalid = !this.userName || this.userName.trim() === "";
            nextBtn.disabled = isInvalid;
            if (isInvalid) {
              nextBtn.className = "w-full py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 bg-slate-200 text-slate-400 cursor-not-allowed";
            } else {
              nextBtn.className = "w-full py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-850 active:scale-98 text-white shadow-md";
            }
          }
        });
        nameInput.focus();
      }
    } else if (this.step === 3) {
      // Step 3 Presets Cards selection
      document.querySelectorAll('.onboarding-preset-card').forEach(card => {
        card.addEventListener('click', () => {
          const id = card.dataset.presetId;
          if (this.selectedPresets.includes(id)) {
            this.selectedPresets = this.selectedPresets.filter(x => x !== id);
          } else {
            this.selectedPresets.push(id);
          }
          this.saveState();
          
          // Refresh step 3 view
          const root = document.getElementById('app-root');
          if (root) {
            root.innerHTML = this.render();
            this.bindEvents(state, onComplete);
            if (window.lucide) window.lucide.createIcons();
          }
        });
      });

      // Step 3 -> Step 4 Transition
      const toGoalsBtn = document.getElementById('onboarding-to-goals-btn');
      if (toGoalsBtn) {
        toGoalsBtn.addEventListener('click', () => {
          this.customGoals = [];
          this.currentPresetIndex = 0;
          window.OnboardingGoToStep(4);
        });
      }
    } else if (this.step === 4) {
      // Step 4: Sequentially bind CreatePage form
      CreatePage.bindEvents(state, (configuredHabit) => {
        // Save the configured details to memory
        this.customGoals.push(configuredHabit);

        if (this.currentPresetIndex < this.selectedPresets.length - 1) {
          // Move to next prefilled card
          this.currentPresetIndex++;
          this.saveState();
          const root = document.getElementById('app-root');
          if (root) {
            root.innerHTML = this.render();
            this.bindEvents(state, onComplete);
            if (window.lucide) window.lucide.createIcons();
            window.scrollTo(0, 0);
          }
        } else {
          // All habits configured! Save name profile and bootstrap coffee ring
          if (!this.userName || this.userName.trim() === "") return;

          const userProfile = { name: this.userName.trim() };
          localStorage.setItem('coffeering_user_profile', JSON.stringify(userProfile));

          // Save all finalized habits to localStorage
          const habits = this.customGoals.map((g, index) => ({
            id: `habit_onboarding_${Date.now()}_${index}`,
            name: g.name,
            type: g.type,
            category: g.category,
            weeklyTarget: g.weeklyTarget,
            minGoal: g.minGoal,
            maxGoal: g.maxGoal,
            unit: g.unit,
            icon: g.icon,
            tags: g.tags,
            createdAt: new Date().toISOString()
          }));

          localStorage.setItem('coffeering_habits', JSON.stringify(habits));
          localStorage.setItem('coffeering_check_ins', JSON.stringify([]));

          // Save default categories colors
          const colors = {};
          APP_CONFIG.categories.forEach(cat => {
            colors[cat.id] = cat.defaultColor;
          });
          localStorage.setItem('coffeering_category_colors', JSON.stringify(colors));

          // Initialize app state
          state.init();
          this.clearState();
          
          if (onComplete) {
            onComplete();
          }
        }
      });
    }
  }
};
