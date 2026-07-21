import { APP_CONFIG } from '../../config/appConfig.js';
import { GridCard } from '../ui/GridCard.js';
import { CreatePage } from './CreatePage.js';
import { AuthPage } from './AuthPage.js';
import { supabase } from '../../db/supabaseClient.js';

export const OnboardingPage = {
  step: 1, // 1: Welcome, 2: Name Input, 3: Habits Selector, 4: Prefilled Create Pages, 5: Save Progress Choice
  userName: "",
  selectedPresets: [], // default to empty
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
        this.selectedPresets = parsed.selectedPresets || [];
        this.currentPresetIndex = parsed.currentPresetIndex || 0;
        this.customGoals = parsed.customGoals || [];
      } else {
        this.step = 1;
        this.userName = "";
        this.selectedPresets = [];
        this.currentPresetIndex = 0;
        this.customGoals = [];
      }
    } catch(e) {}
  },

  clearState() {
    localStorage.removeItem('coffeering_onboarding_draft');
  },

  saveOnboardingDataToLocalCache() {
    if (!this.userName || this.userName.trim() === "") return;

    const userProfile = { name: this.userName.trim() };
    localStorage.setItem('coffeering_user_profile', JSON.stringify(userProfile));

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
      tags: g.tags || [],
      createdAt: new Date().toISOString()
    }));

    localStorage.setItem('coffeering_habits', JSON.stringify(habits));
    localStorage.setItem('coffeering_check_ins', JSON.stringify([]));

    const colors = {};
    APP_CONFIG.categories.forEach(cat => {
      colors[cat.id] = cat.defaultColor;
    });
    localStorage.setItem('coffeering_category_colors', JSON.stringify(colors));
  },

  render() {
    if (this.step === 1) {
      return this.renderStep1();
    } else if (this.step === 2) {
      return this.renderStep2();
    } else if (this.step === 3) {
      return this.renderStep3();
    } else if (this.step === 4) {
      return this.renderStep4();
    } else {
      return this.renderStep5();
    }
  },

  renderStep1() {
    return `
      <div id="onboarding-page" class="flex flex-col justify-between min-h-[80vh] px-4 py-8 animate-fade-in text-text-primary">
        <div class="flex flex-col items-center text-center mt-8 gap-4">
          <div class="w-16 h-16 rounded-3xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
            <i data-lucide="target" class="w-8 h-8"></i>
          </div>
          <div class="flex flex-col gap-1.5 mt-2">
            <h1 class="text-2xl font-bold tracking-tight text-text-primary leading-tight">coffee ring</h1>
            <p class="text-xs font-semibold text-text-secondary uppercase tracking-widest">Atomic Habit Builder</p>
          </div>
        </div>

        <div class="flex flex-col gap-3.5 my-8 max-w-sm mx-auto w-full">
          <div class="flex items-start gap-4 p-4 bg-surface-card border border-divider rounded-2xl shadow-sm">
            <div class="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
              <i data-lucide="zap" class="w-5 h-5"></i>
            </div>
            <div class="flex flex-col gap-0.5">
              <span class="text-xs font-bold text-text-primary">Build Identity Routines</span>
              <span class="text-[10px] text-text-secondary font-medium leading-relaxed">Protect streaks, calculate bounce-backs, and build consistency.</span>
            </div>
          </div>

          <div class="flex items-start gap-4 p-4 bg-surface-card border border-divider rounded-2xl shadow-sm">
            <div class="w-9 h-9 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 flex-shrink-0">
              <i data-lucide="refresh-cw" class="w-5 h-5"></i>
            </div>
            <div class="flex flex-col gap-0.5">
              <span class="text-xs font-bold text-text-primary">Bounce-Back Strategy</span>
              <span class="text-[10px] text-text-secondary font-medium leading-relaxed">Focus on "Never Miss Twice" psychology to recover routinely.</span>
            </div>
          </div>

          <div class="flex items-start gap-4 p-4 bg-surface-card border border-divider rounded-2xl shadow-sm">
            <div class="w-9 h-9 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 flex-shrink-0">
              <i data-lucide="bar-chart-2" class="w-5 h-5"></i>
            </div>
            <div class="flex flex-col gap-0.5">
              <span class="text-xs font-bold text-text-primary">Behavior Analytics</span>
              <span class="text-[10px] text-text-secondary font-medium leading-relaxed">Unlock detailed metrics, weekend performance slumps, and triggers.</span>
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
          <div class="text-center mt-2">
            <button id="onboarding-login-btn" class="text-xs text-text-secondary hover:text-text-primary underline">Already have an account? Sign In</button>
          </div>
        </div>
      </div>
    `;
  },

  renderStep2() {
    const isNextDisabled = !this.userName || this.userName.trim() === "";
    const nextBtnClass = isNextDisabled 
      ? "bg-surface-sunken text-text-secondary cursor-not-allowed" 
      : "bg-slate-900 hover:bg-slate-850 active:scale-98 text-white shadow-md";

    return `
      <div id="onboarding-page" class="flex flex-col justify-between min-h-[80vh] px-4 py-8 animate-fade-in text-text-primary">
        <div>
          <div class="flex items-center gap-3 mb-8">
            <button 
              type="button" 
              onclick="window.OnboardingGoToStep(1)" 
              class="w-8 h-8 rounded-full border border-divider bg-surface-card flex items-center justify-center text-text-secondary hover:text-text-primary"
            >
              <i data-lucide="arrow-left" class="w-4 h-4"></i>
            </button>
            <span class="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Step 1 of 3</span>
          </div>

          <div class="flex flex-col gap-3 mt-4 max-w-sm mx-auto w-full">
            <h2 class="text-xl font-bold text-text-primary">What should we call you?</h2>
            <p class="text-xs text-text-secondary leading-relaxed">Your profile remains completely local, private, and saved only on your device.</p>
            
            <input 
              type="text" 
              id="onboarding-name-input"
              value="${this.userName}"
              placeholder="Enter your name..."
              class="w-full border border-divider rounded-2xl px-4 py-3.5 text-sm font-bold bg-surface-card text-text-primary focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 mt-4 transition-all"
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
    const hasSelection = this.selectedPresets.length > 0;
    const nextBtnClass = "bg-slate-900 hover:bg-slate-850 active:scale-98 text-white shadow-md";
    const btnText = hasSelection ? "Configure Goals" : "Finish Setup";

    const presetCardsHtml = presets.map(p => {
      const isSelected = this.selectedPresets.includes(p.id);
      return GridCard.render({
        id: p.id,
        name: p.name,
        category: p.category,
        icon: p.icon,
        isSelected: isSelected,
        actionAttr: `data-preset-id="${p.id}"`
      });
    }).join('');

    return `
      <div id="onboarding-page" class="flex flex-col justify-between min-h-[90vh] px-4 py-8 animate-fade-in text-text-primary">
        <div>
          <div class="flex items-center gap-3 mb-6">
            <button 
              type="button" 
              onclick="window.OnboardingGoToStep(2)" 
              class="w-8 h-8 rounded-full border border-divider bg-surface-card flex items-center justify-center text-text-secondary hover:text-text-primary"
            >
              <i data-lucide="arrow-left" class="w-4 h-4"></i>
            </button>
            <span class="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Step 2 of 3</span>
          </div>

          <div class="flex flex-col gap-2.5 max-w-sm mx-auto w-full mb-6">
            <h2 class="text-xl font-bold text-text-primary">Choose your starter habits</h2>
            <p class="text-xs text-text-secondary leading-relaxed">Select habits to begin with. You will configure types and goals in the next step.</p>
          </div>

          <div class="grid grid-cols-3 gap-4 max-w-sm mx-auto w-full">
            ${presetCardsHtml}
          </div>
        </div>

        <div class="max-w-sm mx-auto w-full mt-8">
          <button 
            type="button"
            id="onboarding-to-goals-btn"
            class="w-full py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${nextBtnClass}"
          >
            <span>${btnText}</span>
            <i data-lucide="arrow-right" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
    `;
  },

  renderStep4() {
    const activePresetId = this.selectedPresets[this.currentPresetIndex];
    const p = APP_CONFIG.presets.find(x => x.id === activePresetId);
    
    return CreatePage.render(p, this.currentPresetIndex + 1, this.selectedPresets.length);
  },

  renderStep5() {
    return `
      <div id="onboarding-page" class="flex flex-col gap-6 px-4 py-6 animate-fade-in text-text-primary max-w-sm mx-auto w-full">
        <div>
          <div class="flex items-center gap-3 mb-6">
            <button 
              type="button" 
              onclick="window.OnboardingGoToStep(3)" 
              class="w-8 h-8 rounded-full border border-divider bg-surface-card flex items-center justify-center text-text-secondary hover:text-text-primary"
            >
              <i data-lucide="arrow-left" class="w-4 h-4"></i>
            </button>
            <span class="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Step 3 of 3</span>
          </div>

          <div class="flex flex-col gap-2 mb-6">
            <h2 class="text-2xl font-bold text-text-primary">Where to store your data?</h2>
            <p class="text-xs text-text-secondary leading-relaxed">Choose how you would like to save your habit progress. Both options are completely free.</p>
          </div>

          <div class="flex flex-col gap-4">
            <!-- Option 1: Cloud Storage Card -->
            <button 
              type="button"
              id="onboarding-cloud-btn"
              class="w-full text-left p-5 border border-divider hover:border-slate-800 dark:hover:border-slate-400 bg-surface-card rounded-2xl transition-all shadow-sm group hover:shadow-md active:scale-[0.99] flex flex-col gap-3"
            >
              <div class="flex items-center justify-between w-full">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                    <i data-lucide="cloud" class="w-5 h-5"></i>
                  </div>
                  <div>
                    <h3 class="text-sm font-bold text-text-primary">Store Data in Cloud</h3>
                    <span class="text-[10px] font-semibold text-text-secondary">Eva Projects account</span>
                  </div>
                </div>
                <i data-lucide="chevron-right" class="w-4 h-4 text-text-secondary group-hover:translate-x-0.5 transition-transform"></i>
              </div>

              <div class="grid grid-cols-2 gap-2 text-[11px] pt-3 border-t border-divider/60">
                <div class="flex items-center gap-1.5 text-text-primary font-medium">
                  <i data-lucide="check" class="w-3.5 h-3.5 text-emerald-600 flex-shrink-0"></i>
                  <span>Multi-device sync</span>
                </div>
                <div class="flex items-center gap-1.5 text-text-primary font-medium">
                  <i data-lucide="check" class="w-3.5 h-3.5 text-emerald-600 flex-shrink-0"></i>
                  <span>Cloud backups</span>
                </div>
              </div>
            </button>

            <!-- Option 2: Local Storage Card -->
            <button 
              type="button"
              id="onboarding-guest-btn"
              class="w-full text-left p-5 border border-divider hover:border-slate-800 dark:hover:border-slate-400 bg-surface-card rounded-2xl transition-all shadow-sm group hover:shadow-md active:scale-[0.99] flex flex-col gap-3"
            >
              <div class="flex items-center justify-between w-full">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100 flex items-center justify-center">
                    <i data-lucide="hard-drive" class="w-5 h-5"></i>
                  </div>
                  <div>
                    <h3 class="text-sm font-bold text-text-primary">Store Data in Local Storage</h3>
                    <span class="text-[10px] font-semibold text-text-secondary">Guest Mode</span>
                  </div>
                </div>
                <i data-lucide="chevron-right" class="w-4 h-4 text-text-secondary group-hover:translate-x-0.5 transition-transform"></i>
              </div>

              <div class="grid grid-cols-2 gap-2 text-[11px] pt-3 border-t border-divider/60">
                <div class="flex items-center gap-1.5 text-text-primary font-medium">
                  <i data-lucide="check" class="w-3.5 h-3.5 text-emerald-600 flex-shrink-0"></i>
                  <span>No account needed</span>
                </div>
                <div class="flex items-center gap-1.5 text-text-primary font-medium">
                  <i data-lucide="check" class="w-3.5 h-3.5 text-emerald-600 flex-shrink-0"></i>
                  <span>100% private</span>
                </div>
              </div>
            </button>
          </div>

          <div class="mt-4 pt-3 text-center border-t border-divider/40">
            <p class="text-[11px] text-text-secondary leading-relaxed">
              Starting with local storage? You can easily transfer your data to cloud storage anytime later by signing in.
            </p>
          </div>
        </div>
      </div>
    `;
  },

  bindEvents(state, onComplete) {
    if (this.step === 1) {
      const loginLink = document.getElementById('onboarding-login-btn');
      if (loginLink) {
        loginLink.addEventListener('click', () => {
          AuthPage.activeTab = 'login';
          window.appController.navigate('auth');
        });
      }
    } else if (this.step === 2) {
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
              nextBtn.className = "w-full py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 bg-surface-sunken text-text-secondary cursor-not-allowed";
            } else {
              nextBtn.className = "w-full py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-850 active:scale-98 text-white shadow-md";
            }
          }
        });
        nameInput.focus();
      }
    } else if (this.step === 3) {
      document.querySelectorAll('.onboarding-preset-card').forEach(card => {
        card.addEventListener('click', () => {
          const id = card.dataset.presetId;
          if (this.selectedPresets.includes(id)) {
            this.selectedPresets = this.selectedPresets.filter(x => x !== id);
          } else {
            this.selectedPresets.push(id);
          }
          this.saveState();
          
          const root = document.getElementById('app-root');
          if (root) {
            root.innerHTML = this.render();
            this.bindEvents(state, onComplete);
            if (window.lucide) window.lucide.createIcons();
          }
        });
      });

      const toGoalsBtn = document.getElementById('onboarding-to-goals-btn');
      if (toGoalsBtn) {
        toGoalsBtn.addEventListener('click', () => {
          if (this.selectedPresets.length === 0) {
            if (!this.userName || this.userName.trim() === "") return;
            window.OnboardingGoToStep(5);
          } else {
            this.customGoals = [];
            this.currentPresetIndex = 0;
            window.OnboardingGoToStep(4);
          }
        });
      }
    } else if (this.step === 4) {
      CreatePage.bindEvents(state, (configuredHabit) => {
        this.customGoals.push(configuredHabit);

        if (this.currentPresetIndex < this.selectedPresets.length - 1) {
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
          window.OnboardingGoToStep(5);
        }
      });
    } else if (this.step === 5) {
      const cloudBtn = document.getElementById('onboarding-cloud-btn');
      const guestBtn = document.getElementById('onboarding-guest-btn');

      if (cloudBtn) {
        cloudBtn.addEventListener('click', () => {
          // Pre-save onboarding habits cache in localStorage, then redirect to AuthPage
          AuthPage.activeTab = 'signup';
          this.saveOnboardingDataToLocalCache();
          this.clearState();
          window.appController.navigate('auth');
        });
      }

      if (guestBtn) {
        guestBtn.addEventListener('click', async () => {
          if (supabase) {
            await supabase.auth.signOut();
          }
          // Save and complete locally
          this.saveOnboardingDataToLocalCache();
          localStorage.setItem('coffeering_onboarding_completed', 'true');
          state.init();
          this.clearState();
          if (onComplete) {
            onComplete();
          }
        });
      }
    }
  }
};
