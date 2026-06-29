export const Navbar = {
  render(currentTab, onTabChange) {
    const nav = document.getElementById('bottom-navbar');
    if (!nav) return;

    // Apply high-contrast light theme colors: white background with gray border and charcoal/black text
    nav.className = "fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 py-2.5 px-4 z-40 max-w-md mx-auto flex justify-around items-center rounded-t-2xl shadow-lg";

    nav.innerHTML = `
      <button id="nav-today" class="flex flex-col items-center gap-1 transition-all ${
        currentTab === 'today' ? 'text-slate-900 font-bold scale-105' : 'text-slate-400 hover:text-slate-600'
      }">
        <i data-lucide="calendar" class="w-4.5 h-4.5"></i>
        <span class="text-[9px] font-semibold tracking-wide">Today</span>
      </button>
      
      <button id="nav-create" class="flex flex-col items-center gap-1 transition-all ${
        currentTab === 'create' ? 'text-slate-900 font-bold scale-105' : 'text-slate-400 hover:text-slate-600'
      }">
        <i data-lucide="plus-circle" class="w-4.5 h-4.5"></i>
        <span class="text-[9px] font-semibold tracking-wide">Add Habit</span>
      </button>

      <button id="nav-dashboard" class="flex flex-col items-center gap-1 transition-all ${
        currentTab === 'dashboard' ? 'text-slate-900 font-bold scale-105' : 'text-slate-400 hover:text-slate-600'
      }">
        <i data-lucide="bar-chart" class="w-4.5 h-4.5"></i>
        <span class="text-[9px] font-semibold tracking-wide">Dashboard</span>
      </button>

      <button id="nav-insights" class="flex flex-col items-center gap-1 transition-all ${
        currentTab === 'habit-insight' ? 'text-slate-900 font-bold scale-105' : 'text-slate-400 hover:text-slate-600'
      }">
        <i data-lucide="line-chart" class="w-4.5 h-4.5"></i>
        <span class="text-[9px] font-semibold tracking-wide">Insights</span>
      </button>
    `;

    // Event hooks
    document.getElementById('nav-today').addEventListener('click', () => onTabChange('today'));
    document.getElementById('nav-create').addEventListener('click', () => onTabChange('create'));
    document.getElementById('nav-dashboard').addEventListener('click', () => onTabChange('dashboard'));
    document.getElementById('nav-insights').addEventListener('click', () => onTabChange('habit-insight'));
  }
};
