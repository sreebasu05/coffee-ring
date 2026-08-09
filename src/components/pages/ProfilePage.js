import { supabase } from '../../db/supabaseClient.js';
import { NotificationService } from '../../services/notificationService.js';

export const ProfilePage = {
  render(state) {
    const isGuest = !state.isCloudSynced;
    const profile = state.user;
    const rawUsername = profile?.name || 'Guest';
    const username = rawUsername.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    const email = profile?.email || '';

    // Build initials avatar
    const initials = username.slice(0, 2).toUpperCase();

    const identitySection = isGuest
      ? `
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 rounded-2xl bg-surface-sunken border border-divider flex items-center justify-center text-xl font-bold text-text-secondary flex-shrink-0">
            ${initials}
          </div>
          <div class="flex flex-col gap-0.5">
            <h2 class="text-lg font-bold text-text-primary leading-tight">${username}</h2>
            <p class="text-xs text-text-secondary">Your data is stored locally on this device.</p>
          </div>
        </div>`
      : `
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 rounded-2xl bg-neutral-900 text-white flex items-center justify-center text-xl font-bold flex-shrink-0">
            ${initials}
          </div>
          <div class="flex flex-col gap-0.5">
            <h2 class="text-lg font-bold text-text-primary leading-tight">@${username}</h2>
            ${email ? `<p class="text-xs text-text-secondary">${email}</p>` : ''}
            <span class="inline-flex items-center gap-1 mt-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              <i data-lucide="cloud" class="w-3 h-3"></i>
              Cloud sync active
            </span>
          </div>
        </div>`;

    const storageCard = isGuest
      ? `
        <div class="flex flex-col gap-1.5 px-2 animate-fade-up delay-2">
          <span class="text-[9px] font-black text-text-secondary uppercase tracking-[0.2em]">Storage</span>
          <div class="flex items-center gap-3 p-3.5 bg-surface-card border border-divider rounded-2xl shadow-sm">
            <div class="w-9 h-9 rounded-xl bg-surface-base border border-divider text-text-primary flex items-center justify-center flex-shrink-0">
              <i data-lucide="hard-drive" class="w-4.5 h-4.5"></i>
            </div>
            <div>
              <p class="text-sm font-bold text-text-primary">Local Storage</p>
              <p class="text-[11px] text-text-secondary">Data lives on this device only.</p>
            </div>
          </div>
        </div>`
      : `
        <div class="flex flex-col gap-1.5 px-2 animate-fade-up delay-2">
          <span class="text-[9px] font-black text-text-secondary uppercase tracking-[0.2em]">Storage</span>
          <div class="flex items-center gap-3 p-3.5 bg-surface-card border border-divider rounded-2xl shadow-sm">
            <div class="w-9 h-9 rounded-xl bg-surface-base border border-divider text-text-primary flex items-center justify-center flex-shrink-0">
              <i data-lucide="cloud" class="w-4.5 h-4.5"></i>
            </div>
            <div>
              <p class="text-sm font-bold text-text-primary">Cloud Sync</p>
              <p class="text-[11px] text-text-secondary">Habits backed up and synced across devices.</p>
            </div>
          </div>
        </div>`;

    const remindersCard = !isGuest ? `
        <div class="flex flex-col gap-1.5 px-2 animate-fade-up delay-2">
          <span class="text-[9px] font-black text-text-secondary uppercase tracking-[0.2em]">Notifications</span>
          <div class="flex items-center justify-between p-4 bg-surface-card border border-divider rounded-2xl shadow-sm">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-surface-base border border-divider text-text-primary flex items-center justify-center flex-shrink-0">
                <i data-lucide="bell" class="w-4.5 h-4.5"></i>
              </div>
              <div>
                <p class="text-sm font-bold text-text-primary">Daily Reminders</p>
                <p class="text-[11px] text-text-secondary">Get notified at 8 PM if you forget.</p>
              </div>
            </div>
            <button id="reminders-toggle" class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors bg-neutral-300 dark:bg-neutral-700">
              <span id="reminders-knob" class="inline-block h-4 w-4 translate-x-1 rounded-full bg-white transition-transform"></span>
            </button>
          </div>
          <p id="reminders-error" class="hidden text-xs text-rose-500 mt-1 px-1"></p>
        </div>` : '';

    const guestCta = isGuest
      ? `
        <div class="flex flex-col gap-1.5 px-2 animate-fade-up delay-3">
          <span class="text-[9px] font-black text-text-secondary uppercase tracking-[0.2em]">Upgrade</span>
          <button
            type="button"
            id="profile-signup-btn"
            class="w-full text-left p-4 border border-divider bg-surface-card rounded-2xl shadow-sm hover:shadow-md hover:border-neutral-700 dark:hover:border-neutral-400 transition-all group flex items-center gap-3"
          >
            <div class="w-9 h-9 rounded-xl bg-surface-base border border-divider text-text-primary flex items-center justify-center flex-shrink-0">
              <i data-lucide="user-plus" class="w-4.5 h-4.5"></i>
            </div>
            <div class="flex-1">
              <p class="text-sm font-bold text-text-primary">Create an Eva Account</p>
              <p class="text-[11px] text-text-secondary">Your local habits will be safely migrated.</p>
            </div>
            <i data-lucide="chevron-right" class="w-4 h-4 text-text-secondary group-hover:translate-x-0.5 transition-transform"></i>
          </button>
        </div>`
      : '';

    return `
      <div id="profile-page" class="flex flex-col gap-5 pb-28 px-1 max-w-sm mx-auto">

        <!-- Identity Header -->
        <div class="flex flex-col gap-3 mt-4 px-2 animate-fade-up">
          ${identitySection}
        </div>

        <!-- Storage Mode -->
        ${storageCard}

        <!-- Reminders -->
        ${remindersCard}

        <!-- Guest CTA -->
        ${guestCta}

        <!-- Glossary / Know More -->
        <div class="flex flex-col gap-1.5 px-2 animate-fade-up delay-3">
          <span class="text-[9px] font-black text-text-secondary uppercase tracking-[0.2em]">Resources</span>
          <button
            type="button"
            id="profile-glossary-btn"
            class="w-full text-left p-4 border border-divider bg-surface-card rounded-2xl shadow-sm hover:shadow-md transition-all group flex items-center gap-3"
          >
            <div class="w-9 h-9 rounded-xl bg-surface-base text-text-primary border border-divider flex items-center justify-center flex-shrink-0">
              <i data-lucide="book-open" class="w-4.5 h-4.5"></i>
            </div>
            <div class="flex-1">
              <p class="text-sm font-bold text-text-primary">How It All Works</p>
              <p class="text-[11px] text-text-secondary">Read the glossary and tracking concepts.</p>
            </div>
            <i data-lucide="chevron-right" class="w-4 h-4 text-text-secondary group-hover:translate-x-0.5 transition-transform"></i>
          </button>
        </div>

        <!-- Sign Out -->
        <div class="flex flex-col gap-1.5 px-2 mt-2 animate-fade-up delay-4">
          <button
            type="button"
            id="profile-signout-btn"
            class="w-full py-3.5 px-4 border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-2xl text-sm font-bold transition-all hover:bg-rose-100 dark:hover:bg-rose-950/40 flex items-center justify-center gap-2"
          >
            <i data-lucide="log-out" class="w-4 h-4"></i>
            <span>${isGuest ? 'Clear Local Data & Restart' : 'Sign Out'}</span>
          </button>
          <p class="text-center text-[10px] text-text-secondary px-4">
            ${isGuest 
              ? 'This will erase all local habits and restart the app.' 
              : 'You will be signed out on this device. Your cloud data is safe.'}
          </p>
        </div>
      </div>
    `;
  },

  bindEvents(state, onSignOut, onNavigate) {
    if (window.lucide) window.lucide.createIcons();

    const remindersToggle = document.getElementById('reminders-toggle');
    const remindersKnob = document.getElementById('reminders-knob');
    const remindersError = document.getElementById('reminders-error');

    if (remindersToggle && state.user) {
      // Check initial state
      NotificationService.isSubscribed().then(isSub => {
        if (isSub) {
          remindersToggle.classList.replace('bg-neutral-300', 'bg-emerald-500');
          remindersToggle.classList.replace('dark:bg-neutral-700', 'dark:bg-emerald-500');
          remindersKnob.classList.replace('translate-x-1', 'translate-x-6');
        }
      });

      remindersToggle.addEventListener('click', async () => {
        if (remindersError) {
          remindersError.classList.add('hidden');
          remindersError.textContent = '';
        }

        const isCurrentlySubscribed = await NotificationService.isSubscribed();
        
        // Disable the toggle button during the asynchronous operation
        remindersToggle.style.pointerEvents = 'none';
        remindersKnob.classList.add('opacity-50');

        if (isCurrentlySubscribed) {
          // Optimistically show it turning off
          remindersToggle.classList.replace('bg-emerald-500', 'bg-neutral-300');
          remindersToggle.classList.add('dark:bg-neutral-700');
          remindersKnob.classList.replace('translate-x-6', 'translate-x-1');

          const result = await NotificationService.unsubscribeUser();
          
          remindersToggle.style.pointerEvents = 'auto';
          remindersKnob.classList.remove('opacity-50');

          if (!result || !result.success) {
            // Rollback to turned ON state on failure
            remindersToggle.classList.replace('bg-neutral-300', 'bg-emerald-500');
            remindersToggle.classList.replace('dark:bg-neutral-700', 'dark:bg-emerald-500');
            remindersKnob.classList.replace('translate-x-1', 'translate-x-6');
            if (remindersError) {
              remindersError.textContent = result?.error || 'Failed to disable reminders.';
              remindersError.classList.remove('hidden');
            }
          }
          return;
        }

        // Optimistically show it turning on
        remindersToggle.classList.replace('bg-neutral-300', 'bg-emerald-500');
        remindersToggle.classList.replace('dark:bg-neutral-700', 'dark:bg-emerald-500');
        remindersKnob.classList.replace('translate-x-1', 'translate-x-6');

        const result = await NotificationService.saveSubscription(state.user.id);
        
        remindersToggle.style.pointerEvents = 'auto';
        remindersKnob.classList.remove('opacity-50');

        if (!result || !result.success) {
          // Rollback to turned OFF state on failure
          remindersToggle.classList.replace('bg-emerald-500', 'bg-neutral-300');
          remindersToggle.classList.add('dark:bg-neutral-700');
          remindersKnob.classList.replace('translate-x-6', 'translate-x-1');
          if (remindersError) {
            remindersError.textContent = result?.error || 'Failed to enable reminders. Please check browser permissions.';
            remindersError.classList.remove('hidden');
          }
        }
      });
    }

    const signupBtn = document.getElementById('profile-signup-btn');
    if (signupBtn) {
      signupBtn.addEventListener('click', () => {
        onNavigate('auth', { from: 'profile' });
      });
    }

    const glossaryBtn = document.getElementById('profile-glossary-btn');
    if (glossaryBtn) {
      glossaryBtn.addEventListener('click', () => {
        onNavigate('glossary');
      });
    }

    const signoutBtn = document.getElementById('profile-signout-btn');
    if (signoutBtn) {
      signoutBtn.addEventListener('click', async () => {
        const isGuest = !state.isCloudSynced;

        if (!isGuest) {
          if (supabase) await supabase.auth.signOut();
        }

        // Clear all local state
        localStorage.removeItem('coffeering_user_profile');
        localStorage.removeItem('coffeering_habits');
        localStorage.removeItem('coffeering_check_ins');
        localStorage.removeItem('coffeering_onboarding_completed');
        localStorage.removeItem('coffeering_onboarding_draft');
        localStorage.removeItem('coffeering_category_colors');
        localStorage.removeItem('coffeering_push_prompt_seen');
        state.user = null;
        state.habits = [];
        state.checkIns = [];
        state.isCloudSynced = false;

        onSignOut();
      });
    }
  }
};
