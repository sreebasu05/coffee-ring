import { appState } from './state/appState.js';
import './utils/syncDiagnostic.js';
import { Navbar } from './components/ui/Navbar.js';
import { TodayPage } from './components/pages/TodayPage.js';
import { CreatePage } from './components/pages/CreatePage.js';
import { DashboardPage } from './components/pages/DashboardPage.js';
import { HabitInsightPage } from './components/pages/HabitInsightPage.js';
import { GlossaryPage } from './components/pages/GlossaryPage.js';
import { OnboardingPage } from './components/pages/OnboardingPage.js';
import { AuthPage } from './components/pages/AuthPage.js';
import { ProfilePage } from './components/pages/ProfilePage.js';

class AppController {
  constructor() {
    this.currentTab = 'today'; // Tracks virtual routing
  }

  init() {
    // Setup Dark Mode Toggle
    const toggleBtn = document.getElementById('theme-toggle-btn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
        const isDark = document.documentElement.classList.contains('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        toggleBtn.innerHTML = isDark 
          ? '<i data-lucide="sun" class="w-5 h-5"></i>' 
          : '<i data-lucide="moon" class="w-5 h-5"></i>';
        if (window.lucide) window.lucide.createIcons();
      });

      // Load saved theme
      if (localStorage.getItem('theme') === 'dark') {
        document.documentElement.classList.add('dark');
        toggleBtn.innerHTML = '<i data-lucide="sun" class="w-5 h-5"></i>';
      }
    }

    // 1. Initialize State & Data
    appState.init();
    window.appState = appState;
    window.appController = this;

    // 2. Setup onboarding global handlers
    window.OnboardingGoToStep = (stepNum) => {
      OnboardingPage.step = stepNum;
      OnboardingPage.saveState();
      window.scrollTo(0, 0);
      this.render();
    };

    // 3. Initial Render
    this.render();

    // 4. Subscribe UI updates to state changes
    appState.subscribe(() => {
      this.render();
    });
  }

  // Swap pages routing
  navigate(tabName, options = {}) {
    this.currentTab = tabName;
    // If navigating to onboarding with a specific step, set it before render
    if (tabName === 'onboarding' && options.step) {
      OnboardingPage.step = options.step;
      OnboardingPage.saveState();
    }
    if (tabName === 'auth') {
      AuthPage.navigateOptions = options;
    }
    window.scrollTo(0, 0);
    this.render();
  }

  render() {
    const navRoot = document.getElementById('nav-root');
    
    // Save focused element state to prevent keypress interruption
    const activeEl = document.activeElement;
    const activeId = activeEl ? activeEl.id : null;
    const activeHabitId = activeEl ? activeEl.dataset?.habitId : null;
    const isNoteTextarea = activeEl ? activeEl.classList.contains('card-note-textarea') : false;
    const isNumericInput = activeEl ? activeEl.classList.contains('card-numeric-input') : false;

    // If specifically routing to auth or onboarding (e.g. from onboarding or sign out)
    if (this.currentTab === 'auth') {
      if (navRoot) {
        navRoot.innerHTML = '';
      }
      this.renderAuth();
      return;
    }

    if (this.currentTab === 'onboarding') {
      if (navRoot) {
        navRoot.innerHTML = '';
      }
      // Only reset to step 1 if no specific step was set via navigate()
      if (!OnboardingPage.step) {
        OnboardingPage.step = 1;
      }
      this.renderOnboarding();
      return;
    }

    // If user is not logged in / not onboarded, show OnboardingPage first
    const isOnboarded = appState.isCloudSynced || localStorage.getItem('coffeering_onboarding_completed') || (appState.user !== null && appState.user.name !== 'Guest');
    if (!isOnboarded) {
      if (navRoot) {
        navRoot.innerHTML = '';
      }
      this.renderOnboarding();
      return;
    }

    // Always render dynamic navbar for onboarded users
    Navbar.render(appState, this.currentTab, (tab) => this.navigate(tab));
    
    // Render dynamic page body
    this.renderBody();

    // Call Lucide to compile inline SVG icons dynamically
    if (window.lucide) {
      window.lucide.createIcons();
    }

    // Restore focus and cursor selection position seamlessly
    if (activeHabitId) {
      const selector = isNoteTextarea 
        ? `.card-note-textarea[data-habit-id="${activeHabitId}"]` 
        : (isNumericInput ? `.card-numeric-input[data-habit-id="${activeHabitId}"]` : null);
      if (selector) {
        const inputEl = document.querySelector(selector);
        if (inputEl) {
          inputEl.focus();
          // Move cursor to the end of the text/number
          const val = inputEl.value;
          inputEl.value = '';
          inputEl.value = val;
        }
      }
    } else if (activeId) {
      const el = document.getElementById(activeId);
      if (el) el.focus();
    }

    // 5. Show Push Notification Soft Prompt if needed
    this.showPushPromptIfNeeded();
  }

  async showPushPromptIfNeeded() {
    if (this.currentTab !== 'today') return;
    if (!appState.user || appState.user.name === 'Guest') return;
    if (localStorage.getItem('coffeering_push_prompt_seen')) return;

    // Check support first to prevent prompting in unsupported browsers (like Safari on iOS)
    const { NotificationService } = await import('./services/notificationService.js');
    if (!NotificationService.isSupported()) return;

    // Don't show if already subscribed
    const isSubscribed = await NotificationService.isSubscribed();
    if (isSubscribed) return;

    // Wait a couple of seconds so it's not too aggressive
    setTimeout(() => {
      // Recheck in case they navigated away
      if (this.currentTab !== 'today' || document.getElementById('push-soft-prompt')) return;

      const modalHtml = `
        <div id="push-soft-prompt" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div class="bg-surface-card border border-divider rounded-3xl p-6 w-full max-w-sm shadow-xl animate-fade-up">
            <div class="w-12 h-12 rounded-2xl bg-surface-sunken text-text-primary flex items-center justify-center mb-4 border border-divider">
              <i data-lucide="bell-ring" class="w-6 h-6"></i>
            </div>
            <h3 class="text-xl font-black text-text-primary mb-2">Enable Reminders</h3>
            <p class="text-sm text-text-secondary mb-6">Want a gentle nudge if you forget to log your habits? We can remind you every evening.</p>
            <div class="flex gap-3">
              <button id="push-prompt-decline" class="flex-1 py-3 px-4 rounded-xl font-bold text-text-secondary bg-surface-base border border-divider hover:bg-surface-sunken transition-colors">
                Not Now
              </button>
              <button id="push-prompt-accept" class="flex-1 py-3 px-4 rounded-xl font-bold bg-neutral-900 text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white transition-colors shadow-md">
                Yes, Please
              </button>
            </div>
          </div>
        </div>
      `;

      document.body.insertAdjacentHTML('beforeend', modalHtml);
      if (window.lucide) window.lucide.createIcons();

      const modal = document.getElementById('push-soft-prompt');
      const acceptBtn = document.getElementById('push-prompt-accept');
      const declineBtn = document.getElementById('push-prompt-decline');

      const closeAndRemember = () => {
        localStorage.setItem('coffeering_push_prompt_seen', 'true');
        modal.remove();
      };

      declineBtn.addEventListener('click', closeAndRemember);

      acceptBtn.addEventListener('click', async () => {
        acceptBtn.innerHTML = '<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i>';
        if (window.lucide) window.lucide.createIcons();
        
        const result = await NotificationService.saveSubscription(appState.user.id);
        
        closeAndRemember();
      });

    }, 2000);
  }

  renderAuth() {
    Navbar.hide();
    const root = document.getElementById('app-root');
    if (!root) return;

    root.innerHTML = AuthPage.render();
    AuthPage.bindEvents(appState, () => {
      appState.loadStateFromCache();
      this.navigate('today');
    });

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  renderOnboarding() {
    Navbar.hide();
    const root = document.getElementById('app-root');
    if (!root) return;

    OnboardingPage.loadState();
    root.innerHTML = OnboardingPage.render();
    OnboardingPage.bindEvents(appState, () => {
      localStorage.setItem('coffeering_onboarding_completed', 'true');
      // Upon completion, navigate back to homepage today view
      this.navigate('today');
    });

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  renderBody() {
    const root = document.getElementById('app-root');
    if (!root) return;

    // Direct routing dispatcher to view insights of a specific habit
    const routeToInsights = (habitId) => {
      HabitInsightPage.selectedHabitId = habitId;
      this.navigate('habit-insight');
    };

    if (this.currentTab === 'today') {
      root.innerHTML = TodayPage.render(appState);
      TodayPage.bindEvents(appState, routeToInsights);
    } else if (this.currentTab === 'create') {
      root.innerHTML = CreatePage.render();
      CreatePage.bindEvents(appState, () => {
        // Automatically route back to today view after creating habit
        this.navigate('today');
      });
    } else if (this.currentTab === 'dashboard') {
      root.innerHTML = DashboardPage.render(appState);
      DashboardPage.bindEvents(appState, routeToInsights, () => this.navigate('glossary'));
    } else if (this.currentTab === 'habit-insight') {
      root.innerHTML = HabitInsightPage.render(appState);
      HabitInsightPage.bindEvents(appState, () => this.navigate('glossary'));
    } else if (this.currentTab === 'glossary') {
      root.innerHTML = GlossaryPage.render();
      GlossaryPage.bindEvents();
    } else if (this.currentTab === 'profile') {
      root.innerHTML = ProfilePage.render(appState);
      ProfilePage.bindEvents(
        appState,
        () => this.navigate('onboarding'),
        (tab, options) => this.navigate(tab, options)
      );
    } else if (this.currentTab === 'auth') {
      root.innerHTML = AuthPage.render();
      AuthPage.bindEvents(appState, () => {
        appState.loadStateFromCache();
        this.navigate('today');
      });
    }

    // Call Lucide to compile inline SVG icons dynamically
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }
}

// Bootstrap application once page is fully loaded
window.addEventListener('DOMContentLoaded', () => {
  const app = new AppController();
  app.init();
});
