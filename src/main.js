import { appState } from './state/appState.js';
import { Navbar } from './components/ui/Navbar.js';
import { TodayPage } from './components/pages/TodayPage.js';
import { CreatePage } from './components/pages/CreatePage.js';
import { DashboardPage } from './components/pages/DashboardPage.js';
import { HabitInsightPage } from './components/pages/HabitInsightPage.js';
import { OnboardingPage } from './components/pages/OnboardingPage.js';

class AppController {
  constructor() {
    this.currentTab = 'today'; // Tracks virtual routing
  }

  init() {
    // Initialize Dark Mode Check
    const isDark = localStorage.getItem('coffeering_dark_mode') === 'true';
    document.documentElement.classList.toggle('dark', isDark);

    // 1. Initialize State & Data
    appState.init();
    window.appState = appState;

    // 2. Setup onboarding global handlers
    window.OnboardingGoToStep = (stepNum) => {
      OnboardingPage.step = stepNum;
      OnboardingPage.saveState();
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
  navigate(tabName) {
    this.currentTab = tabName;
    window.scrollTo(0, 0);
    this.render();
  }

  render() {
    const navRoot = document.getElementById('nav-root');
    
    // If user is not onboarded, hide navigation and force onboarding view
    if (appState.user === null) {
      if (navRoot) {
        navRoot.innerHTML = '';
      }
      this.renderOnboarding();
      return;
    }

    // Always render dynamic navbar for onboarded users
    Navbar.render(this.currentTab, (tab) => this.navigate(tab));
    
    // Render dynamic page body
    this.renderBody();
  }

  renderOnboarding() {
    const root = document.getElementById('app-root');
    if (!root) return;

    OnboardingPage.loadState();
    root.innerHTML = OnboardingPage.render();
    OnboardingPage.bindEvents(appState, () => {
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
      DashboardPage.bindEvents(appState, routeToInsights);
    } else if (this.currentTab === 'habit-insight') {
      root.innerHTML = HabitInsightPage.render(appState);
      HabitInsightPage.bindEvents(appState);
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
