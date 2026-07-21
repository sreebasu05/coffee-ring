import { supabase } from '../../db/supabaseClient.js';
import { StorageManager } from '../../storage/storageManager.js';

export const AuthPage = {
  activeTab: 'signup', // 'login' or 'signup'
  error: '',
  suggestions: [],
  loading: false,

  render() {
    // Detect if the user is ALREADY an active Guest using the app (completed onboarding previously)
    const isExistingGuest = localStorage.getItem('coffeering_onboarding_completed') === 'true';

    const suggestionsHtml = this.suggestions && this.suggestions.length > 0
      ? `<div class="mt-2 text-[10px] text-text-secondary font-bold uppercase tracking-wider">Suggestions:
          <div class="flex gap-1.5 mt-1.5 flex-wrap">
            ${this.suggestions.map(s => `<button type="button" class="suggestion-chip bg-surface-sunken hover:bg-divider border border-divider px-2.5 py-1 rounded-lg font-bold text-xs text-text-primary transition-all">${s}</button>`).join('')}
          </div>
        </div>`
      : '';

    const errorAlert = this.error 
      ? `<div class="bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold p-3.5 rounded-xl flex flex-col gap-1">
          <div class="flex items-center gap-2">
            <i data-lucide="alert-circle" class="w-4 h-4 flex-shrink-0"></i>
            <span>${this.error}</span>
          </div>
          ${suggestionsHtml}
        </div>`
      : '';

    const isSignup = this.activeTab === 'signup';

    const headerTitle = isSignup ? 'Create Your Account' : 'Welcome Back';
    
    let headerSubtitle = '';
    if (isExistingGuest) {
      headerSubtitle = isSignup
        ? 'Your local habits and streak metrics will be safely migrated and linked to your new cloud account.'
        : 'Sign in to fetch your cloud habits and pick up right where you left off.';
    } else {
      headerSubtitle = isSignup 
        ? 'Save your routines to the cloud so your metrics and streaks are safe across all devices.'
        : 'Sign in to fetch your cloud habits and pick up right where you left off.';
    }

    const btnText = this.loading 
      ? 'Connecting...' 
      : (isSignup ? 'Create Account & Sync' : 'Sign In');

    // Attempt to pre-fill name from onboarding profile or draft
    let prefilledUsername = '';
    try {
      const localProfile = JSON.parse(localStorage.getItem('coffeering_user_profile'));
      if (localProfile && localProfile.name && localProfile.name !== 'Guest') {
        prefilledUsername = localProfile.name.toLowerCase().replace(/\s+/g, '');
      }
    } catch (e) {}

    const topHeaderTitle = isExistingGuest ? 'CLOUD SYNC' : 'STEP 4 OF 4';

    const topNavHtml = `
      <div class="flex items-center justify-between w-full">
        <button 
          type="button" 
          id="auth-back-btn" 
          class="w-8 h-8 rounded-full border border-divider bg-surface-card flex items-center justify-center text-text-secondary hover:text-text-primary transition-all shadow-sm"
        >
          <i data-lucide="arrow-left" class="w-4 h-4"></i>
        </button>
        <span class="text-[10px] font-bold text-text-secondary uppercase tracking-wider">${topHeaderTitle}</span>
        <div class="w-8"></div>
      </div>
    `;

    const bottomEscapeHtml = isExistingGuest
      ? `<p class="text-[11px] text-text-secondary leading-relaxed">
          Changed your mind? Return to your local habits anytime.
        </p>
        <button 
          type="button"
          id="auth-guest-btn" 
          class="w-full py-3 px-4 border border-divider rounded-2xl text-xs font-bold text-text-primary bg-surface-card hover:bg-surface-sunken transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          <i data-lucide="calendar" class="w-4 h-4 text-text-secondary"></i>
          <span>Back to My Habits</span>
        </button>`
      : `<p class="text-[11px] text-text-secondary leading-relaxed">
          Want to try Coffee Ring offline first? You can set up an account anytime later.
        </p>
        <button 
          type="button"
          id="auth-guest-btn" 
          class="w-full py-3 px-4 border border-divider rounded-2xl text-xs font-bold text-text-primary bg-surface-card hover:bg-surface-sunken transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          <i data-lucide="hard-drive" class="w-4 h-4 text-text-secondary"></i>
          <span>Continue as Guest (Set up later)</span>
        </button>`;

    return `
      <div id="auth-page-view" class="flex flex-col gap-5 max-w-sm mx-auto py-6 px-4 animate-fade-in text-text-primary">
        
        ${topNavHtml}

        <!-- Hero Header -->
        <div class="flex flex-col items-center text-center gap-2.5">
          <div class="w-13 h-13 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-md">
            <i data-lucide="${isSignup ? 'user-plus' : 'log-in'}" class="w-6 h-6"></i>
          </div>
          <div class="flex flex-col gap-1">
            <h1 class="text-2xl font-bold tracking-tight text-text-primary leading-tight">${headerTitle}</h1>
            <p class="text-xs text-text-secondary leading-relaxed max-w-[280px]">${headerSubtitle}</p>
          </div>

          <!-- Eva Projects badge -->
          <div class="flex items-center gap-1.5 px-3 py-1.5 bg-surface-card border border-divider rounded-full shadow-sm mt-1">
            <div class="w-4 h-4 rounded bg-slate-900 text-white flex items-center justify-center flex-shrink-0">
              <i data-lucide="layers" class="w-2.5 h-2.5"></i>
            </div>
            <span class="text-[10px] font-bold text-text-secondary tracking-wide">Eva Projects</span>
            <div class="w-px h-3 bg-divider mx-0.5"></div>
            <span class="text-[10px] text-text-secondary">One account, all Eva apps</span>
          </div>
        </div>

        <!-- Segmented Tab Toggle -->
        <div class="flex bg-surface-sunken p-1 rounded-2xl w-full border border-divider">
          <button 
            type="button"
            id="auth-tab-signup" 
            class="flex-1 text-xs font-bold py-2 rounded-xl transition-all ${isSignup ? 'bg-surface-card shadow-sm text-text-primary' : 'text-text-secondary hover:text-text-primary'}"
          >
            Sign Up
          </button>
          <button 
            type="button"
            id="auth-tab-login" 
            class="flex-1 text-xs font-bold py-2 rounded-xl transition-all ${!isSignup ? 'bg-surface-card shadow-sm text-text-primary' : 'text-text-secondary hover:text-text-primary'}"
          >
            Sign In
          </button>
        </div>

        <!-- Main Form Card -->
        <div class="bg-surface-card border border-divider rounded-3xl p-5 shadow-sm flex flex-col gap-4">
          ${errorAlert}

          <form id="auth-form" class="flex flex-col gap-4">
            <div class="flex flex-col gap-1.5">
              <label for="auth-username" class="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                ${isSignup ? 'Username' : 'Username or Email'}
              </label>
              <input 
                type="text" 
                id="auth-username" 
                value="${prefilledUsername}" 
                required 
                class="w-full bg-surface-base border border-divider rounded-xl px-3.5 py-3 text-sm font-medium text-text-primary focus:outline-none focus:border-slate-900 dark:focus:border-slate-400 transition-all placeholder:text-text-secondary/50" 
                placeholder="${isSignup ? 'e.g. coffee_master' : 'username or email@example.com'}" 
              />
              <p class="text-[10px] text-text-secondary leading-normal">
                ${isSignup ? 'Only letters, numbers, and underscores.' : 'You can sign in with your username or email address.'}
              </p>
            </div>

            ${isSignup ? `
            <div class="flex flex-col gap-1.5">
              <label for="auth-email" class="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Email Address</label>
              <input 
                type="email" 
                id="auth-email" 
                required
                class="w-full bg-surface-base border border-divider rounded-xl px-3.5 py-3 text-sm font-medium text-text-primary focus:outline-none focus:border-slate-900 dark:focus:border-slate-400 transition-all placeholder:text-text-secondary/50" 
                placeholder="e.g. you@example.com" 
              />
              <p class="text-[10px] text-text-secondary leading-normal">
                Used for account recovery. A real email lets you reset your password later.
              </p>
            </div>` : ''}

            <div class="flex flex-col gap-1.5">
              <label for="auth-password" class="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Password</label>
              <div class="relative w-full flex items-center">
                <input 
                  type="password" 
                  id="auth-password" 
                  required 
                  minlength="6" 
                  class="w-full bg-surface-base border border-divider rounded-xl px-3.5 py-3 pr-10 text-sm font-medium text-text-primary focus:outline-none focus:border-slate-900 dark:focus:border-slate-400 transition-all placeholder:text-text-secondary/50" 
                  placeholder="•••••••• (Min 6 characters)" 
                />
                <button
                  type="button"
                  id="toggle-password-visibility"
                  class="absolute right-3 text-text-secondary hover:text-text-primary transition-colors focus:outline-none"
                  aria-label="Toggle password visibility"
                >
                  <i data-lucide="eye" class="w-4 h-4"></i>
                </button>
              </div>
              <p class="text-[10px] text-text-secondary leading-normal">
                ${isSignup ? 'At least 6 characters to keep your routines secure.' : 'Enter your password to sign in.'}
              </p>
            </div>

            <button 
              type="submit" 
              ${this.loading ? 'disabled' : ''} 
              class="w-full mt-1 bg-slate-900 hover:bg-slate-800 active:scale-98 text-white font-bold py-3.5 rounded-2xl text-sm transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>${btnText}</span>
              <i data-lucide="arrow-right" class="w-4 h-4"></i>
            </button>
          </form>
        </div>

        <!-- Offline / Guest Mode Section -->
        <div class="flex flex-col items-center text-center gap-2 pt-2 border-t border-divider/40">
          ${bottomEscapeHtml}
        </div>
      </div>
    `;
  },

  bindEvents(state, onComplete) {
    const root = document.getElementById('app-root');
    if (!root) return;

    if (window.lucide) {
      window.lucide.createIcons();
    }

    // Tab buttons
    const tabLogin = document.getElementById('auth-tab-login');
    const tabSignup = document.getElementById('auth-tab-signup');
    const guestBtn = document.getElementById('auth-guest-btn');

    if (tabLogin) {
      tabLogin.addEventListener('click', () => {
        if (this.loading) return;
        this.activeTab = 'login';
        this.error = '';
        this.suggestions = [];
        root.innerHTML = this.render();
        this.bindEvents(state, onComplete);
      });
    }

    if (tabSignup) {
      tabSignup.addEventListener('click', () => {
        if (this.loading) return;
        this.activeTab = 'signup';
        this.error = '';
        this.suggestions = [];
        root.innerHTML = this.render();
        this.bindEvents(state, onComplete);
      });
    }

    const backBtn = document.getElementById('auth-back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        const isExistingGuest = localStorage.getItem('coffeering_onboarding_completed') === 'true';
        if (isExistingGuest) {
          window.appController.navigate('today');
        } else {
          // Navigate back to onboarding step 5 (storage choice screen)
          window.appController.navigate('onboarding', { step: 5 });
        }
      });
    }

    const togglePasswordBtn = document.getElementById('toggle-password-visibility');
    const passwordInput = document.getElementById('auth-password');
    if (togglePasswordBtn && passwordInput) {
      togglePasswordBtn.addEventListener('click', () => {
        const isPassword = passwordInput.type === 'password';
        passwordInput.type = isPassword ? 'text' : 'password';
        togglePasswordBtn.innerHTML = `<i data-lucide="${isPassword ? 'eye-off' : 'eye'}" class="w-4 h-4"></i>`;
        if (window.lucide) {
          window.lucide.createIcons();
        }
      });
    }

    if (guestBtn) {
      guestBtn.addEventListener('click', async () => {
        if (this.loading) return;
        
        const isExistingGuest = localStorage.getItem('coffeering_onboarding_completed') === 'true';

        if (isExistingGuest) {
          window.appController.navigate('today');
          return;
        }

        if (supabase) {
          await supabase.auth.signOut();
        }
        // Seed default profile so guest mode starts if they don't have one
        if (!state.user) {
          state.registerUser('Guest', [], false);
        }
        localStorage.setItem('coffeering_onboarding_completed', 'true');
        onComplete();
      });
    }

    // Bind suggestion chips
    document.querySelectorAll('.suggestion-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const input = document.getElementById('auth-username');
        if (input) {
          input.value = chip.textContent.trim();
          this.error = '';
          this.suggestions = [];
          root.innerHTML = this.render();
          this.bindEvents(state, onComplete);
        }
      });
    });

    // Submit handler
    const form = document.getElementById('auth-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (this.loading) return;

        const usernameOrEmail = document.getElementById('auth-username').value.trim();
        const password = document.getElementById('auth-password').value;
        const emailInput = document.getElementById('auth-email');
        const signupEmail = emailInput ? emailInput.value.trim() : '';

        if (this.activeTab === 'signup') {
          // Validation: Username must be alphanumeric/underscores
          const cleanUser = usernameOrEmail.toLowerCase();
          const isValid = /^[a-zA-Z0-9_]+$/.test(cleanUser);
          if (!isValid) {
            this.error = 'Username can only contain letters, numbers, and underscores.';
            this.suggestions = [];
            root.innerHTML = this.render();
            this.bindEvents(state, onComplete);
            return;
          }
          if (!signupEmail) {
            this.error = 'Please enter an email address.';
            root.innerHTML = this.render();
            this.bindEvents(state, onComplete);
            return;
          }
        }

        // Pre-capture guest data to prevent race-condition overwrite by auth state listener
        let guestData = null;
        try {
          guestData = {
            profile: JSON.parse(localStorage.getItem('coffeering_user_profile')),
            colors: JSON.parse(localStorage.getItem('coffeering_category_colors')) || {},
            habits: JSON.parse(localStorage.getItem('coffeering_habits')) || [],
            checkIns: JSON.parse(localStorage.getItem('coffeering_check_ins')) || []
          };
        } catch (e) {}

        this.loading = true;
        this.error = '';
        this.suggestions = [];
        root.innerHTML = this.render();
        this.bindEvents(state, onComplete);

        try {
          if (this.activeTab === 'login') {
            // Sign-in: accept username OR email
            let loginEmail = usernameOrEmail;
            if (!usernameOrEmail.includes('@')) {
              // Treat as username — look up the email from eva_users
              const { data: found, error: lookupError } = await supabase
                .from('eva_users')
                .select('email')
                .eq('username', usernameOrEmail.toLowerCase())
                .single();
              if (lookupError || !found || !found.email) {
                // Fallback: also try the name field (existing users)
                const { data: foundByName } = await supabase
                  .from('eva_users')
                  .select('email')
                  .eq('name', usernameOrEmail.toLowerCase())
                  .single();
                if (!foundByName || !foundByName.email) {
                  throw new Error('No account found with that username. Try signing in with your email.');
                }
                loginEmail = foundByName.email;
              } else {
                loginEmail = found.email;
              }
            }

            const { data, error } = await supabase.auth.signInWithPassword({ email: loginEmail, password });
            if (error) throw error;

            if (data.user) {
              const migrated = await StorageManager.migrateLocalDataToCloud(data.user.id, guestData);
              if (!migrated) {
                await supabase.auth.signOut();
                throw new Error('Failed to synchronize data with cloud. Please try again.');
              }
              await StorageManager.fetchFromSupabase();
            }
          } else {
            // Sign-up: username + real email + password
            const cleanUser = usernameOrEmail.toLowerCase();

            // Uniqueness check on eva_users
            const { data: existingUser } = await supabase
              .from('eva_users')
              .select('id')
              .or(`name.eq.${cleanUser},username.eq.${cleanUser}`)
              .limit(1);

            if (existingUser && existingUser.length > 0) {
              this.error = 'Username is already taken.';
              this.suggestions = [
                cleanUser + Math.floor(10 + Math.random() * 90),
                cleanUser + Math.floor(100 + Math.random() * 900),
                cleanUser + '_runs'
              ];
              throw new Error('Username taken');
            }

            const { data, error } = await supabase.auth.signUp({ 
              email: signupEmail, 
              password,
              options: {
                data: { display_name: cleanUser }
              }
            });
            if (error) throw error;

            if (data.user) {
              // Store username + email in guestData profile so it migrates correctly
              if (guestData && guestData.profile) {
                guestData.profile.name = cleanUser;
                guestData.profile.email = signupEmail;
              } else {
                guestData = { ...guestData, profile: { name: cleanUser, email: signupEmail } };
              }
              const migrated = await StorageManager.migrateLocalDataToCloud(data.user.id, guestData);
              if (!migrated) {
                await supabase.auth.signOut();
                throw new Error('Failed to migrate data to cloud. Please try again.');
              }
              await StorageManager.fetchFromSupabase();
            }
          }

          this.loading = false;
          localStorage.setItem('coffeering_onboarding_completed', 'true');
          onComplete();
        } catch (err) {
          if (err.message !== 'Username taken') {
            // Map common Supabase errors to friendly messages
            if (err.status === 500 || err.message?.includes('500')) {
              this.error = 'Sign up is temporarily unavailable. Please try again in a moment.';
            } else if (err.message?.toLowerCase().includes('email')) {
              this.error = 'There was an issue with the email address. Please try a different one.';
            } else if (err.message?.toLowerCase().includes('password')) {
              this.error = 'Password must be at least 6 characters.';
            } else if (err.message?.toLowerCase().includes('already registered')) {
              this.error = 'An account with this email already exists. Try signing in instead.';
            } else {
              this.error = err.message || 'Authentication failed. Please try again.';
            }
          }
          this.loading = false;
          root.innerHTML = this.render();
          this.bindEvents(state, onComplete);
        }
      });
    }
  }
};
