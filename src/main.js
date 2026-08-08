import { appState } from './state/appState.js';
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
    window.scrollTo(0, 0);
    this.render();
  }

  render() {
    const navRoot = document.getElementById('nav-root');
    
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
        (tab) => this.navigate(tab)
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
