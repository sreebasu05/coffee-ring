import { APP_CONFIG } from '../config/appConfig.js';
import { supabase, isSupabaseConfigured } from '../db/supabaseClient.js';

// LocalStorage Keys
const KEYS = {
  USER_PROFILE: 'coffeering_user_profile',
  HABITS: 'coffeering_habits',
  CHECK_INS: 'coffeering_check_ins',
  CATEGORY_COLORS: 'coffeering_category_colors'
};

const getDefaultCategoryColors = () => {
  const map = {};
  APP_CONFIG.categories.forEach(cat => {
    map[cat.id] = cat.defaultColor;
  });
  return map;
};

// Seed 7 default starter habits
const STARTER_PRESET_IDS = [
  'preset_gym', 'preset_steps', 'preset_water', 'preset_calories',
  'preset_junkfood', 'preset_bathing', 'preset_spend'
];

const getDefaultHabits = () => APP_CONFIG.presets
  .filter(p => STARTER_PRESET_IDS.includes(p.id))
  .map((preset, index) => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dateStr = `${thirtyDaysAgo.getFullYear()}-${String(thirtyDaysAgo.getMonth() + 1).padStart(2, '0')}-${String(thirtyDaysAgo.getDate()).padStart(2, '0')}`;
    const isGym = preset.id === 'preset_gym';
    return {
      id: `habit_seed_${index}`,
      name: preset.name,
      type: preset.type,
      category: preset.category,
      weeklyTarget: preset.weeklyTarget || 7,
      weeklyTargetHistory: [{ date: dateStr, target: preset.weeklyTarget || 7 }],
      days: isGym ? ['Mon', 'Wed', 'Fri'] : null,
      minGoal: preset.minGoal || null,
      maxGoal: preset.maxGoal || null,
      unit: preset.unit,
      icon: preset.icon,
      tags: [...preset.tags],
      createdAt: thirtyDaysAgo.toISOString()
    };
  });

export const StorageManager = {
  // Helper to check if user is currently running in Guest mode
  isGuestMode() {
    try {
      const profile = JSON.parse(localStorage.getItem(KEYS.USER_PROFILE));
      return !profile || profile.name === 'Guest';
    } catch (e) {
      return true;
    }
  },

  // Helper to check if a user is logged into Supabase
  async getSupabaseUser() {
    if (!isSupabaseConfigured || !supabase) return null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    } catch (e) {
      console.warn('Supabase auth check failed (offline or network error):', e);
      return null;
    }
  },

  init(forceReset = false) {
    if (forceReset) {
      localStorage.removeItem(KEYS.USER_PROFILE);
      localStorage.removeItem(KEYS.HABITS);
      localStorage.removeItem(KEYS.CHECK_INS);
      localStorage.removeItem(KEYS.CATEGORY_COLORS);
      localStorage.removeItem('coffeering_onboarding_draft');
    }
    
    // If not registered yet, do not seed default values
    if (!localStorage.getItem(KEYS.USER_PROFILE)) {
      return;
    }
    
    let habits = null;
    if (!localStorage.getItem(KEYS.HABITS)) {
      habits = [];
      localStorage.setItem(KEYS.HABITS, JSON.stringify(habits));
    }

    if (!localStorage.getItem(KEYS.CHECK_INS)) {
      localStorage.setItem(KEYS.CHECK_INS, JSON.stringify([]));
    }
    
    if (!localStorage.getItem(KEYS.CATEGORY_COLORS)) {
      localStorage.setItem(KEYS.CATEGORY_COLORS, JSON.stringify(getDefaultCategoryColors()));
    }
  },

  // Pull all data from Supabase and cache it in LocalStorage
  async fetchFromSupabase() {
    const user = await this.getSupabaseUser();
    if (!user) return false;

    try {
      // 1. Fetch Profile
      const { data: profile } = await supabase
        .from('eva_users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        localStorage.setItem(KEYS.USER_PROFILE, JSON.stringify({ name: profile.name, email: profile.email || '' }));
        if (profile.category_colors) {
          localStorage.setItem(KEYS.CATEGORY_COLORS, JSON.stringify(profile.category_colors));
        }
      } else {
        // Create profile if not exists (e.g. first login after Google OAuth)
        const name = user.email ? user.email.split('@')[0] : 'user';
        await supabase.from('eva_users').insert({
          id: user.id,
          name,
          email: user.email || '',
          category_colors: getDefaultCategoryColors()
        });
        localStorage.setItem(KEYS.USER_PROFILE, JSON.stringify({ name, email: user.email || '' }));
      }

      // 2. Fetch Remote Habits & Bidirectionally Merge
      const { data: remoteHabitsRaw } = await supabase
        .from('cr_habits')
        .select('*')
        .eq('user_id', user.id);

      const localHabits = JSON.parse(localStorage.getItem(KEYS.HABITS)) || [];

      const remoteHabits = (remoteHabitsRaw || []).map(h => ({
        id: h.id,
        name: h.name,
        type: h.type,
        category: h.category,
        weeklyTarget: h.weekly_target,
        weeklyTargetHistory: h.weekly_target_history || [],
        days: h.days || null,
        minGoal: h.min_goal || null,
        maxGoal: h.max_goal || null,
        unit: h.unit,
        icon: h.icon,
        tags: h.tags || [],
        createdAt: h.created_at
      }));

      const habitMap = new Map();
      remoteHabits.forEach(h => habitMap.set(h.id, h));
      localHabits.forEach(h => {
        if (!habitMap.has(h.id)) {
          habitMap.set(h.id, h);
          supabase.from('cr_habits').upsert({
            id: h.id,
            user_id: user.id,
            name: h.name,
            type: h.type,
            category: h.category,
            weekly_target: h.weeklyTarget,
            weekly_target_history: h.weeklyTargetHistory || [],
            days: h.days || null,
            min_goal: h.minGoal || null,
            max_goal: h.maxGoal || null,
            unit: h.unit,
            icon: h.icon,
            tags: h.tags || []
          }).then(({ error }) => {
            if (error) console.error('Error syncing local habit to cloud:', error);
          });
        }
      });

      const mergedHabits = Array.from(habitMap.values());
      localStorage.setItem(KEYS.HABITS, JSON.stringify(mergedHabits));

      // 3. Fetch Remote Check-ins & Bidirectionally Merge
      const { data: remoteCheckInsRaw } = await supabase
        .from('cr_check_ins')
        .select('*')
        .eq('user_id', user.id);

      const localCheckIns = JSON.parse(localStorage.getItem(KEYS.CHECK_INS)) || [];

      const remoteCheckIns = (remoteCheckInsRaw || []).map(c => ({
        id: c.id,
        habitId: c.habit_id,
        date: c.date,
        value: c.value ? parseFloat(c.value) : null,
        note: c.notes || '',
        tags: c.tags || [],
        completed: c.completed !== false,
        timestamp: new Date(c.created_at).getTime()
      }));

      const checkInMap = new Map();
      remoteCheckIns.forEach(c => checkInMap.set(`${c.habitId}_${c.date}`, c));

      localCheckIns.forEach(c => {
        const key = `${c.habitId}_${c.date}`;
        const existing = checkInMap.get(key);

        if (!existing) {
          checkInMap.set(key, c);
          supabase.from('cr_check_ins').upsert({
            user_id: user.id,
            habit_id: c.habitId,
            date: c.date,
            value: c.value,
            notes: c.note || '',
            tags: c.tags || [],
            completed: c.completed !== false
          }).then(({ error }) => {
            if (error) console.error('Error syncing local check-in to cloud:', error);
          });
        } else {
          if (c.completed === true && existing.completed !== true) {
            checkInMap.set(key, c);
            supabase.from('cr_check_ins').upsert({
              user_id: user.id,
              habit_id: c.habitId,
              date: c.date,
              value: c.value !== undefined ? c.value : existing.value,
              notes: c.note || existing.note || '',
              tags: c.tags || existing.tags || [],
              completed: true
            }).then(({ error }) => {
              if (error) console.error('Error syncing updated check-in to cloud:', error);
            });
          }
        }
      });

      const mergedCheckIns = Array.from(checkInMap.values());
      localStorage.setItem(KEYS.CHECK_INS, JSON.stringify(mergedCheckIns));
      return true;

    } catch (err) {
      console.error('Error fetching data from Supabase:', err);
      return false;
    }
  },

  async migrateLocalDataToCloud(userId, localData = null) {
    if (!isSupabaseConfigured || !supabase) return false;

    try {
      // Check if user already has habits in the cloud (returning user)
      const { data: cloudHabits } = await supabase
        .from('cr_habits')
        .select('id')
        .eq('user_id', userId)
        .limit(1);

      if (cloudHabits && cloudHabits.length > 0) {
        console.log('User already has habits in Supabase. Skipping local migration.');
        return true; // Return true so AppState proceeds to load their cloud data
      }

      // Read local cache from argument or fallback to localStorage
      const profile = localData ? localData.profile : JSON.parse(localStorage.getItem(KEYS.USER_PROFILE));
      const colors = localData ? localData.colors : (JSON.parse(localStorage.getItem(KEYS.CATEGORY_COLORS)) || {});
      const habits = localData ? localData.habits : (JSON.parse(localStorage.getItem(KEYS.HABITS)) || []);
      const checkIns = localData ? localData.checkIns : (JSON.parse(localStorage.getItem(KEYS.CHECK_INS)) || []);

      // 1. Migrate Profile & Category Colors
      if (profile) {
        await supabase.from('eva_users').upsert({
          id: userId,
          name: profile.name,
          email: profile.email || '',
          category_colors: colors
        });
      }

      // 2. Migrate Habits
      for (const h of habits) {
        await supabase.from('cr_habits').upsert({
          id: h.id,
          user_id: userId,
          name: h.name,
          type: h.type,
          category: h.category,
          weekly_target: h.weeklyTarget,
          weekly_target_history: h.weeklyTargetHistory || [],
          days: h.days || null,
          min_goal: h.minGoal || null,
          max_goal: h.maxGoal || null,
          unit: h.unit,
          icon: h.icon,
          tags: h.tags || []
        });
      }

      // 3. Migrate Check-ins
      for (const c of checkIns) {
        await supabase.from('cr_check_ins').upsert({
          user_id: userId,
          habit_id: c.habitId,
          date: c.date,
          value: c.value,
          notes: c.note || '',
          tags: c.tags || []
        });
      }

      return true;
    } catch (err) {
      console.error('Error migrating local data to Supabase:', err);
      return false;
    }
  },

  registerUser(name, chosenPresetIds = [], generateHistory = false) {
    const userProfile = { name };
    localStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(userProfile));
    localStorage.setItem(KEYS.CATEGORY_COLORS, JSON.stringify(getDefaultCategoryColors()));

    // Get preset list
    const presets = APP_CONFIG.presets || [];
    const habits = presets
      .filter(p => chosenPresetIds.includes(p.id))
      .map((preset, index) => ({
        id: `habit_preset_${Date.now()}_${index}`,
        name: preset.name,
        type: preset.type,
        category: preset.category,
        weeklyTarget: preset.weeklyTarget || 7,
        minGoal: preset.minGoal || null,
        maxGoal: preset.maxGoal || null,
        unit: preset.unit,
        icon: preset.icon,
        tags: [...preset.tags],
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      }));

    localStorage.setItem(KEYS.HABITS, JSON.stringify(habits));
    localStorage.setItem(KEYS.CHECK_INS, JSON.stringify([]));
  },

  seedHistoryForCurrentHabits() {
    return [];
  },

  getUserProfile() {
    this.init();
    return JSON.parse(localStorage.getItem(KEYS.USER_PROFILE));
  },

  saveProfile(profile) {
    localStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(profile));
    
    // Background cloud update
    this.getSupabaseUser().then(user => {
      if (user && supabase) {
        supabase.from('eva_users').upsert({
          id: user.id,
          name: profile.name,
          email: profile.email || ''
        }).then(({ error }) => {
          if (error) console.error('Supabase profile save error:', error);
        });
      }
    });
  },

  getHabits() {
    this.init();
    return JSON.parse(localStorage.getItem(KEYS.HABITS));
  },

  saveHabit(habit) {
    const habits = this.getHabits();
    const index = habits.findIndex(h => h.id === habit.id);
    if (index >= 0) {
      habits[index] = habit;
    } else {
      habits.push(habit);
    }
    localStorage.setItem(KEYS.HABITS, JSON.stringify(habits));

    // Background cloud update
    this.getSupabaseUser().then(user => {
      if (user && supabase) {
        supabase.from('cr_habits').upsert({
          id: habit.id,
          user_id: user.id,
          name: habit.name,
          type: habit.type,
          category: habit.category,
          weekly_target: habit.weeklyTarget,
          weekly_target_history: habit.weeklyTargetHistory || [],
          days: habit.days || null,
          min_goal: habit.minGoal || null,
          max_goal: habit.maxGoal || null,
          unit: habit.unit,
          icon: habit.icon,
          tags: habit.tags || []
        }).then(({ error }) => {
          if (error) console.error('Supabase habit save error:', error);
        });
      }
    });

    return habits;
  },

  saveHabitsList(habits) {
    localStorage.setItem(KEYS.HABITS, JSON.stringify(habits));
    return habits;
  },

  deleteHabit(id) {
    const habits = this.getHabits().filter(h => h.id !== id);
    localStorage.setItem(KEYS.HABITS, JSON.stringify(habits));
    
    const checkIns = this.getCheckIns().filter(c => c.habitId !== id);
    localStorage.setItem(KEYS.CHECK_INS, JSON.stringify(checkIns));

    // Background cloud update
    this.getSupabaseUser().then(user => {
      if (user && supabase) {
        // Check-ins delete automatically via CASCADE schema rules
        supabase.from('cr_habits').delete().eq('id', id).eq('user_id', user.id).then(({ error }) => {
          if (error) console.error('Supabase habit delete error:', error);
        });
      }
    });

    return habits;
  },

  getCheckIns() {
    this.init();
    const raw = localStorage.getItem(KEYS.CHECK_INS);
    if (!raw) return [];
    try {
      return JSON.parse(raw) || [];
    } catch (e) {
      return [];
    }
  },

  saveCheckIn(checkIn) {
    const logs = this.getCheckIns();
    const index = logs.findIndex(log => log.habitId === checkIn.habitId && log.date === checkIn.date);
    
    if (index >= 0) {
      const existing = logs[index];
      const val = checkIn.value !== undefined ? checkIn.value : existing.value;
      logs[index] = { 
        ...existing, 
        ...checkIn,
        value: val
      };
    } else {
      logs.push(checkIn);
    }
    localStorage.setItem(KEYS.CHECK_INS, JSON.stringify(logs));

    // Background cloud update
    this.getSupabaseUser().then(user => {
      if (user && supabase) {
        supabase.from('cr_check_ins').upsert({
          user_id: user.id,
          habit_id: checkIn.habitId,
          date: checkIn.date,
          value: checkIn.value,
          notes: checkIn.note || '',
          tags: checkIn.tags || [],
          completed: checkIn.completed !== false
        }).then(({ error }) => {
          if (error) console.error('Supabase checkin save error:', error);
        });
      }
    });

    return logs;
  },

  removeCheckIn(habitId, date) {
    const logs = this.getCheckIns().filter(log => !(log.habitId === habitId && log.date === date));
    localStorage.setItem(KEYS.CHECK_INS, JSON.stringify(logs));

    // Background cloud update
    this.getSupabaseUser().then(user => {
      if (user && supabase) {
        supabase.from('cr_check_ins').delete()
          .eq('user_id', user.id)
          .eq('habit_id', habitId)
          .eq('date', date)
          .then(({ error }) => {
            if (error) console.error('Supabase checkin delete error:', error);
          });
      }
    });

    return logs;
  },

  getCategoryColors() {
    this.init();
    return JSON.parse(localStorage.getItem(KEYS.CATEGORY_COLORS));
  },

  saveCategoryColors(colorMap) {
    localStorage.setItem(KEYS.CATEGORY_COLORS, JSON.stringify(colorMap));

    if (this.isGuestMode()) return;
    // Background cloud update
    this.getSupabaseUser().then(user => {
      if (user && supabase) {
        supabase.from('cr_profiles').update({
          category_colors: colorMap
        }).eq('id', user.id).then(({ error }) => {
          if (error) console.error('Supabase category colors save error:', error);
        });
      }
    });
  }
};
